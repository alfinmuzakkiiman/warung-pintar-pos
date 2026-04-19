import { Fragment, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../lib/api";

function rupiah(n) {
  return Number(n || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

export default function DetailTransaksiPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [detailData, setDetailData] = useState({});
  const [loadingDetail, setLoadingDetail] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    api.get("/transaksi?limit=100&page=1").then((res) => {
      setList(Array.isArray(res.data?.items) ? res.data.items : []);
    }).catch((err) => {
      setError(apiErrorMessage(err, "Gagal memuat daftar transaksi"));
    });
  }, []);

  // Auto-expand if URL has id param
  useEffect(() => {
    const urlId = params.get("id");
    if (urlId && !expandedId) {
      setExpandedId(urlId);
      loadDetail(urlId);
    }
  }, [params]);

  const loadDetail = async (id) => {
    if (detailData[id]) return;
    setLoadingDetail((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await api.get(`/transaksi/${id}`);
      setDetailData((prev) => ({
        ...prev,
        [id]: {
          trx: res.data?.trx || null,
          items: Array.isArray(res.data?.items) ? res.data.items : [],
        },
      }));
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat detail"));
    } finally {
      setLoadingDetail((prev) => ({ ...prev, [id]: false }));
    }
  };

  const toggleDetail = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadDetail(id);
    }
  };

  const goStruk = (id) => {
    navigate(`/dashboard/struk?id=${encodeURIComponent(id)}`);
  };

  const filteredList = list.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(row.id_trx || "").toLowerCase().includes(q) ||
      String(row.nama_konsumen || "").toLowerCase().includes(q) ||
      String(row.tgl_trx || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const pagedList = filteredList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={h2}>Detail Transaksi</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Lihat detail setiap transaksi dan cetak struk
          </p>
        </div>
        <button
          type="button"
          style={btnOutline}
          onClick={() => navigate("/dashboard/transaksi")}
        >
          ← Ke Transaksi
        </button>
      </div>

      {error && <p style={errStyle}>{error}</p>}

      {/* Search */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={searchWrap}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="7" cy="7" r="5" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Cari ID, nama konsumen, tanggal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInput}
            />
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
            {filteredList.length} transaksi
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={card}>
        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={thStyle}>ID Transaksi</th>
                <th style={thStyle}>Konsumen</th>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>Total</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedList.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#94a3b8", padding: 24 }}>
                    {search ? "Tidak ada transaksi yang cocok." : "Belum ada transaksi."}
                  </td>
                </tr>
              )}
              {pagedList.map((row) => {
                const isExpanded = expandedId === String(row.id_trx);
                const detail = detailData[row.id_trx];
                const isLoading = loadingDetail[row.id_trx];

                return (
                  <Fragment key={row.id_trx}>
                    <tr style={{ background: isExpanded ? "#f0fdf4" : "transparent", transition: "background 0.2s" }}>
                      <td style={tdStyle}>
                        <span style={idBadge}>{row.id_trx}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: "#111827" }}>{row.nama_konsumen || "-"}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: "#6b7280" }}>{row.tgl_trx || "-"}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: "#065f46" }}>{rupiah(row.total)}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <button
                          type="button"
                          style={isExpanded ? detailBtnActive : detailBtn}
                          onClick={() => toggleDetail(String(row.id_trx))}
                        >
                          {isExpanded ? "Tutup" : "Detail"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} style={{ padding: 0, borderBottom: "1px solid #e5e7eb" }}>
                          <div style={expandPanel}>
                            {isLoading && (
                              <p style={{ color: "#94a3b8", fontSize: 13, padding: 12 }}>Memuat detail...</p>
                            )}
                            {!isLoading && detail && (
                              <>
                                {/* Info header */}
                                <div style={detailGrid}>
                                  <InfoItem label="No. Transaksi" value={detail.trx?.id_trx || row.id_trx} />
                                  <InfoItem label="Konsumen" value={detail.trx?.nama_konsumen || "Umum"} />
                                  <InfoItem label="Tanggal" value={detail.trx?.tgl_trx || "-"} />
                                  <InfoItem label="Total" value={rupiah(detail.trx?.total || row.total)} highlight />
                                </div>

                                {/* Items table */}
                                <div style={{ overflowX: "auto", marginTop: 12 }}>
                                  <table style={innerTable}>
                                    <thead>
                                      <tr>
                                        <th style={innerTh}>Barang</th>
                                        <th style={{ ...innerTh, textAlign: "center" }}>Qty</th>
                                        <th style={{ ...innerTh, textAlign: "right" }}>Harga</th>
                                        <th style={{ ...innerTh, textAlign: "right" }}>Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detail.items.map((it, idx) => (
                                        <tr key={`${it.id_brg}-${idx}`}>
                                          <td style={innerTd}>{it.nama}</td>
                                          <td style={{ ...innerTd, textAlign: "center" }}>{it.qty}</td>
                                          <td style={{ ...innerTd, textAlign: "right" }}>{rupiah(it.harga)}</td>
                                          <td style={{ ...innerTd, textAlign: "right", fontWeight: 700 }}>{rupiah(it.subtotal)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Print button */}
                                <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
                                  <button
                                    type="button"
                                    style={printBtn}
                                    onClick={() => goStruk(row.id_trx)}
                                  >
                                    🖨️ Cetak Struk
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={pagination}>
            <button
              type="button"
              style={pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹ Prev
            </button>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Halaman {page} / {totalPages}
            </span>
            <button
              type="button"
              style={pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div style={infoItemWrap}>
      <span style={infoLabel}>{label}</span>
      <span style={{ ...infoValue, color: highlight ? "#065f46" : "#111827" }}>{value}</span>
    </div>
  );
}

/* ——— Styles ——— */

const h2 = { margin: 0, fontSize: 22, color: "#0f172a", fontWeight: 800, lineHeight: 1.2 };
const errStyle = { color: "#b91c1c", margin: 0, fontSize: 13 };

const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "clamp(12px, 3vw, 16px)",
  display: "grid",
  gap: 10,
  maxWidth: "100%",
  overflow: "hidden",
};

const btnOutline = {
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "9px 16px",
  background: "#fff",
  color: "#374151",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const searchWrap = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "8px 14px",
  flex: 1,
};

const searchInput = {
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 13,
  color: "#0f172a",
  width: "100%",
  padding: 0,
};

const table = { width: "100%", borderCollapse: "collapse" };
const thStyle = {
  fontSize: "clamp(9px, 2.2vw, 11px)",
  color: "#6b7280",
  fontWeight: 700,
  textAlign: "left",
  borderBottom: "2px solid #e5e7eb",
  padding: "10px clamp(4px, 1.5vw, 10px)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const tdStyle = {
  fontSize: "clamp(10px, 2.5vw, 13px)",
  color: "#1f2937",
  borderBottom: "1px solid #f1f5f9",
  padding: "12px clamp(4px, 1.5vw, 10px)",
  verticalAlign: "middle",
  wordBreak: "break-word",
};

const idBadge = {
  display: "inline-block",
  padding: "3px clamp(4px, 1.5vw, 10px)",
  borderRadius: 8,
  background: "#f0fdf4",
  color: "#065f46",
  fontWeight: 700,
  fontSize: "clamp(9px, 2.2vw, 12px)",
  border: "1px solid #bbf7d0",
};

const detailBtn = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "6px clamp(6px, 1.5vw, 14px)",
  background: "#fff",
  color: "#374151",
  fontSize: "clamp(10px, 2vw, 12px)",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s",
};

const detailBtnActive = {
  ...detailBtn,
  background: "#065f46",
  color: "#fff",
  border: "1px solid #065f46",
};

const expandPanel = {
  background: "#fafffe",
  padding: "16px 20px",
  borderTop: "1px dashed #d1d5db",
};

const detailGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
  padding: "10px 0",
};

const infoItemWrap = { display: "grid", gap: 3 };
const infoLabel = { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" };
const infoValue = { fontSize: 14, fontWeight: 700 };

const innerTable = { width: "100%", borderCollapse: "collapse" };
const innerTh = {
  fontSize: "clamp(10px, 2vw, 11px)",
  color: "#6b7280",
  fontWeight: 700,
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "8px 4px",
};
const innerTd = {
  fontSize: "clamp(11px, 2.2vw, 13px)",
  color: "#1f2937",
  borderBottom: "1px solid #f3f4f6",
  padding: "8px 4px",
  wordBreak: "break-word",
};

const printBtn = {
  border: "none",
  borderRadius: 10,
  padding: "10px 20px",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
};

const pagination = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 12,
  paddingTop: 8,
};

const pageBtn = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "6px 14px",
  background: "#fff",
  color: "#374151",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
