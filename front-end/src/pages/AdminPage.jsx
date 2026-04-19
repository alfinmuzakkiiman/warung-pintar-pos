import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../lib/api";

const initialForm = { username: "", password: "", role: "admin" };

export default function AdminPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data pengguna"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editId && !form.password) {
      setError("Password wajib diisi untuk user baru");
      return;
    }

    try {
      if (editId) {
        await api.put(`/users/${editId}`, form);
        setSuccess("Pengguna berhasil diupdate");
      } else {
        await api.post("/users", form);
        setSuccess("Pengguna berhasil ditambahkan");
      }
      setForm(initialForm);
      setEditId("");
      fetchUsers();
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal menyimpan pengguna"));
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Yakin hapus pengguna ini?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal menghapus pengguna"));
    }
  };

  const onEdit = (row) => {
    setEditId(String(row.id));
    setForm({
      username: row.username || "",
      password: "", // Jangan tampilkan password lama
      role: row.role || "admin",
    });
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={h2}>Data Admin & Pengguna</h2>
      <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 13 }}>
        Kelola akun untuk login ke sistem POS (Admin / Kasir).
      </p>

      {error && <p style={errStyle}>{error}</p>}
      {success && <p style={okStyle}>{success}</p>}

      <form onSubmit={onSubmit} style={card}>
        <strong style={{ fontSize: 14, color: "#0f172a" }}>
          {editId ? `Edit Pengguna (ID: ${editId})` : "Tambah Pengguna Baru"}
        </strong>
        <div style={grid2}>
          <label style={fieldWrap}>
            <span style={labelStyle}>Username</span>
            <input
              style={inputStyle}
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </label>
          <label style={fieldWrap}>
            <span style={labelStyle}>Password {editId && "(Kosongkan jika tidak diubah)"}</span>
            <input
              style={inputStyle}
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editId}
            />
          </label>
          <label style={fieldWrap}>
            <span style={labelStyle}>Role / Hak Akses</span>
            <select
              style={inputStyle}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            >
              <option value="admin">Admin (Akses Penuh)</option>
              <option value="kasir">Kasir (Penjualan Saja)</option>
              <option value="gudang">Staff Gudang (Kelola Stok)</option>
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="submit" style={primaryBtn}>
            {editId ? "Update Pengguna" : "Simpan Pengguna"}
          </button>
          {editId && (
            <button type="button" style={ghostBtn} onClick={() => { setEditId(""); setForm(initialForm); }}>
              Batal
            </button>
          )}
        </div>
      </form>

      <div style={card}>
        <strong style={{ fontSize: 14, color: "#0f172a", marginBottom: 10, display: "block" }}>Daftar Pengguna</strong>
        {loading ? (
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Memuat...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                      Belum ada data pengguna
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={tdStyle}>{row.id}</td>
                    <td style={tdStyle}>{row.username}</td>
                    <td style={tdStyle}>
                      <span style={row.role === "admin" ? badgeAdmin : row.role === "kasir" ? badgeKasir : badgeGudang}>
                        {row.role === "admin" ? "Admin" : row.role === "kasir" ? "Kasir" : "Staff Gudang"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={editBtn} onClick={() => onEdit(row)}>Edit</button>
                        <button style={deleteBtn} onClick={() => onDelete(row.id)}>Hapus</button>
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
  );
}

const h2 = { margin: 0, fontSize: 20, color: "#0f172a", lineHeight: 1.2 };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, display: "grid", gap: 12 };
const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 };
const fieldWrap = { display: "grid", gap: 6 };
const labelStyle = { fontSize: 12, color: "#64748b", fontWeight: 600 };
const inputStyle = { fontSize: 13, height: 38, border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 12px", outline: "none", background: "#f8fafc", color: "#0f172a" };
const primaryBtn = { border: "none", borderRadius: 10, padding: "10px 16px", background: "#065f46", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const ghostBtn = { border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 16px", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const editBtn = { border: "none", borderRadius: 8, padding: "6px 12px", background: "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const deleteBtn = { border: "none", borderRadius: 8, padding: "6px 12px", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const errStyle = { color: "#b91c1c", margin: 0, fontSize: 13, background: "#fef2f2", padding: "10px", borderRadius: 8, border: "1px solid #fecaca" };
const okStyle = { color: "#166534", margin: 0, fontSize: 13, background: "#f0fdf4", padding: "10px", borderRadius: 8, border: "1px solid #bbf7d0" };
const tableStyle = { width: "100%", borderCollapse: "collapse", minWidth: 500 };
const thStyle = { fontSize: 12, color: "#64748b", fontWeight: 700, textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "12px 10px", backgroundColor: "#f8fafc" };
const tdStyle = { fontSize: 13, color: "#1f2937", borderBottom: "1px solid #f1f5f9", padding: "12px 10px" };

const badgeAdmin = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  background: "#f0fdf4",
  color: "#166534",
  border: "1px solid #bbf7d0",
};

const badgeKasir = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  background: "#eff6ff",
  color: "#1e3a8a",
  border: "1px solid #bfdbfe",
};

const badgeGudang = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  background: "#fef3c7",
  color: "#92400e",
  border: "1px solid #fde68a",
};
