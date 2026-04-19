import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../lib/api";

const blank = { tanggal: "", id_brg: "", tujuan: "", jumlah: "", keterangan: "" };

export default function BarangKeluarPage() {
  const [rows, setRows] = useState([]);
  const [produk, setProduk] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [keluar, brg] = await Promise.all([api.get("/barang-keluar"), api.get("/produk?available=1")]);
      setRows(Array.isArray(keluar.data) ? keluar.data : []);
      setProduk(Array.isArray(brg.data) ? brg.data : []);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat barang keluar"));
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/barang-keluar"), api.get("/produk?available=1")])
      .then(([keluar, brg]) => {
        if (!active) return;
        setRows(Array.isArray(keluar.data) ? keluar.data : []);
        setProduk(Array.isArray(brg.data) ? brg.data : []);
      })
      .catch((err) => {
        if (!active) return;
        setError(apiErrorMessage(err, "Gagal memuat barang keluar"));
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const jumlah = Number(form.jumlah);
    if (!jumlah || jumlah <= 0) {
      setError("Jumlah harus lebih dari 0");
      return;
    }
    try {
      const payload = { ...form, jumlah };
      if (editId) {
        await api.put(`/barang-keluar/${editId}`, payload);
      } else {
        await api.post("/barang-keluar", payload);
      }
      setEditId(null);
      setForm(blank);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal simpan barang keluar"));
    }
  };

  const del = async (id) => {
    if (!window.confirm("Hapus data barang keluar?")) return;
    try {
      await api.delete(`/barang-keluar/${id}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal hapus barang keluar"));
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={h2}>Barang Keluar</h2>
      {error && <p style={err}>{error}</p>}
      <form onSubmit={submit} style={card}>
        <strong style={{ fontSize: 14, color: "#0f172a" }}>{editId ? `Edit ID ${editId}` : "Input Barang Keluar"}</strong>
        <div style={grid}>
          <label style={fieldWrap}>
            <span style={labelStyle}>Tanggal</span>
            <input style={inputStyle} type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} required />
          </label>
          <label style={fieldWrap}>
            <span style={labelStyle}>Barang</span>
            <select style={inputStyle} value={form.id_brg} onChange={(e) => setForm({ ...form, id_brg: e.target.value })} required>
              <option value="">Pilih Barang</option>
              {produk.map((p) => {
                const productId = getProductId(p);
                return (
                  <option key={productId || p.nama} value={productId}>
                    {productId} - {p.nama}
                  </option>
                );
              })}
            </select>
          </label>
          <label style={fieldWrap}>
            <span style={labelStyle}>Tujuan</span>
            <input style={inputStyle} placeholder="Tujuan keluar" value={form.tujuan} onChange={(e) => setForm({ ...form, tujuan: e.target.value })} required />
          </label>
          <label style={fieldWrap}>
            <span style={labelStyle}>Jumlah</span>
            <input style={inputStyle} type="number" min={0} value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value === "" ? "" : Number(e.target.value) })} required />
          </label>
          <label style={{ ...fieldWrap, gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Keterangan</span>
            <input style={inputStyle} placeholder="Keterangan" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={primaryBtn}>{editId ? "Update" : "Simpan"}</button>
          {editId && <button type="button" style={ghostBtn} onClick={() => { setEditId(null); setForm(blank); }}>Batal</button>}
        </div>
      </form>
      <div style={card}>
        <strong style={{ fontSize: 14, color: "#0f172a" }}>Daftar Barang Keluar</strong>
        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>Barang</th>
                <th style={thStyle}>Tujuan</th>
                <th style={thStyle}>Jumlah</th>
                <th style={thStyle}>Keterangan</th>
                <th style={thStyle}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.id}</td>
                  <td style={tdStyle}>{r.tanggal}</td>
                  <td style={tdStyle}>{r.barang}</td>
                  <td style={tdStyle}>{r.tujuan}</td>
                  <td style={tdStyle}>{r.jumlah}</td>
                  <td style={tdStyle}>{r.keterangan || <span style={mutedText}>-</span>}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={editBtn} onClick={() => { setEditId(r.id); setForm({ tanggal: r.tanggal || "", id_brg: r.id_brg || "", tujuan: r.tujuan || "", jumlah: Number(r.jumlah || 0), keterangan: r.keterangan || "" }); }}>Edit</button>
                      <button style={deleteBtn} onClick={() => del(r.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getProductId(row) {
  return row?.id_brg || row?.id || row?.id_produk || row?.kode_produk || row?.kode || row?.produk_id || "";
}

const h2 = { margin: 0, fontSize: 20, color: "#0f172a", lineHeight: 1.2 };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, display: "grid", gap: 10 };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 };
const fieldWrap = { display: "grid", gap: 6 };
const labelStyle = { fontSize: 12, color: "#64748b", fontWeight: 500 };
const inputStyle = { fontSize: 13, height: 36, border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 11px", outline: "none", background: "#fff", color: "#0f172a" };
const primaryBtn = { border: "none", borderRadius: 10, padding: "9px 14px", background: "#065f46", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const ghostBtn = { border: "1px solid #d1d5db", borderRadius: 10, padding: "9px 14px", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const editBtn = { border: "none", borderRadius: 8, padding: "5px 10px", background: "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const deleteBtn = { border: "none", borderRadius: 8, padding: "5px 10px", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const err = { color: "#b91c1c", margin: 0, fontSize: 13 };
const table = { width: "100%", borderCollapse: "collapse", minWidth: 760 };
const thStyle = { fontSize: 12, color: "#64748b", fontWeight: 700, textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "10px 8px" };
const tdStyle = { fontSize: 13, color: "#1f2937", borderBottom: "1px solid #f1f5f9", padding: "10px 8px" };
const mutedText = { fontSize: 12, color: "#9ca3af" };
