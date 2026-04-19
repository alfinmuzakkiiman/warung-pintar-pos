import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../lib/api";

const PAGE_SIZE = 8;

function getProductId(p) {
  return p?.id_brg || p?.id || "";
}

function getFotoUrl(foto) {
  if (!foto) return "";
  if (/^https?:\/\//i.test(foto)) return foto;
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  const path = String(foto).replace(/^\/+/, "");
  return `${base}/${path}`;
}

function rupiah(n) {
  return Number(n || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

export default function TransaksiPage() {
  const navigate = useNavigate();
  const [produk, setProduk] = useState([]);
  const [rows, setRows] = useState([]);
  const [namaKonsumen, setNamaKonsumen] = useState("");
  const [bayar, setBayar] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty) * Number(item.harga), 0),
    [items]
  );

  const kembalian = useMemo(() => {
    const b = Number(bayar || 0);
    if (!b) return 0;
    return Math.max(0, b - total);
  }, [bayar, total]);

  const filteredProduk = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return produk;
    return produk.filter((p) => {
      const id = String(getProductId(p)).toLowerCase();
      const nama = String(p.nama || "").toLowerCase();
      return id.includes(q) || nama.includes(q);
    });
  }, [produk, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProduk.length / PAGE_SIZE));
  const pageProduk = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProduk.slice(start, start + PAGE_SIZE);
  }, [filteredProduk, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const load = async () => {
    try {
      const [trxRes, brgRes] = await Promise.all([
        api.get("/transaksi?limit=20&page=1"),
        api.get("/produk?available=1"),
      ]);
      setRows(Array.isArray(trxRes.data?.items) ? trxRes.data.items : []);
      setProduk(Array.isArray(brgRes.data) ? brgRes.data : []);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat transaksi"));
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/transaksi?limit=20&page=1"), api.get("/produk?available=1")])
      .then(([trxRes, brgRes]) => {
        if (!active) return;
        setRows(Array.isArray(trxRes.data?.items) ? trxRes.data.items : []);
        setProduk(Array.isArray(brgRes.data) ? brgRes.data : []);
      })
      .catch((err) => {
        if (!active) return;
        setError(apiErrorMessage(err, "Gagal memuat transaksi"));
      });
    return () => {
      active = false;
    };
  }, []);

  const addProduct = (p) => {
    const id = getProductId(p);
    if (!id) return;
    const harga = Number(p.harga || 0);
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id_brg === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { id_brg: id, nama: p.nama || "", qty: 1, harga }];
    });
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (items.length === 0) return;
    try {
      const payload = {
        nama_konsumen: namaKonsumen,
        bayar: Number(bayar || 0),
        items: items.map((it) => ({ id_brg: it.id_brg, qty: it.qty, harga: it.harga })),
      };
      const res = await api.post("/transaksi", payload);
      const idTrx = res.data?.id_trx;
      setNamaKonsumen("");
      setBayar("");
      setItems([]);
      load();
      if (idTrx) {
        try {
          sessionStorage.setItem(
            "struk_pay_" + idTrx,
            JSON.stringify({
              bayar: res.data.bayar,
              kembalian: res.data.kembalian,
              total: res.data.total,
              nama_konsumen: res.data.nama_konsumen,
            })
          );
        } catch {
          /* ignore */
        }
        navigate(`/dashboard/struk?id=${encodeURIComponent(idTrx)}`, {
          replace: true,
          state: {
            bayar: res.data.bayar,
            kembalian: res.data.kembalian,
            total: res.data.total,
            nama_konsumen: res.data.nama_konsumen,
          },
        });
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal menyimpan transaksi"));
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={h2}>Transaksi</h2>
      {error && <p style={err}>{error}</p>}
      {info && <p style={ok}>{info}</p>}

      <form onSubmit={submit} style={{ display: "block" }}>
        <div className="pos-two-col">
          {/* Kiri: katalog produk */}
          <div style={panelLeft}>
            <input
              type="search"
              placeholder="Ketik untuk mencari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInput}
            />
            <div style={productGrid}>
              {pageProduk.map((p) => {
                const id = getProductId(p);
                return (
                  <div key={id || p.nama} style={productCard}>
                    <div style={imgWrap}>
                      {p.foto ? (
                        <img src={getFotoUrl(p.foto)} alt="" style={productImg} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : (
                        <div style={imgPlaceholder}>{(p.nama || "?").slice(0, 2).toUpperCase()}</div>
                      )}
                    </div>
                    <p style={productName}>{p.nama}</p>
                    <p style={productPrice}>{rupiah(p.harga)}</p>
                    <button type="button" style={btnTambah} onClick={() => addProduct(p)}>
                      Tambah
                    </button>
                  </div>
                );
              })}
            </div>
            {filteredProduk.length === 0 && (
              <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: 16 }}>Tidak ada produk.</p>
            )}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    style={{
                      minWidth: 32,
                      height: 32,
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: n === page ? "#059669" : "#e5e7eb",
                      color: n === page ? "#fff" : "#374151",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Kanan: Kasir / Invoice */}
          <div style={panelRight}>
            <strong style={invoiceTitle}>Kasir / Invoice</strong>
            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Barang</th>
                    <th style={th}>Harga</th>
                    <th style={th}>Qty</th>
                    <th style={th}>Total</th>
                    <th style={{ ...th, width: 44 }} />
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ ...td, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                        Belum ada item. Pilih produk di kiri.
                      </td>
                    </tr>
                  )}
                  {items.map((item, idx) => (
                    <tr key={`${item.id_brg}-${idx}`}>
                      <td style={td}>{item.nama}</td>
                      <td style={td}>{rupiah(item.harga)}</td>
                      <td style={td}>{item.qty}</td>
                      <td style={td}>{rupiah(item.qty * item.harga)}</td>
                      <td style={td}>
                        <button type="button" style={btnRemove} onClick={() => removeItem(idx)} aria-label="Hapus">
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={totalRow}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Total</span>
              <span style={totalAmount}>{rupiah(total)}</span>
            </div>
            <label style={fieldWrap}>
              <span style={labelText}>Nama Konsumen (opsional)</span>
              <input style={inputRight} placeholder="Nama konsumen" value={namaKonsumen} onChange={(e) => setNamaKonsumen(e.target.value)} />
            </label>
            <label style={fieldWrap}>
              <span style={labelText}>Bayar</span>
              <input
                style={inputRight}
                type="number"
                min={0}
                placeholder="Masukkan uang bayar"
                value={bayar}
                onChange={(e) => setBayar(e.target.value)}
                required
              />
            </label>
            <label style={fieldWrap}>
              <span style={labelText}>Kembalian</span>
              <input style={{ ...inputRight, background: "#f8fafc", color: "#0f172a" }} readOnly value={kembalian ? rupiah(kembalian) : rupiah(0)} />
            </label>
            <button
              type="submit"
              style={{
                ...btnBayar,
                opacity: items.length === 0 ? 0.55 : 1,
                cursor: items.length === 0 ? "not-allowed" : "pointer",
              }}
              disabled={items.length === 0}
            >
              Bayar
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .pos-two-col {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
          gap: 16px;
          align-items: stretch;
        }
        @media (max-width: 960px) {
          .pos-two-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

const h2 = { margin: 0, fontSize: 20, color: "#0f172a", lineHeight: 1.2 };
const err = { color: "#b91c1c", margin: 0, fontSize: 13 };
const ok = { color: "#166534", margin: 0, fontSize: 13 };

const panelLeft = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 12,
  alignContent: "start",
};

const searchInput = {
  width: "100%",
  fontSize: 13,
  height: 40,
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "0 12px",
  outline: "none",
  background: "#f8fafc",
  color: "#0f172a",
  boxSizing: "border-box",
};

const productGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 12,
};

const productCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 10,
  display: "grid",
  gap: 8,
  justifyItems: "center",
  background: "#fff",
};

const imgWrap = {
  width: "100%",
  aspectRatio: "1",
  maxWidth: 120,
  borderRadius: 10,
  overflow: "hidden",
  background: "#f1f5f9",
  display: "grid",
  placeItems: "center",
};

const productImg = { width: "100%", height: "100%", objectFit: "cover" };

const imgPlaceholder = {
  width: "100%",
  height: "100%",
  minHeight: 80,
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  fontWeight: 700,
  color: "#94a3b8",
};

const productName = {
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
  textAlign: "center",
  lineHeight: 1.3,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const productPrice = { margin: 0, fontSize: 12, color: "#64748b", textAlign: "center" };

const btnTambah = {
  width: "100%",
  border: "none",
  borderRadius: 8,
  padding: "8px 10px",
  background: "#059669",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const panelRight = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 10,
  alignContent: "start",
};

const invoiceTitle = { fontSize: 15, color: "#0f172a" };

const table = { width: "100%", borderCollapse: "collapse", minWidth: 280 };
const th = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "8px 6px",
};
const td = {
  fontSize: 13,
  color: "#1f2937",
  borderBottom: "1px solid #f1f5f9",
  padding: "8px 6px",
  verticalAlign: "middle",
};

const btnRemove = {
  width: 28,
  height: 28,
  border: "none",
  borderRadius: 6,
  background: "#ef4444",
  color: "#fff",
  fontSize: 16,
  lineHeight: 1,
  cursor: "pointer",
  fontWeight: 700,
};

const totalRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 8,
  borderTop: "1px solid #e5e7eb",
  marginTop: 4,
};

const totalAmount = {
  fontSize: 22,
  fontWeight: 800,
  color: "#2563eb",
};

const fieldWrap = { display: "grid", gap: 4 };
const labelText = { fontSize: 12, color: "#64748b", fontWeight: 500 };

const inputRight = {
  width: "100%",
  fontSize: 13,
  height: 38,
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "0 11px",
  outline: "none",
  boxSizing: "border-box",
};

const btnBayar = {
  width: "100%",
  border: "none",
  borderRadius: 10,
  padding: "12px 14px",
  background: "#059669",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 4,
};

const cardHistory = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 10,
};

const tableHistory = { width: "100%", borderCollapse: "collapse", minWidth: 520 };
const thHist = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "10px 8px",
};
const tdHist = {
  fontSize: 13,
  color: "#1f2937",
  borderBottom: "1px solid #f1f5f9",
  padding: "10px 8px",
};
