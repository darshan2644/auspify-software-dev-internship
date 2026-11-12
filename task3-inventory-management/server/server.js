require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const fail = (res, e) => {
  if (e.code === "23505") return res.status(400).json({ error: "Duplicate value (SKU or category already exists)" });
  if (e.code === "23514") return res.status(400).json({ error: "Invalid value (negative price or stock not allowed)" });
  if (e.code === "23503") return res.status(400).json({ error: "Invalid category" });
  console.error(e);
  res.status(500).json({ error: e.message });
};

const PRODUCT_SELECT = `
  SELECT p.*, p.price::float AS price, c.name AS category,
    CASE WHEN p.quantity = 0 THEN 'Out of stock'
         WHEN p.quantity <= p.min_stock THEN 'Low stock'
         ELSE 'In stock' END AS status,
    (p.quantity * p.price)::float AS stock_value
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

// ---------- Categories ----------
app.get("/api/categories", async (req, res) => {
  try { res.json((await pool.query("SELECT * FROM categories ORDER BY name")).rows); }
  catch (e) { fail(res, e); }
});
app.post("/api/categories", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ error: "Category name is required" });
    res.status(201).json((await pool.query("INSERT INTO categories (name) VALUES ($1) RETURNING *", [name])).rows[0]);
  } catch (e) { fail(res, e); }
});

// ---------- Products (search + filter) ----------
app.get("/api/products", async (req, res) => {
  try {
    const { search = "", category = "", stock = "" } = req.query;
    const params = [`%${search}%`];
    let sql = PRODUCT_SELECT + " WHERE (p.name ILIKE $1 OR p.sku ILIKE $1)";
    if (category) { params.push(category); sql += ` AND p.category_id = $${params.length}`; }
    if (stock === "low") sql += " AND p.quantity > 0 AND p.quantity <= p.min_stock";
    if (stock === "out") sql += " AND p.quantity = 0";
    if (stock === "in") sql += " AND p.quantity > p.min_stock";
    res.json((await pool.query(sql + " ORDER BY p.id DESC", params)).rows);
  } catch (e) { fail(res, e); }
});

app.post("/api/products", async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, sku, category_id, price, quantity, min_stock } = req.body;
    if (!name?.trim() || !sku?.trim()) return res.status(400).json({ error: "Name and SKU are required" });
    const qty = Number(quantity) || 0;
    await client.query("BEGIN");
    const r = await client.query(
      `INSERT INTO products (name, sku, category_id, price, quantity, min_stock)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name.trim(), sku.trim(), category_id || null, Number(price) || 0, qty, Number(min_stock) || 5]);
    if (qty > 0) {
      await client.query("INSERT INTO stock_movements (product_id, type, quantity, note) VALUES ($1,'IN',$2,'Opening stock')", [r.rows[0].id, qty]);
    }
    await client.query("COMMIT");
    res.status(201).json(r.rows[0]);
  } catch (e) { await client.query("ROLLBACK"); fail(res, e); }
  finally { client.release(); }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { name, sku, category_id, price, min_stock } = req.body;
    const r = await pool.query(
      `UPDATE products SET name=$1, sku=$2, category_id=$3, price=$4, min_stock=$5 WHERE id=$6 RETURNING *`,
      [name, sku, category_id || null, Number(price) || 0, Number(min_stock) || 0, req.params.id]);
    r.rows[0] ? res.json(r.rows[0]) : res.status(404).json({ error: "Product not found" });
  } catch (e) { fail(res, e); }
});

app.delete("/api/products/:id", async (req, res) => {
  try { await pool.query("DELETE FROM products WHERE id=$1", [req.params.id]); res.json({ message: "Deleted" }); }
  catch (e) { fail(res, e); }
});

// ---------- Stock in / out ----------
app.post("/api/stock", async (req, res) => {
  const { product_id, type, quantity, note } = req.body;
  const qty = Number(quantity);
  if (!["IN", "OUT"].includes(type)) return res.status(400).json({ error: "Type must be IN or OUT" });
  if (!Number.isInteger(qty) || qty < 1) return res.status(400).json({ error: "Quantity must be a whole number of at least 1" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const p = await client.query("SELECT quantity FROM products WHERE id=$1 FOR UPDATE", [product_id]);
    if (!p.rows[0]) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Product not found" }); }
    if (type === "OUT" && p.rows[0].quantity < qty) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Not enough stock. Only ${p.rows[0].quantity} available.` });
    }
    const delta = type === "IN" ? qty : -qty;
    const upd = await client.query("UPDATE products SET quantity = quantity + $1 WHERE id=$2 RETURNING *", [delta, product_id]);
    await client.query("INSERT INTO stock_movements (product_id, type, quantity, note) VALUES ($1,$2,$3,$4)", [product_id, type, qty, note || null]);
    await client.query("COMMIT");
    res.status(201).json(upd.rows[0]);
  } catch (e) { await client.query("ROLLBACK"); fail(res, e); }
  finally { client.release(); }
});

app.get("/api/movements", async (req, res) => {
  try {
    res.json((await pool.query(
      `SELECT m.id, m.type, m.quantity, m.note, m.created_at, p.name AS product, p.sku
       FROM stock_movements m JOIN products p ON p.id = m.product_id
       ORDER BY m.id DESC LIMIT 200`)).rows);
  } catch (e) { fail(res, e); }
});

// ---------- Reports ----------
app.get("/api/reports/summary", async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products)::int AS products,
        (SELECT COALESCE(SUM(quantity),0) FROM products)::int AS total_units,
        (SELECT COALESCE(SUM(quantity*price),0) FROM products)::float AS stock_value,
        (SELECT COUNT(*) FROM products WHERE quantity > 0 AND quantity <= min_stock)::int AS low_stock,
        (SELECT COUNT(*) FROM products WHERE quantity = 0)::int AS out_of_stock,
        (SELECT COUNT(*) FROM categories)::int AS categories`);
    res.json(r.rows[0]);
  } catch (e) { fail(res, e); }
});

app.get("/api/reports/low-stock", async (req, res) => {
  try { res.json((await pool.query(PRODUCT_SELECT + " WHERE p.quantity <= p.min_stock ORDER BY p.quantity")).rows); }
  catch (e) { fail(res, e); }
});

app.get("/api/reports/by-category", async (req, res) => {
  try {
    res.json((await pool.query(`
      SELECT COALESCE(c.name,'Uncategorised') AS category,
             COUNT(p.id)::int AS products,
             COALESCE(SUM(p.quantity),0)::int AS units,
             COALESCE(SUM(p.quantity*p.price),0)::float AS value
      FROM products p LEFT JOIN categories c ON c.id = p.category_id
      GROUP BY c.name ORDER BY value DESC`)).rows);
  } catch (e) { fail(res, e); }
});

const PORT = process.env.PORT || 5002;
pool.query("SELECT 1")
  .then(() => {
    console.log("PostgreSQL connected");
    app.listen(PORT, () => console.log("Server running on port " + PORT));
  })
  .catch((e) => console.error("DB connection failed:", e.message));
