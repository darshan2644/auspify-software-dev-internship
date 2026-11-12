import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, fmt, money, errMsg } from "./api.js";

const SHADES = ["#ff2d7a", "#7c6cf0", "#ff9a3c", "#10b981", "#0ea5e9", "#a855f7"];
const shade = (id) => SHADES[id % SHADES.length];
const statusCls = (s) => (s === "In stock" ? "ok" : s === "Low stock" ? "warn" : "bad");

const ICONS = {
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  plus: "M12 5v14M5 12h14",
  repeat: "M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",
  chart: "M18 20V10M12 20V4M6 20v-6",
};

export function Icon({ name }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Banner({ title, sub, icon, children }) {
  return (
    <div className="banner">
      <div className="banner-text">
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
        {children && <div className="banner-actions">{children}</div>}
      </div>
      <div className="banner-art" aria-hidden="true">
        <span className="blob b1" /><span className="blob b2" />
        <div className="badge-icon"><Icon name={icon} /></div>
      </div>
    </div>
  );
}

const Stat = ({ value, label }) => (
  <div className="stat"><span>{value}</span><small>{label}</small></div>
);

/* ---------- Dashboard ---------- */
export function Dashboard({ lib }) {
  const { summary: s, lowStock, movements } = lib.data;
  return (
    <>
      <Banner title="Welcome back" sub="Here is how your inventory looks today." icon="home">
        <Link className="btn white" to="/products/add">+ Add product</Link>
        <Link className="btn outline" to="/stock">Update stock</Link>
      </Banner>
      <div className="stats">
        <Stat value={s.products ?? 0} label="Products" />
        <Stat value={s.total_units ?? 0} label="Total units" />
        <Stat value={money(s.stock_value)} label="Stock value" />
        <Stat value={s.low_stock ?? 0} label="Low stock" />
      </div>
      <div className="two">
        <div className="card">
          <h3>Needs attention</h3>
          {lowStock.length === 0 ? <p className="muted empty">All products are well stocked.</p> : lowStock.slice(0, 5).map((p) => (
            <div className="row" key={p.id}>
              <div className="dot" style={{ background: shade(p.id) }}>{p.name[0].toUpperCase()}</div>
              <div className="row-main"><b>{p.name}</b><span className="muted">{p.sku} - min {p.min_stock}</span></div>
              <span className={"pill " + statusCls(p.status)}>{p.quantity} left</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Recent movements</h3>
          {movements.length === 0 ? <p className="muted empty">No movements yet.</p> : movements.slice(0, 5).map((m) => (
            <div className="row" key={m.id}>
              <div className={"dot " + (m.type === "IN" ? "in" : "out")}>{m.type === "IN" ? "+" : "-"}</div>
              <div className="row-main"><b>{m.product}</b><span className="muted">{fmt(m.created_at)}</span></div>
              <span className={"pill " + (m.type === "IN" ? "ok" : "bad")}>{m.type === "IN" ? "+" : "-"}{m.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- Products ---------- */
export function ProductsPage({ lib }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [stock, setStock] = useState("");
  const { products, categories } = lib.data;
  const list = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase()) &&
    (!cat || String(p.category_id) === cat) &&
    (!stock ||
      (stock === "low" && p.status === "Low stock") ||
      (stock === "out" && p.status === "Out of stock") ||
      (stock === "in" && p.status === "In stock"))
  );
  return (
    <>
      <Banner title="Products" sub={`${list.length} items in your catalogue`} icon="box">
        <Link className="btn white" to="/products/add">+ Add product</Link>
      </Banner>
      <div className="filters">
        <input className="search" placeholder="Search name or SKU..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="chips">
          {[["", "All"], ["in", "In stock"], ["low", "Low"], ["out", "Out"]].map(([v, l]) => (
            <button key={l} type="button" className={stock === v ? "chip-btn on" : "chip-btn"} onClick={() => setStock(v)}>{l}</button>
          ))}
        </div>
      </div>
      {list.length === 0 ? <p className="card muted empty">No products found.</p> : (
        <div className="cards">
          {list.map((p, i) => {
            const cap = Math.max(p.min_stock * 3, p.quantity, 1);
            return (
              <article key={p.id} className="book" style={{ "--c": shade(p.id), "--i": i }}>
                <div className="book-cover">
                  <span>{p.name[0].toUpperCase()}</span>
                  <em className={"pill " + statusCls(p.status)}>{p.status}</em>
                </div>
                <div className="book-body">
                  <h3>{p.name}</h3>
                  <p className="muted">{p.sku}</p>
                  <div className="book-meta">{p.category && <span className="tag">{p.category}</span>}</div>
                  <div className="meter"><span className={statusCls(p.status)} style={{ width: Math.min(100, (p.quantity / cap) * 100) + "%" }} /></div>
                  <div className="price-row"><b className="price">{money(p.price)}</b><span className="muted">{p.quantity} units</span></div>
                  <div className="row-actions">
                    <Link className="link" to={`/products/edit/${p.id}`}>Edit</Link>
                    <button className="link danger" onClick={() => lib.askDelete(p)}>Delete</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

const emptyProduct = { name: "", sku: "", category_id: "", price: "", quantity: 0, min_stock: 5 };

export function ProductForm({ lib, initial }) {
  const nav = useNavigate();
  const [f, setF] = useState(
    initial
      ? { name: initial.name, sku: initial.sku, category_id: initial.category_id || "", price: initial.price, quantity: initial.quantity, min_stock: initial.min_stock }
      : emptyProduct
  );
  const [newCat, setNewCat] = useState("");
  const [error, setError] = useState("");
  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      const r = await axios.post(`${API}/categories`, { name: newCat });
      await lib.reload();
      setF({ ...f, category_id: r.data.id });
      setNewCat("");
    } catch (err) { setError(errMsg(err)); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!f.name.trim() || !f.sku.trim()) return setError("Name and SKU are required.");
    if (Number(f.price) < 0 || Number(f.quantity) < 0) return setError("Price and quantity cannot be negative.");
    try {
      if (initial) await axios.put(`${API}/products/${initial.id}`, f);
      else await axios.post(`${API}/products`, f);
      lib.toast(initial ? "Product updated" : "Product added");
      await lib.reload();
      nav("/products");
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <>
      <Banner title={initial ? "Edit product" : "Add product"} sub="Fill in the details and save" icon="plus" />
      <div className="form-wrap">
        <form className="card" onSubmit={submit} autoComplete="off">
          {error && <p className="error">{error}</p>}
          <div className="grid">
            <label>Name<input name="name" value={f.name} onChange={set} /></label>
            <label>SKU<input name="sku" value={f.sku} onChange={set} /></label>
            <label>Category
              <select name="category_id" value={f.category_id} onChange={set}>
                <option value="">None</option>
                {lib.data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>New category
              <div className="inline">
                <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="e.g. Electronics" />
                <button type="button" className="btn" onClick={addCategory}>Add</button>
              </div>
            </label>
            <label>Price (Rs)<input name="price" type="number" min="0" step="0.01" value={f.price} onChange={set} /></label>
            {!initial && <label>Opening quantity<input name="quantity" type="number" min="0" value={f.quantity} onChange={set} /></label>}
            <label>Minimum stock alert<input name="min_stock" type="number" min="0" value={f.min_stock} onChange={set} /></label>
          </div>
          <div className="actions">
            <button className="btn primary" type="submit">{initial ? "Save changes" : "Add product"}</button>
            <Link className="btn" to="/products">Cancel</Link>
          </div>
        </form>
        <aside className="tips">
          <h3>Quick tips</h3>
          <ul>
            <li>SKU must be unique for every product.</li>
            <li>Set a minimum stock so you get a low-stock alert.</li>
            <li>Opening quantity is saved as the first stock movement.</li>
            <li>Use stock in and out later to change quantity.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}

export function EditProduct({ lib }) {
  const { id } = useParams();
  if (!lib.data.loaded) return <div className="spinner" />;
  const p = lib.data.products.find((x) => String(x.id) === id);
  if (!p) return <p className="card muted empty">Product not found.</p>;
  return <ProductForm key={id} lib={lib} initial={p} />;
}

/* ---------- Stock ---------- */
export function StockPage({ lib }) {
  const [f, setF] = useState({ product_id: "", type: "IN", quantity: 1, note: "" });
  const [error, setError] = useState("");
  const { products, movements } = lib.data;
  const selected = products.find((p) => String(p.id) === String(f.product_id));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!f.product_id) return setError("Select a product.");
    try {
      await axios.post(`${API}/stock`, f);
      lib.toast(f.type === "IN" ? "Stock added" : "Stock removed");
      setF({ ...f, quantity: 1, note: "" });
      lib.reload();
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <>
      <Banner title="Stock" sub="Record stock in and stock out" icon="repeat" />
      <div className="two">
        <form className="card" onSubmit={submit} autoComplete="off">
          <h3>Update stock</h3>
          {error && <p className="error">{error}</p>}
          <div className="toggle">
            <button type="button" className={f.type === "IN" ? "t-in on" : "t-in"} onClick={() => setF({ ...f, type: "IN" })}>+ Stock in</button>
            <button type="button" className={f.type === "OUT" ? "t-out on" : "t-out"} onClick={() => setF({ ...f, type: "OUT" })}>- Stock out</button>
          </div>
          <div className="grid one">
            <label>Product
              <select value={f.product_id} onChange={(e) => setF({ ...f, product_id: e.target.value })}>
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.quantity} in stock)</option>)}
              </select>
            </label>
            <label>Quantity<input type="number" min="1" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} /></label>
            <label>Note<input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Optional" /></label>
          </div>
          {selected && <p className="muted hint">Current stock: <b>{selected.quantity}</b> units</p>}
          <div className="actions"><button className="btn primary" type="submit">Update stock</button></div>
        </form>
        <div className="card">
          <h3>Recent movements</h3>
          {movements.length === 0 ? <p className="muted empty">No movements yet.</p> : movements.slice(0, 8).map((m) => (
            <div className="row" key={m.id}>
              <div className={"dot " + (m.type === "IN" ? "in" : "out")}>{m.type === "IN" ? "+" : "-"}</div>
              <div className="row-main"><b>{m.product}</b><span className="muted">{m.note || "-"} - {fmt(m.created_at)}</span></div>
              <span className={"pill " + (m.type === "IN" ? "ok" : "bad")}>{m.type === "IN" ? "+" : "-"}{m.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- Reports ---------- */
function Donut({ parts }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const R = 52, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="donut">
      <circle cx="70" cy="70" r={R} fill="none" stroke="#efeaff" strokeWidth="18" />
      {parts.map((p) => {
        const len = (p.value / total) * C;
        const el = (
          <circle key={p.label} cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="18"
            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />
        );
        offset += len;
        return el;
      })}
      <text x="70" y="68" textAnchor="middle" className="d-num">{parts.reduce((a, p) => a + p.value, 0)}</text>
      <text x="70" y="86" textAnchor="middle" className="d-lbl">products</text>
    </svg>
  );
}

export function ReportsPage({ lib }) {
  const { summary: s, byCategory, lowStock } = lib.data;
  const max = Math.max(1, ...byCategory.map((c) => c.value));
  const good = Math.max(0, (s.products ?? 0) - (s.low_stock ?? 0) - (s.out_of_stock ?? 0));
  const parts = [
    { label: "In stock", value: good, color: "#10b981" },
    { label: "Low stock", value: s.low_stock ?? 0, color: "#ff9a3c" },
    { label: "Out of stock", value: s.out_of_stock ?? 0, color: "#ff2d7a" },
  ];
  return (
    <>
      <Banner title="Reports" sub="Inventory insights at a glance" icon="chart" />
      <div className="stats">
        <Stat value={s.products ?? 0} label="Products" />
        <Stat value={s.total_units ?? 0} label="Total units" />
        <Stat value={s.low_stock ?? 0} label="Low stock" />
        <Stat value={s.out_of_stock ?? 0} label="Out of stock" />
      </div>
      <div className="two">
        <div className="card">
          <h3>Stock health</h3>
          <div className="donut-wrap">
            <Donut parts={parts} />
            <ul className="legend">
              {parts.map((p) => <li key={p.label}><i style={{ background: p.color }} />{p.label}<b>{p.value}</b></li>)}
            </ul>
          </div>
        </div>
        <div className="card">
          <h3>Total stock value</h3>
          <p className="big-number">{money(s.stock_value)}</p>
          <p className="muted">Across {s.categories ?? 0} categories</p>
          {byCategory.length === 0 ? <p className="muted">No data.</p> : byCategory.map((c) => (
            <div key={c.category} className="cat">
              <div className="cat-label"><span>{c.category} ({c.units} units)</span><b>{money(c.value)}</b></div>
              <div className="bar"><span style={{ width: (c.value / max) * 100 + "%" }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Low and out of stock</h3>
        {lowStock.length === 0 ? <p className="muted empty">Nothing to restock.</p> : lowStock.map((p) => (
          <div className="row" key={p.id}>
            <div className="dot" style={{ background: shade(p.id) }}>{p.name[0].toUpperCase()}</div>
            <div className="row-main"><b>{p.name}</b><span className="muted">{p.sku} - minimum {p.min_stock}</span></div>
            <span className={"pill " + statusCls(p.status)}>{p.status}: {p.quantity}</span>
          </div>
        ))}
      </div>
    </>
  );
}
