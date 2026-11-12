import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { API, errMsg } from "./api.js";
import {
  Icon, Cover, Dashboard, BooksPage, BookForm, EditBook,
  MembersPage, MemberForm, IssuePage, TransactionsPage, ReportsPage,
} from "./pages.jsx";

const NAV = [
  ["/dashboard", "Dashboard", "home"],
  ["/books", "Books", "book"],
  ["/members", "Members", "users"],
  ["/transactions", "Transactions", "repeat"],
  ["/reports", "Reports", "chart"],
];

const fetchAll = async () => {
  const [b, m, t, s] = await Promise.all([
    axios.get(`${API}/books`),
    axios.get(`${API}/members`),
    axios.get(`${API}/transactions`),
    axios.get(`${API}/reports/summary`),
  ]);
  return { books: b.data, members: m.data, txns: t.data, summary: s.data, loaded: true };
};

export default function App() {
  const { pathname } = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [data, setData] = useState({ books: [], members: [], txns: [], summary: {}, loaded: false });
  const [offline, setOffline] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    let ignore = false;
    fetchAll()
      .then((d) => { if (!ignore) { setData(d); setOffline(false); } })
      .catch(() => { if (!ignore) setOffline(true); });
    return () => { ignore = true; };
  }, []);

  const reload = () =>
    fetchAll()
      .then((d) => { setData(d); setOffline(false); })
      .catch(() => setOffline(true));

  const toast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 2200);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/books/${toDelete.id}`);
      toast("Book deleted");
      await reload();
    } catch (e) {
      toast(errMsg(e), "error");
    }
    setToDelete(null);
  };

  const lib = { data, reload, toast, askDelete: setToDelete };
  const isCover = pathname === "/";

  const routes = (
    <Routes>
      <Route path="/" element={<Cover lib={lib} />} />
      <Route path="/dashboard" element={<Dashboard lib={lib} />} />
      <Route path="/books" element={<BooksPage lib={lib} />} />
      <Route path="/books/add" element={<BookForm lib={lib} />} />
      <Route path="/books/edit/:id" element={<EditBook lib={lib} />} />
      <Route path="/members" element={<MembersPage lib={lib} />} />
      <Route path="/members/add" element={<MemberForm lib={lib} />} />
      <Route path="/issue" element={<IssuePage lib={lib} />} />
      <Route path="/transactions" element={<TransactionsPage lib={lib} />} />
      <Route path="/reports" element={<ReportsPage lib={lib} />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );

  return (
    <>
      <div className="bg" aria-hidden="true">
        <span className="orb o1" /><span className="orb o2" /><span className="orb o3" />
      </div>

      <button className="ghost theme-fab" onClick={() => setDark(!dark)}>{dark ? "Light" : "Dark"}</button>

      {isCover ? routes : (
        <div className="shell">
          <nav className="side">
            <NavLink to="/" className="brand">Library<small>Management</small></NavLink>
            {NAV.map(([to, label, icon]) => (
              <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                <Icon name={icon} /><span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <main className="main">
            {offline && <p className="error">Cannot reach the server on port 5001. Is it running?</p>}
            {routes}
          </main>
        </div>
      )}

      {toDelete && (
        <div className="overlay" onClick={() => setToDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete book?</h3>
            <p className="muted">{toDelete.title} will be permanently removed.</p>
            <div className="actions end">
              <button className="btn" onClick={() => setToDelete(null)}>Cancel</button>
              <button className="btn solid-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className={`toast ${toastMsg.type}`}>{toastMsg.msg}</div>}
    </>
  );
}
