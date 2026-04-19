import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../lib/api";

export default function SupplierPage() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ id_spl: "", nama_spl: "" });
  const [isEdit, setIsEdit] = useState(false);
  const [search, setSearch] = useState("");

  const role = localStorage.getItem("role");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/supplier");
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data supplier"));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (isEdit) {
        await api.put(`/supplier/${form.id_spl}`, { nama_spl: form.nama_spl });
        setSuccess("Supplier berhasil diupdate!");
      } else {
        await api.post("/supplier", { nama_spl: form.nama_spl });
        setSuccess("Supplier berhasil ditambahkan!");
      }
      setForm({ id_spl: "", nama_spl: "" });
      setIsEdit(false);
      loadData();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal menyimpan supplier"));
    }
  };

  const onEdit = (row) => {
    setForm({ id_spl: row.id_spl, nama_spl: row.nama_spl });
    setIsEdit(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onCancelEdit = () => {
    setForm({ id_spl: "", nama_spl: "" });
    setIsEdit(false);
  };

  const onDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus supplier ini?")) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/supplier/${id}`);
      setSuccess("Supplier berhasil dihapus!");
      loadData();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal menghapus supplier"));
    }
  };

  const filteredData = data.filter((row) =>
    (row.nama_spl || "").toLowerCase().includes(search.toLowerCase()) ||
    String(row.id_spl).includes(search)
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2 style={h2}>Data Supplier</h2>

      {error && <p style={errStyle}>{error}</p>}
      {success && <p style={okStyle}>{success}</p>}

      {(role === "admin" || role === "gudang") && (
        <form onSubmit={onSubmit} style={card}>
          <strong style={{ fontSize: 14, color: "#0f172a" }}>
            {isEdit ? `Edit Supplier ID: ${form.id_spl}` : "Tambah Supplier Baru"}
          </strong>
          <div style={grid2}>
            <label style={fieldWrap}>
              <span style={labelStyle}>Nama Supplier</span>
              <input
                style={inputStyle}
                placeholder="Masukkan nama supplier"
                value={form.nama_spl}
                onChange={(e) => setForm({ ...form, nama_spl: e.target.value })}
                required
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="submit" style={primaryBtn}>
              {isEdit ? "Update Supplier" : "Tambah Supplier"}
            </button>
            {isEdit && (
              <button type="button" style={ghostBtn} onClick={onCancelEdit}>
                Batal
              </button>
            )}
          </div>
        </form>
      )}

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 14, color: "#0f172a" }}>Daftar Supplier</strong>
          <input
            style={{ ...inputStyle, width: 220, maxWidth: "100%" }}
            placeholder="Cari nama/id supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Memuat...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 80 }}>ID</th>
                  <th style={thStyle}>Nama Supplier</th>
                  {(role === "admin" || role === "gudang") && <th style={{ ...thStyle, width: 150 }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: 13 }}>
                      Data tidak ditemukan.
                    </td>
                  </tr>
                )}
                {filteredData.map((row) => (
                  <tr key={row.id_spl}>
                    <td style={tdStyle}>
                      <span style={idBadge}>{row.id_spl}</span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{row.nama_spl}</td>
                    {(role === "admin" || role === "gudang") && (
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={editBtn} onClick={() => onEdit(row)}>Edit</button>
                          <button style={deleteBtn} onClick={() => onDelete(row.id_spl)}>Hapus</button>
                        </div>
                      </td>
                    )}
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

/* --- Styles --- */

const h2 = { margin: 0, fontSize: 20, color: "#0f172a", lineHeight: 1.2, fontWeight: 700 };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "clamp(12px, 3vw, 18px)", display: "grid", gap: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", maxWidth: "100%", overflow: "hidden" };
const grid2 = { display: "grid", gridTemplateColumns: "1fr", gap: 12 };
const fieldWrap = { display: "grid", gap: 6 };
const labelStyle = { fontSize: 12, color: "#64748b", fontWeight: 600 };
const inputStyle = { fontSize: 13, height: 40, border: "1px solid #cbd5e1", borderRadius: 10, padding: "0 12px", outline: "none", background: "#f8fafc", color: "#0f172a", transition: "all 0.2s" };

const primaryBtn = { border: "none", borderRadius: 10, padding: "10px 18px", background: "#065f46", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" };
const ghostBtn = { border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 18px", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" };
const editBtn = { border: "none", borderRadius: 8, padding: "6px 14px", background: "#3b82f6", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const deleteBtn = { border: "none", borderRadius: 8, padding: "6px 14px", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" };

const errStyle = { color: "#b91c1c", margin: 0, fontSize: 13, background: "#fef2f2", padding: "12px", borderRadius: 10, border: "1px solid #fecaca" };
const okStyle = { color: "#166534", margin: 0, fontSize: 13, background: "#f0fdf4", padding: "12px", borderRadius: 10, border: "1px solid #bbf7d0" };

const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { fontSize: "clamp(10px, 2.5vw, 12px)", color: "#64748b", fontWeight: 700, textAlign: "left", borderBottom: "2px solid #e2e8f0", padding: "10px clamp(4px, 1.5vw, 10px)", backgroundColor: "#f8fafc", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle = { fontSize: "clamp(11px, 2.8vw, 13px)", color: "#1e293b", borderBottom: "1px solid #f1f5f9", padding: "12px clamp(4px, 1.5vw, 10px)", wordBreak: "break-word" };

const idBadge = {
  display: "inline-block",
  padding: "3px clamp(6px, 1.5vw, 10px)",
  borderRadius: 6,
  background: "#f1f5f9",
  color: "#475569",
  fontWeight: 700,
  fontSize: "clamp(9px, 2.2vw, 12px)",
  border: "1px solid #e2e8f0",
};
