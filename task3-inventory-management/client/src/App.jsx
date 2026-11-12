import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { API, errMsg } from "./api.js";
import { Cover } from "./cover.jsx";
import {
  Icon, Dashboard, ProductsPage, ProductForm, EditProduct, StockPage, ReportsPage,
} from "./pages.jsx";

const NAV = [
  ["/", "Home", "home"],
  ["/dashboard", "Dashboard", "chart"],
  ["/products", "Products", "box"],
  ["/stock", "Stock", "repeat"],
  ["/reports", "Reports", "chart"],
];

const fetchAll = async () => {
  const [p, c, m, s, l, b] = await Promise.all([
    axios.get(`${API}/products`),
    axios.get(`${API}/categories`),
    axios.get(`${API}/movements`),
    axios.get(`${API}/reports/summary`),
    axios.get(`${API}/reports/low-stock`),
    axios.get(`${API}/reports/by-category`),
  ]);
  return { products: p.data, categories: c.data, movements: m.data, summary: s.data, lowStock: l.data, byCategory: b.data, loaded: true };
};

const initial = { products: [], categories: [], movements: [], summary: {}, lowStock: [], byCategory: [], loaded: false };

export default function App() {
  const { pathname } = useLocation();
  const [data, setData] = useState(initial);
  const [offline, setOffline] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [toDelete, setToDelete] = useState(null);

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
      await axios.delete(`${API}/products/${toDelete.id}`);
      toast("Product deleted");
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
      <Route path="/products" element={<ProductsPage lib={lib} />} />
      <Route path="/products/add" element={<ProductForm lib={lib} />} />
      <Route path="/products/edit/:id" element={<EditProduct lib={lib} />} />
      <Route path="/stock" element={<StockPage lib={lib} />} />
      <Route path="/reports" element={<ReportsPage lib={lib} />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );

  return (
    <>
      <header className="topbar">
        <NavLink to="/" className="brand">Stock<b>Hub</b></NavLink>
        <nav className="links">
          {NAV.map(([to, label, icon]) => (
            <NavLink key={to} to={to} end className={({ isActive }) => (isActive ? "nl active" : "nl")}>
              <Icon name={icon} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      {offline && <p className="error offline">Cannot reach the server on port 5002. Is it running?</p>}

      {isCover ? routes : <main className="panel">{routes}</main>}

      {toDelete && (
        <div className="overlay" onClick={() => setToDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete product?</h3>
            <p className="muted">{toDelete.name} and its stock history will be permanently removed.</p>
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
