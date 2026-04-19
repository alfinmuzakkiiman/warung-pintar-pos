import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function getToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DashboardHome() {
  const [summary, setSummary] = useState({
    totalBarang: 0,
    stokMenipis: 0,
    transaksiHariIni: 0,
    pendapatanHariIni: 0,
  });
  const [recentTrx, setRecentTrx] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [adminActivity, setAdminActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [produkRes, trxRes] = await Promise.all([
          api.get("/produk"),
          api.get("/transaksi?limit=100&page=1"),
        ]);

        if (!mounted) return;
        const produk = Array.isArray(produkRes.data) ? produkRes.data : [];
        const trxItems = Array.isArray(trxRes.data?.items) ? trxRes.data.items : [];

        // Filter transaksi hari ini
        const today = getToday();
        const todayTrx = trxItems.filter((row) => {
          const tgl = String(row.tgl_trx || "").slice(0, 10);
          return tgl === today;
        });
        const pendapatanHariIni = todayTrx.reduce((sum, row) => sum + Number(row.total || 0), 0);

        const top = [...produk]
          .sort((a, b) => Number(b.jumlah_terjual || b.terjual || 0) - Number(a.jumlah_terjual || a.terjual || 0))
          .slice(0, 5);

        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const dateStr = `${yyyy}-${mm}-${dd}`;
          
          const total = trxItems
            .filter((r) => String(r.tgl_trx || "").startsWith(dateStr))
            .reduce((sum, r) => sum + Number(r.total || 0), 0);
            
          last7Days.push({
            name: `${dd}/${mm}`,
            total: total
          });
        }

        setSummary({
          totalBarang: produk.length,
          stokMenipis: produk.filter((p) => Number(p.stok || 0) <= 10).length,
          transaksiHariIni: todayTrx.length,
          pendapatanHariIni,
        });
        setRecentTrx(trxItems.slice(0, 5));
        setTopProducts(top);
        setChartData(last7Days);
        setAdminActivity(buildAdminActivity(todayTrx, produk));
      } catch (err) {
        setError(apiErrorMessage(err, "Gagal memuat ringkasan dashboard"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p>Memuat dashboard...</p>;
  if (error) return <p style={{ color: "#dc2626" }}>{error}</p>;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 26, color: "#111827" }}>Dashboard</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Warung-Pintar — kelola barang, stok, transaksi, dan laporan.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/dashboard/data-barang" style={ctaPrimary}>+ Tambah Barang</Link>
          <Link to="/dashboard/transaksi" style={ctaGhost}>+ Buat Transaksi</Link>
        </div>
      </div>

      {/* Summary Cards — Dark Green Theme */}
      <div className="dashboard-cards">
        <Card title="Total Barang" value={summary.totalBarang} sub="Master data barang" />
        <Card title="Stok Menipis" value={summary.stokMenipis} sub="Perlu restock segera" />
        <Card title="Total Transaksi Hari Ini" value={summary.transaksiHariIni} sub={getToday()} />
        <Card title="Pendapatan Hari Ini" value={rupiah(summary.pendapatanHariIni)} sub="Pendapatan kasir hari ini" />
      </div>
      <style>{`
        .dashboard-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 1024px) {
          .dashboard-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .dashboard-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <div style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong style={{ fontSize: 14 }}>Aktivitas Admin</strong>
            <span style={{ fontSize: 12, color: "#64748b" }}>Hari ini</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {adminActivity.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>Belum ada aktivitas admin.</p>
            )}
            {adminActivity.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid #d1fae5", borderRadius: 12, padding: "10px 12px", background: "#f0fdf4" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong style={{ fontSize: 14 }}>Barang Terlaris</strong>
            <Link to="/dashboard/data-barang" style={{ fontSize: 12, color: "#065f46", fontWeight: 600 }}>Lihat semua</Link>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {topProducts.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>Data produk belum tersedia.</p>
            )}
            {topProducts.map((item, index) => (
              <div key={item.id_produk || item.id || `${item.nama_produk}-${index}`} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 10, border: "1px solid #d1fae5", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", background: "#ecfdf5", color: "#065f46", fontSize: 12, fontWeight: 700 }}>
                  #{index + 1}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.nama_produk || item.nama || "Produk"}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Sisa stok {Number(item.stok || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 }}>
        <strong style={{ fontSize: 14, display: "block", marginBottom: 20 }}>Pendapatan 7 Hari Terakhir</strong>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(val) => `Rp${val / 1000}k`} />
              <Tooltip
                cursor={{ fill: "#f0fdf4" }}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(value) => [rupiah(value), "Pendapatan"]}
              />
              <Bar dataKey="total" fill="#065f46" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, sub }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
        border: "1px solid #065f46",
        borderRadius: 16,
        padding: "18px 18px",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(6,95,70,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ fontSize: 12, color: "#a7f3d0", fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ fontWeight: 800, fontSize: 28, lineHeight: 1, color: "#fff" }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 11, color: "#a7f3d0", fontWeight: 500 }}>{sub}</div>
    </div>
  );
}

function rupiah(n) {
  return Number(n || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  fontSize: 11,
  color: "#6b7280",
  fontWeight: 700,
  textAlign: "left",
  borderBottom: "2px solid #e5e7eb",
  padding: "10px 8px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle = {
  fontSize: 13,
  color: "#1f2937",
  borderBottom: "1px solid #f1f5f9",
  padding: "10px 8px",
  verticalAlign: "middle",
};

const idBadge = {
  display: "inline-block",
  padding: "3px 8px",
  borderRadius: 8,
  background: "#f0fdf4",
  color: "#065f46",
  fontWeight: 700,
  fontSize: 12,
  border: "1px solid #bbf7d0",
};

const detailLink = {
  fontSize: 12,
  fontWeight: 600,
  color: "#065f46",
  textDecoration: "none",
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
};

const ctaPrimary = {
  background: "#064e3b",
  color: "#fff",
  textDecoration: "none",
  borderRadius: 10,
  padding: "9px 14px",
  fontSize: 13,
  fontWeight: 700,
};

const ctaGhost = {
  background: "#fff",
  color: "#111827",
  textDecoration: "none",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "9px 14px",
  fontSize: 13,
  fontWeight: 700,
};

const panelStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
};

function buildAdminActivity(todayTrx, produk) {
  const latestTrx = todayTrx[0];
  const stokMenipis = produk.filter((p) => Number(p.stok || 0) <= 10).length;
  const totalPendapatan = todayTrx.reduce((sum, row) => sum + Number(row.total || 0), 0);
  return [
    {
      id: "trx",
      title: latestTrx ? `Transaksi ${latestTrx.id_trx} berhasil` : "Belum ada transaksi hari ini",
      subtitle: latestTrx
        ? `${latestTrx.nama_konsumen || "Konsumen umum"} • ${rupiah(latestTrx.total)}`
        : "Mulai transaksi pertama hari ini",
    },
    {
      id: "income",
      title: `Pendapatan hari ini ${rupiah(totalPendapatan)}`,
      subtitle: `Dari ${todayTrx.length} transaksi`,
    },
    {
      id: "stok",
      title: stokMenipis > 0 ? `${stokMenipis} produk stok menipis` : "Stok aman",
      subtitle: stokMenipis > 0 ? "Segera restock untuk hindari kehabisan" : "Tidak ada produk kritis",
    },
    {
      id: "produk",
      title: `Katalog aktif ${produk.length} produk`,
      subtitle: "Pantau harga dan stok secara berkala",
    },
  ];
}