require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const fail = (res, e) => {
  if (e.code === "23505") return res.status(400).json({ error: "Duplicate value (ISBN or email already exists)" });
  if (e.code === "23503") return res.status(400).json({ error: "Record is in use and cannot be deleted" });
  if (e.code === "23514") return res.status(400).json({ error: "Total copies cannot be less than copies currently issued" });
  console.error(e);
  res.status(500).json({ error: e.message });
};

// ---------- Books ----------
app.get("/api/books", async (req, res) => {
  try {
    const q = `%${req.query.search || ""}%`;
    const r = await pool.query(
      `SELECT * FROM books
       WHERE title ILIKE $1 OR author ILIKE $1 OR COALESCE(isbn,'') ILIKE $1 OR COALESCE(category,'') ILIKE $1
       ORDER BY id DESC`, [q]);
    res.json(r.rows);
  } catch (e) { fail(res, e); }
});

app.post("/api/books", async (req, res) => {
  try {
    const { title, author, isbn, category, total_copies } = req.body;
    const copies = Number(total_copies) || 1;
    if (!title?.trim() || !author?.trim()) return res.status(400).json({ error: "Title and author are required" });
    if (copies < 1) return res.status(400).json({ error: "Copies must be at least 1" });
    const r = await pool.query(
      `INSERT INTO books (title, author, isbn, category, total_copies, available_copies)
       VALUES ($1,$2,$3,$4,$5,$5) RETURNING *`,
      [title.trim(), author.trim(), isbn?.trim() || null, category?.trim() || null, copies]);
    res.status(201).json(r.rows[0]);
  } catch (e) { fail(res, e); }
});

app.put("/api/books/:id", async (req, res) => {
  try {
    const { title, author, isbn, category, total_copies } = req.body;
    const copies = Number(total_copies) || 1;
    const r = await pool.query(
      `UPDATE books SET title=$1, author=$2, isbn=$3, category=$4,
         available_copies = available_copies + ($5 - total_copies),
         total_copies = $5
       WHERE id=$6 RETURNING *`,
      [title, author, isbn?.trim() || null, category || null, copies, req.params.id]);
    r.rows[0] ? res.json(r.rows[0]) : res.status(404).json({ error: "Book not found" });
  } catch (e) { fail(res, e); }
});

app.delete("/api/books/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM books WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (e) { fail(res, e); }
});

// ---------- Members ----------
app.get("/api/members", async (req, res) => {
  try {
    res.json((await pool.query("SELECT * FROM members ORDER BY id DESC")).rows);
  } catch (e) { fail(res, e); }
});

app.post("/api/members", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: "Name and email are required" });
    const r = await pool.query(
      "INSERT INTO members (name, email, phone) VALUES ($1,$2,$3) RETURNING *",
      [name.trim(), email.trim(), phone || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { fail(res, e); }
});

// ---------- Issue and return ----------
app.post("/api/issue", async (req, res) => {
  const { book_id, member_id, days } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const b = await client.query("SELECT available_copies FROM books WHERE id=$1 FOR UPDATE", [book_id]);
    if (!b.rows[0]) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Book not found" }); }
    if (b.rows[0].available_copies < 1) { await client.query("ROLLBACK"); return res.status(400).json({ error: "No copies available" }); }
    const m = await client.query("SELECT id FROM members WHERE id=$1", [member_id]);
    if (!m.rows[0]) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Member not found" }); }

    const t = await client.query(
      `INSERT INTO transactions (book_id, member_id, due_date)
       VALUES ($1,$2, CURRENT_DATE + $3::int) RETURNING *`, [book_id, member_id, Number(days) || 14]);
    await client.query("UPDATE books SET available_copies = available_copies - 1 WHERE id=$1", [book_id]);
    await client.query("COMMIT");
    res.status(201).json(t.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    fail(res, e);
  } finally { client.release(); }
});

app.post("/api/return/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const t = await client.query(
      "UPDATE transactions SET return_date = CURRENT_DATE WHERE id=$1 AND return_date IS NULL RETURNING *",
      [req.params.id]);
    if (!t.rows[0]) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Not issued or already returned" }); }
    await client.query("UPDATE books SET available_copies = available_copies + 1 WHERE id=$1", [t.rows[0].book_id]);
    await client.query("COMMIT");
    res.json(t.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    fail(res, e);
  } finally { client.release(); }
});

// ---------- Transactions and reports ----------
const txnQuery = `
  SELECT t.id, t.issue_date, t.due_date, t.return_date,
         b.title, b.author, m.name AS member_name,
         CASE WHEN t.return_date IS NOT NULL THEN 'Returned'
              WHEN t.due_date < CURRENT_DATE THEN 'Overdue'
              ELSE 'Issued' END AS status
  FROM transactions t
  JOIN books b ON b.id = t.book_id
  JOIN members m ON m.id = t.member_id`;

app.get("/api/transactions", async (req, res) => {
  try { res.json((await pool.query(txnQuery + " ORDER BY t.id DESC")).rows); }
  catch (e) { fail(res, e); }
});

app.get("/api/reports/issued", async (req, res) => {
  try { res.json((await pool.query(txnQuery + " WHERE t.return_date IS NULL ORDER BY t.due_date")).rows); }
  catch (e) { fail(res, e); }
});

app.get("/api/reports/overdue", async (req, res) => {
  try { res.json((await pool.query(txnQuery + " WHERE t.return_date IS NULL AND t.due_date < CURRENT_DATE ORDER BY t.due_date")).rows); }
  catch (e) { fail(res, e); }
});

app.get("/api/reports/summary", async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM books)::int AS titles,
        (SELECT COALESCE(SUM(total_copies),0) FROM books)::int AS total_copies,
        (SELECT COALESCE(SUM(available_copies),0) FROM books)::int AS available_copies,
        (SELECT COUNT(*) FROM members)::int AS members,
        (SELECT COUNT(*) FROM transactions WHERE return_date IS NULL)::int AS issued,
        (SELECT COUNT(*) FROM transactions WHERE return_date IS NULL AND due_date < CURRENT_DATE)::int AS overdue`);
    res.json(r.rows[0]);
  } catch (e) { fail(res, e); }
});

const PORT = process.env.PORT || 5001;
pool.query("SELECT 1")
  .then(() => {
    console.log("PostgreSQL connected");
    app.listen(PORT, () => console.log("Server running on port " + PORT));
  })
  .catch((e) => console.error("DB connection failed:", e.message));
