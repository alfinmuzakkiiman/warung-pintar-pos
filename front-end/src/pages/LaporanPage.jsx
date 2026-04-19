import { useEffect, useMemo, useState } from "react";
import { api, apiErrorMessage } from "../lib/api";

function rupiah(n) {
  return Number(n || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

const BULAN_OPTIONS = [
  { value: "Semua", label: "Semua Bulan" },
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

export default function LaporanPage() {
  const [allProduk, setAllProduk] = useState(0);
  const [allMasuk, setAllMasuk] = useState(0);
  const [allKeluar, setAllKeluar] = useState(0);
  const [allTrx, setAllTrx] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const currentYear = String(new Date().getFullYear());
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

  const [filterBulan, setFilterBulan] = useState(currentMonth);
  const [filterTahun, setFilterTahun] = useState(currentYear);

  useEffect(() => {
    const load = async () => {
      try {
        const [produk, masuk, keluar, trx] = await Promise.all([
          api.get("/produk"),
          api.get("/barang-masuk"),
          api.get("/barang-keluar"),
          api.get("/transaksi?limit=1000&page=1"), // Load more for accurate reporting
        ]);
        const trxItems = Array.isArray(trx.data?.items) ? trx.data.items : [];
        setAllProduk(Array.isArray(produk.data) ? produk.data.length : 0);
        setAllMasuk(Array.isArray(masuk.data) ? masuk.data.length : 0);
        setAllKeluar(Array.isArray(keluar.data) ? keluar.data.length : 0);
        setAllTrx(trxItems);
      } catch (err) {
        setError(apiErrorMessage(err, "Gagal memuat laporan"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredTrx = useMemo(() => {
    return allTrx.filter((item) => {
      if (!item.tgl_trx) return false;
      const year = item.tgl_trx.slice(0, 4);
      const month = item.tgl_trx.slice(5, 7);

      const matchBulan = filterBulan === "Semua" || month === filterBulan;
      const matchTahun = filterTahun === "Semua" || year === filterTahun;
      return matchBulan && matchTahun;
    });
  }, [allTrx, filterBulan, filterTahun]);

  const omzetFiltered = filteredTrx.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 200 }}>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Memuat laporan...</p>
      </div>
    );
  }

  return (
    <div className="print-area" style={{ display: "grid", gap: 20, width: "100%", maxWidth: "100%" }}>
      {/* Header & Print Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={h2}>Laporan Penjualan</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Ringkasan data transaksi dan inventory Warung-Pintar.
          </p>
        </div>
        <button onClick={handlePrint} style={printBtn} className="hide-print">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Print Laporan
        </button>
      </div>

      {error && <p style={errStyle}>{error}</p>}

      {/* Filter Section */}
      <div className="hide-print" style={filterCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#065f46", fontWeight: 700, fontSize: 13 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Filter Data
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1, minWidth: 200 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 120 }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Bulan</span>
            <select style={selectStyle} value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)}>
              {BULAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 120 }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Tahun</span>
            <select style={selectStyle} value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)}>
              <option value="Semua">Semua Tahun</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </label>
        </div>
      </div>

      {/* Omzet Highlight Card */}
      <div style={omzetCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
          <div>
            <p style={omzetLabel}>Total Pendapatan</p>
            <p style={omzetValue}>{rupiah(omzetFiltered)}</p>
            <p style={{ margin: "8px 0 0", color: "#a7f3d0", fontSize: 13 }}>
              Dari <strong>{filteredTrx.length}</strong> transaksi terpilih
            </p>
          </div>
          <div style={omzetIconBox}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Overview Stok Gudang</h3>
      </div>
      <div style={cardGrid}>
        <StatCard
          title="Total Produk"
          value={allProduk}
          sub="Master data barang"
          gradient="linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
          borderColor="#e2e8f0"
          valueColor="#0f172a"
        />
        <StatCard
          title="Barang Masuk"
          value={allMasuk}
          sub="Total trx masuk"
          gradient="linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
          borderColor="#93c5fd"
          valueColor="#1e40af"
        />
        <StatCard
          title="Barang Keluar"
          value={allKeluar}
          sub="Total trx keluar"
          gradient="linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)"
          borderColor="#fcd34d"
          valueColor="#92400e"
        />
      </div>

      {/* Filtered Transactions */}
      <div style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <strong style={{ fontSize: 15, color: "#0f172a" }}>Daftar Transaksi (Sesuai Filter)</strong>
          <span style={{ fontSize: 12, color: "#065f46", background: "#d1fae5", padding: "4px 10px", borderRadius: 20, fontWeight: 700 }}>
            {filteredTrx.length} Transaksi
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={thStyle}>ID Transaksi</th>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>Konsumen</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Nominal</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrx.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#94a3b8", padding: 30 }}>
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              )}
              {filteredTrx.map((row) => (
                <tr key={row.id_trx}>
                  <td style={tdStyle}>
                    <span style={idBadge}>{row.id_trx}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: "#64748b", fontSize: 12 }}>{row.tgl_trx || "-"}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{row.nama_konsumen || "-"}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <span style={{ fontWeight: 800, color: "#065f46" }}>{rupiah(row.total)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .hide-print {
            display: none !important;
          }
          aside, header {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, sub, gradient, borderColor, valueColor }) {
  return (
    <div style={{
      background: gradient,
      border: `1px solid ${borderColor}`,
      borderRadius: 16,
      padding: "18px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transition: "transform 0.2s, box-shadow 0.2s",
    }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: "auto", fontSize: 12, color: "#64748b", fontWeight: 500 }}>{sub}</div>
    </div>
  );
}

/* ——— Styles ——— */

const h2 = { margin: 0, fontSize: 24, color: "#0f172a", fontWeight: 800, lineHeight: 1.2 };
const errStyle = { color: "#b91c1c", margin: 0, fontSize: 13 };

const filterCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: "16px 20px",
  gap: 20,
};

const selectStyle = {
  fontSize: 13,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  outline: "none",
  color: "#0f172a",
  fontWeight: 500,
  width: "100%",
  cursor: "pointer",
};

const printBtn = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  padding: "10px 16px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
};

