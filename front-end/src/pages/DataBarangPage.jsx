import { useEffect, useMemo, useState } from "react";
import { api, apiErrorMessage } from "../lib/api";

const initialForm = { nama: "", harga: "", stok: "", satuan: "", foto: null };


export default function DataBarangPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const role = localStorage.getItem("role") || "admin";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const id = String(getProductId(r) || "").toLowerCase();
      const nama = String(r.nama || r.nama_produk || "").toLowerCase();
      return id.includes(q) || nama.includes(q);
    });
  }, [rows, search]);

  const fetchProduk = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/produk");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat produk"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduk();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload = new FormData();
      payload.append("nama", form.nama);
      payload.append("harga", form.harga);
      payload.append("stok", form.stok);
      payload.append("satuan", form.satuan);
      if (form.foto) payload.append("foto", form.foto);

      if (editId) {
        await api.put(`/produk/${editId}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
        setSuccess("Produk berhasil diupdate");
      } else {
        await api.post("/produk", payload, { headers: { "Content-Type": "multipart/form-data" } });
        setSuccess("Produk berhasil ditambahkan");
      }

      setForm(initialForm);
      setEditId("");
      fetchProduk();
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal menyimpan produk"));
    }
  };

  const onDelete = async (id) => {
    if (!id) {
      setError("ID produk tidak ditemukan, data tidak bisa dihapus.");
      return;
    }
    if (!window.confirm("Yakin hapus data ini?")) return;
    try {
      await api.delete(`/produk/${id}`);
      fetchProduk();
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal menghapus produk"));
    }
  };

  const onEdit = (row) => {
    const rowId = getProductId(row);
    if (!rowId) {
      setError("ID produk tidak ditemukan, data tidak bisa diedit.");
      return;
    }
    setEditId(String(rowId));
    setForm({
      nama: row.nama || row.nama_produk || "",
      harga: row.harga || "",
      stok: row.stok || "",
      satuan: row.satuan || "",
      foto: null,
    });
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={h2}>Data Barang</h2>
      {error && <p style={errStyle}>{error}</p>}
      {success && <p style={okStyle}>{success}</p>}

      {(role === "admin" || role === "gudang") && (
        <form onSubmit={onSubmit} style={card}>
          <strong style={{ fontSize: 14, color: "#0f172a" }}>{editId ? `Edit Produk ${editId}` : "Tambah Produk"}</strong>
        <div style={grid2}>
          <label style={fieldWrap}>
            <span style={labelStyle}>Nama Produk</span>
            <input style={inputStyle} placeholder="Nama produk" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
          </label>
          <label style={fieldWrap}>
            <span style={labelStyle}>Harga</span>
            <input style={inputStyle} placeholder="Harga" type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} required />
          </label>
          <label style={fieldWrap}>
            <span style={labelStyle}>Stok</span>
            <input style={inputStyle} placeholder="Stok" type="number" value={form.stok} onChange={(e) => setForm({ ...form, stok: e.target.value })} required />
          </label>
          <label style={fieldWrap}>
            <span style={labelStyle}>Satuan</span>
            <input style={inputStyle} placeholder="Satuan (pcs/kg/ltr)" value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} required />
          </label>
          <label style={{ ...fieldWrap, gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Foto Produk</span>
            <input style={{ ...inputStyle, padding: "6px 10px" }} type="file" onChange={(e) => setForm({ ...form, foto: e.target.files?.[0] || null })} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="submit" style={primaryBtn}>{editId ? "Update Produk" : "Tambah Produk"}</button>
          {editId && (
            <button type="button" style={ghostBtn} onClick={() => { setEditId(""); setForm(initialForm); }}>
              Batal
            </button>
          )}
        </div>
      </form>
      )}

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 14, color: "#0f172a" }}>Daftar Produk</strong>
          <input style={{ ...inputStyle, width: 220, maxWidth: "100%" }} placeholder="Cari id/nama..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loading ? (
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Memuat...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Nama</th>
                  <th style={thStyle}>Harga</th>
                  <th style={thStyle}>Stok</th>
                  <th style={thStyle}>Satuan</th>
                  <th style={thStyle}>Foto</th>
                  {(role === "admin" || role === "gudang") && <th style={thStyle}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={getProductId(row) || `${row.nama || row.nama_produk}-row`}>
                    <td style={tdStyle}>{getProductId(row) || <span style={mutedText}>-</span>}</td>
                    <td style={tdStyle}>{row.nama || row.nama_produk}</td>
                    <td style={tdStyle}>{rupiah(row.harga)}</td>
                    <td style={tdStyle}>{row.stok}</td>
                    <td style={tdStyle}>{row.satuan}</td>
                    <td style={tdStyle}>
                      {row.foto ? (
                        <img
                          src={getFotoUrl(row.foto)}
                          alt={row.nama || "Foto produk"}
                          style={fotoThumb}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span style={mutedText}>-</span>
                      )}
                    </td>
                    {(role === "admin" || role === "gudang") && (
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={editBtn} onClick={() => onEdit(row)}>Edit</button>
                          <button style={deleteBtn} onClick={() => onDelete(getProductId(row))}>Hapus</button>
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

function rupiah(n) {
  return Number(n || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

function getFotoUrl(foto) {
  if (!foto) return "";
  if (/^https?:\/\//i.test(foto)) return foto;
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  const path = String(foto).replace(/^\/+/, "");
  return `${base}/${path}`;
}

function getProductId(row) {
  return row?.id_brg || row?.id || row?.id_produk || row?.kode_produk || row?.kode || row?.produk_id || "";
}

const h2 = { margin: 0, fontSize: 20, color: "#0f172a", lineHeight: 1.2 };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, display: "grid", gap: 10 };
const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 };
const fieldWrap = { display: "grid", gap: 6 };
const labelStyle = { fontSize: 12, color: "#64748b", fontWeight: 500 };
const inputStyle = { fontSize: 13, height: 36, border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 11px", outline: "none", background: "#fff", color: "#0f172a" };
const primaryBtn = { border: "none", borderRadius: 10, padding: "9px 14px", background: "#065f46", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const ghostBtn = { border: "1px solid #d1d5db", borderRadius: 10, padding: "9px 14px", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const editBtn = { border: "none", borderRadius: 8, padding: "5px 10px", background: "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const deleteBtn = { border: "none", borderRadius: 8, padding: "5px 10px", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const errStyle = { color: "#b91c1c", margin: 0, fontSize: 13 };
const okStyle = { color: "#166534", margin: 0, fontSize: 13 };
const tableStyle = { width: "100%", borderCollapse: "collapse", minWidth: 700 };
const thStyle = { fontSize: 12, color: "#64748b", fontWeight: 700, textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "10px 8px" };
const tdStyle = { fontSize: 13, color: "#1f2937", borderBottom: "1px solid #f1f5f9", padding: "10px 8px" };
const fotoThumb = { width: 46, height: 46, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f8fafc" };
const mutedText = { fontSize: 12, color: "#9ca3af" };
