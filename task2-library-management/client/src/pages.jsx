import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, fmt, errMsg } from "./api.js";

const SHADES = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9", "#8b5cf6"];
const shade = (id) => SHADES[id % SHADES.length];
const initials = (n) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
const statusCls = (s) => (s === "Returned" ? "ok" : s === "Overdue" ? "bad" : "info");

const ICONS = {
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  plus: "M12 5v14M5 12h14",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
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

function Head({ title, sub, children }) {
  return (
    <div className="page-head">
      <div>
        <h2 className="page-title">{title}</h2>
        {sub && <p className="subtitle">{sub}</p>}
      </div>
      <div className="head-actions">{children}</div>
    </div>
  );
}

function TxnRow({ t, onReturn }) {
  return (
    <div className="row">
      <div className="row-main">
        <b>{t.title}</b>
        <span className="muted">{t.member_name} - due {fmt(t.due_date)}</span>
      </div>
      <span className={"pill " + statusCls(t.status)}>{t.status}</span>
      {onReturn && t.status !== "Returned" && (
        <button className="btn small" onClick={() => onReturn(t.id)}>Return</button>
      )}
    </div>
  );
}

/* ---------------- Cover ---------------- */
export function Cover({ lib }) {
  const s = lib.data.summary;
  return (
    <section className="cover">
      <div className="cover-inner">
        <span className="eyebrow">Auspify Internship - Task 2</span>
        <h1 className="cover-title">
          Your library,<br /><em>beautifully organised.</em>
        </h1>
        <p className="cover-sub">
          Add books, register members, issue and return in a click, and keep an eye on overdue titles.
        </p>
        <div className="cover-actions">
          <Link className="btn primary big" to="/dashboard">Enter library</Link>
          <Link className="btn big" to="/books/add">Add a book</Link>
        </div>
        <div className="cover-stats">
          <div><b>{s.titles ?? 0}</b><span>Titles</span></div>
          <div><b>{s.members ?? 0}</b><span>Members</span></div>
          <div><b>{s.issued ?? 0}</b><span>Issued</span></div>
        </div>
      </div>
      <div className="shelf" aria-hidden="true">
        {[...Array(11)].map((_, i) => (
          <i key={i} style={{ "--h": 110 + ((i * 37) % 100) + "px", "--c": SHADES[i % SHADES.length], "--d": i * 0.12 + "s" }} />
        ))}
      </div>
    </section>
  );
}

/* ---------------- Dashboard ---------------- */
export function Dashboard({ lib }) {
  const { summary: s, txns } = lib.data;
  return (
    <>
      <Head title="Dashboard" sub="Overview of your library" />
      <div className="stats">
        <div className="stat"><span>{s.titles ?? 0}</span><small>Titles</small></div>
        <div className="stat"><span>{s.available_copies ?? 0}</span><small>Copies available</small></div>
        <div className="stat"><span>{s.issued ?? 0}</span><small>Currently issued</small></div>
        <div className="stat"><span>{s.overdue ?? 0}</span><small>Overdue</small></div>
      </div>
      <div className="quick">
        <Link to="/books/add" className="quick-card"><Icon name="plus" /><b>Add book</b><span>Add a new title</span></Link>
        <Link to="/members/add" className="quick-card"><Icon name="users" /><b>Add member</b><span>Register a reader</span></Link>
        <Link to="/issue" className="quick-card"><Icon name="repeat" /><b>Issue book</b><span>Lend a book</span></Link>
      </div>
      <div className="card">
        <h3>Recent activity</h3>
        {txns.length === 0 ? <p className="muted empty">No activity yet.</p> : txns.slice(0, 5).map((t) => <TxnRow key={t.id} t={t} />)}
      </div>
    </>
  );
}

/* ---------------- Books ---------------- */
export function BooksPage({ lib }) {
  const [q, setQ] = useState("");
  const list = lib.data.books.filter((b) =>
    `${b.title} ${b.author} ${b.isbn || ""} ${b.category || ""}`.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <>
      <Head title="Books" sub={`${list.length} records`}>
        <input className="search" placeholder="Search title, author, ISBN..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Link className="btn primary" to="/books/add">+ Add book</Link>
      </Head>
      {list.length === 0 ? (
        <p className="card muted empty">No books found.</p>
      ) : (
        <div className="cards">
          {list.map((b, i) => (
            <article key={b.id} className="book" style={{ "--c": shade(b.id), "--i": i }}>
              <div className="book-cover"><span>{b.title[0].toUpperCase()}</span></div>
              <div className="book-body">
                <h3>{b.title}</h3>
                <p className="muted">{b.author}</p>
                <div className="book-meta">
                  {b.category && <span className="tag">{b.category}</span>}
                  <span className={"pill " + (b.available_copies > 0 ? "ok" : "bad")}>{b.available_copies}/{b.total_copies} available</span>
                </div>
                <div className="row-actions">
                  <Link className="link" to={`/books/edit/${b.id}`}>Edit</Link>
                  <button className="link danger" onClick={() => lib.askDelete(b)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

const emptyBook = { title: "", author: "", isbn: "", category: "", total_copies: 1 };

export function BookForm({ lib, initial }) {
  const nav = useNavigate();
  const [f, setF] = useState(
    initial
      ? { title: initial.title, author: initial.author, isbn: initial.isbn || "", category: initial.category || "", total_copies: initial.total_copies }
      : emptyBook
  );
  const [error, setError] = useState("");
  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!f.title.trim() || !f.author.trim()) return setError("Title and author are required.");
    try {
      if (initial) await axios.put(`${API}/books/${initial.id}`, f);
      else await axios.post(`${API}/books`, f);
      lib.toast(initial ? "Book updated" : "Book added");
      await lib.reload();
      nav("/books");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <Head title={initial ? "Edit book" : "Add book"} sub="Fill in the details below" />
      <form className="card form-card" onSubmit={submit}>
        {error && <p className="error">{error}</p>}
        <div className="grid">
          <label>Title<input name="title" value={f.title} onChange={set} placeholder="Clean Code" /></label>
          <label>Author<input name="author" value={f.author} onChange={set} placeholder="Robert Martin" /></label>
          <label>ISBN<input name="isbn" value={f.isbn} onChange={set} placeholder="9780132350884" /></label>
          <label>Category<input name="category" value={f.category} onChange={set} placeholder="Programming" /></label>
          <label>Total copies<input name="total_copies" type="number" min="1" value={f.total_copies} onChange={set} /></label>
        </div>
        <div className="actions">
          <button className="btn primary" type="submit">{initial ? "Save changes" : "Add book"}</button>
          <Link className="btn" to="/books">Cancel</Link>
        </div>
      </form>
    </>
  );
}

export function EditBook({ lib }) {
  const { id } = useParams();
  if (!lib.data.loaded) return <div className="spinner" />;
  const b = lib.data.books.find((x) => String(x.id) === id);
  if (!b) return <p className="card muted empty">Book not found.</p>;
  return <BookForm key={id} lib={lib} initial={b} />;
}

/* ---------------- Members ---------------- */
export function MembersPage({ lib }) {
  const { members } = lib.data;
  return (
    <>
      <Head title="Members" sub={`${members.length} records`}>
        <Link className="btn primary" to="/members/add">+ Add member</Link>
      </Head>
      <div className="card">
        {members.length === 0 ? <p className="muted empty">No members yet.</p> : members.map((m) => (
          <div className="row" key={m.id}>
            <div className="avatar" style={{ background: shade(m.id) }}>{initials(m.name)}</div>
            <div className="row-main"><b>{m.name}</b><span className="muted">{m.email}</span></div>
            <span className="muted">{m.phone || "-"}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function MemberForm({ lib }) {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!f.name.trim() || !f.email.trim()) return setError("Name and email are required.");
    try {
      await axios.post(`${API}/members`, f);
      lib.toast("Member added");
      await lib.reload();
      nav("/members");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <Head title="Add member" sub="Register a new reader" />
      <form className="card form-card" onSubmit={submit}>
        {error && <p className="error">{error}</p>}
        <div className="grid">
          <label>Full name<input name="name" value={f.name} onChange={set} /></label>
          <label>Email<input name="email" value={f.email} onChange={set} /></label>
          <label>Phone<input name="phone" value={f.phone} onChange={set} /></label>
        </div>
        <div className="actions">
          <button className="btn primary" type="submit">Add member</button>
          <Link className="btn" to="/members">Cancel</Link>
        </div>
      </form>
    </>
  );
}

/* ---------------- Issue and transactions ---------------- */
export function IssuePage({ lib }) {
  const nav = useNavigate();
  const { books, members } = lib.data;
  const [f, setF] = useState({ book_id: "", member_id: "", days: 14 });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!f.book_id || !f.member_id) return setError("Select a book and a member.");
    try {
      await axios.post(`${API}/issue`, f);
      lib.toast("Book issued");
      await lib.reload();
      nav("/transactions");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <Head title="Issue a book" sub="Lend a title to a member" />
      <form className="card form-card" onSubmit={submit}>
        {error && <p className="error">{error}</p>}
        <div className="grid">
          <label>Book
            <select value={f.book_id} onChange={(e) => setF({ ...f, book_id: e.target.value })}>
              <option value="">Select book</option>
              {books.filter((b) => b.available_copies > 0).map((b) => (
                <option key={b.id} value={b.id}>{b.title} ({b.available_copies} left)</option>
              ))}
            </select>
          </label>
          <label>Member
            <select value={f.member_id} onChange={(e) => setF({ ...f, member_id: e.target.value })}>
              <option value="">Select member</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label>Days<input type="number" min="1" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} /></label>
        </div>
        <div className="actions">
          <button className="btn primary" type="submit">Issue book</button>
          <Link className="btn" to="/transactions">Cancel</Link>
        </div>
      </form>
    </>
  );
}

export function TransactionsPage({ lib }) {
  const [filter, setFilter] = useState("All");
  const { txns } = lib.data;
  const list = filter === "All" ? txns : txns.filter((t) => t.status === filter);

  const onReturn = async (id) => {
    try {
      await axios.post(`${API}/return/${id}`);
      lib.toast("Book returned");
      lib.reload();
    } catch (err) {
      lib.toast(errMsg(err), "error");
    }
  };

  return (
    <>
      <Head title="Transactions" sub={`${list.length} records`}>
        <Link className="btn primary" to="/issue">+ Issue book</Link>
      </Head>
      <div className="tabs">
        {["All", "Issued", "Overdue", "Returned"].map((s) => (
          <button key={s} className={filter === s ? "tab active" : "tab"} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>
      <div className="card">
        {list.length === 0 ? <p className="muted empty">Nothing here.</p> : list.map((t) => <TxnRow key={t.id} t={t} onReturn={onReturn} />)}
      </div>
    </>
  );
}

/* ---------------- Reports ---------------- */
export function ReportsPage({ lib }) {
  const { books, txns, summary: s } = lib.data;
  const out = (s.total_copies ?? 0) - (s.available_copies ?? 0);
  const pct = s.total_copies ? Math.round((out / s.total_copies) * 100) : 0;
  const cats = {};
  books.forEach((b) => {
    const k = b.category || "Uncategorised";
    cats[k] = (cats[k] || 0) + b.total_copies;
  });
  const max = Math.max(1, ...Object.values(cats));
  const overdue = txns.filter((t) => t.status === "Overdue");

  return (
    <>
      <Head title="Reports" sub="Insights at a glance" />
      <div className="stats">
        <div className="stat"><span>{s.total_copies ?? 0}</span><small>Total copies</small></div>
        <div className="stat"><span>{s.available_copies ?? 0}</span><small>Available</small></div>
        <div className="stat"><span>{s.issued ?? 0}</span><small>Issued</small></div>
        <div className="stat"><span>{s.overdue ?? 0}</span><small>Overdue</small></div>
      </div>
      <div className="two">
        <div className="card">
          <h3>Utilisation</h3>
          <p className="muted">{pct}% of copies are currently out</p>
          <div className="bar big-bar"><span style={{ width: pct + "%" }} /></div>
        </div>
        <div className="card">
          <h3>Copies by category</h3>
          {Object.keys(cats).length === 0 ? <p className="muted">No data.</p> : Object.entries(cats).map(([k, v]) => (
            <div key={k} className="cat">
              <div className="cat-label"><span>{k}</span><b>{v}</b></div>
              <div className="bar"><span style={{ width: (v / max) * 100 + "%" }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Overdue books</h3>
        {overdue.length === 0 ? <p className="muted empty">No overdue books.</p> : overdue.map((t) => <TxnRow key={t.id} t={t} />)}
      </div>
    </>
  );
}
