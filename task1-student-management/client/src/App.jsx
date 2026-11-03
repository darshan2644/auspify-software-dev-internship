import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api/students";
const emptyForm = { name: "", email: "", age: "", course: "" };

export default function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  const loadStudents = async () => {
    try {
      const res = await axios.get(API);
      setStudents(res.data);
    } catch {
      showToast("Cannot reach the server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await axios.get(API);
        if (!ignore) setStudents(res.data);
      } catch {
        if (!ignore) setError("Cannot reach the server. Is it running on port 5000?");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.course.trim()) {
      return setError("Name, email and course are required.");
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return setError("Please enter a valid email address.");
    }
    const payload = { ...form, age: form.age ? Number(form.age) : undefined };
    try {
      if (editId) {
        await axios.put(`${API}/${editId}`, payload);
        showToast("Student updated");
      } else {
        await axios.post(API, payload);
        showToast("Student added");
      }
      setForm(emptyForm);
      setEditId(null);
      loadStudents();
    } catch (err) {
      const msg = err.response?.data?.error || "Something went wrong.";
      setError(msg.includes("duplicate") ? "That email already exists." : msg);
    }
  };

  const handleEdit = (s) => {
    setEditId(s._id);
    setForm({ name: s.name, email: s.email, age: s.age ?? "", course: s.course });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditId(null);
    setForm(emptyForm);
    setError("");
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/${toDelete._id}`);
      showToast("Student deleted");
      loadStudents();
    } catch {
      showToast("Delete failed", "error");
    }
    setToDelete(null);
  };

  const filtered = students.filter((s) =>
    `${s.name} ${s.email} ${s.course}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="bg" aria-hidden="true">
        <span className="orb o1" />
        <span className="orb o2" />
        <span className="orb o3" />
      </div>

      <div className="container">
        <header className="header">
          <div>
            <h1>Students</h1>
            <p className="subtitle">
              {students.length} {students.length === 1 ? "record" : "records"}
            </p>
          </div>
          <button className="ghost" onClick={() => setDark(!dark)}>
            {dark ? "Light" : "Dark"}
          </button>
        </header>

        <form className="card" onSubmit={handleSubmit}>
          <h2>{editId ? "Edit student" : "New student"}</h2>
          {error && <p className="error">{error}</p>}
          <div className="grid">
            <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} />
            <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
            <input name="age" type="number" placeholder="Age" value={form.age} onChange={handleChange} />
            <input name="course" placeholder="Course" value={form.course} onChange={handleChange} />
          </div>
          <div className="actions">
            <button type="submit" className="btn primary">
              {editId ? "Update" : "Add student"}
            </button>
            {editId && (
              <button type="button" className="btn" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="card">
          <div className="table-head">
            <h2>All students</h2>
            <input
              className="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="spinner" />
          ) : filtered.length === 0 ? (
            <p className="muted empty">No students found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Age</th>
                    <th>Course</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s._id} style={{ "--i": i }}>
                      <td className="strong">{s.name}</td>
                      <td className="muted">{s.email}</td>
                      <td>{s.age ?? "-"}</td>
                      <td>
                        <span className="tag">{s.course}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="link" onClick={() => handleEdit(s)}>Edit</button>
                          <button className="link danger" onClick={() => setToDelete(s)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toDelete && (
        <div className="overlay" onClick={() => setToDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete student?</h3>
            <p className="muted">
              {toDelete.name} will be permanently removed.
            </p>
            <div className="actions end">
              <button className="btn" onClick={() => setToDelete(null)}>Cancel</button>
              <button className="btn solid-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}