const omzetCard = {
  background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
  borderRadius: 20,
  padding: "clamp(20px, 4vw, 28px) clamp(20px, 5vw, 32px)",
  color: "#fff",
  boxShadow: "0 10px 30px rgba(6, 95, 70, 0.2)",
};

const omzetLabel = {
  margin: 0,
  fontSize: 14,
  color: "#a7f3d0",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const omzetValue = {
  margin: "8px 0 0",
  fontSize: "clamp(24px, 4.5vw, 32px)",
  fontWeight: 800,
  color: "#fff",
  lineHeight: 1,
};

const omzetIconBox = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: "#a7f3d0",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
};

const panel = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "clamp(12px, 3vw, 20px)",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  maxWidth: "100%",
  overflow: "hidden",
};

const table = { width: "100%", borderCollapse: "collapse" };
const thStyle = {
  fontSize: "clamp(10px, 2.5vw, 12px)",
  color: "#64748b",
  fontWeight: 700,
  textAlign: "left",
  borderBottom: "2px solid #e2e8f0",
  padding: "10px clamp(4px, 1.5vw, 10px)",
  background: "#f8fafc",
};
const tdStyle = {
  fontSize: "clamp(11px, 2.8vw, 13px)",
  color: "#1e293b",
  borderBottom: "1px solid #f1f5f9",
  padding: "12px clamp(4px, 1.5vw, 10px)",
  wordBreak: "break-word",
};

const idBadge = {
  display: "inline-block",
  padding: "3px clamp(6px, 1.5vw, 12px)",
  borderRadius: 6,
  background: "#f1f5f9",
  color: "#475569",
  fontWeight: 700,
  fontSize: "clamp(9px, 2.2vw, 12px)",
  border: "1px solid #e2e8f0",
};
