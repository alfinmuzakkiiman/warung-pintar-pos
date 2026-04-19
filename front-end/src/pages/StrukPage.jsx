import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { api, apiErrorMessage } from "../lib/api";

function rupiah(n) {
  return Number(n || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

function formatDateTime(d) {
  try {
    const x = new Date(d);
    return x.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatFooterShort(d) {
  try {
    const x = new Date(d);
    const dd = String(x.getDate()).padStart(2, "0");
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const yy = String(x.getFullYear()).slice(-2);
    const hh = String(x.getHours()).padStart(2, "0");
    const mi = String(x.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yy} ${hh}:${mi}`;
  } catch {
    return "";
  }
}

const STRUK_STORAGE_PREFIX = "struk_pay_";

/* Logo SVG sama persis dengan Login & Dashboard */
function WarungPintarLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#064e3b" />
      <path d="M7 9h10l-1 6H8L7 9z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="10" cy="18" r="1" fill="#4ade80" />
      <circle cx="15" cy="18" r="1" fill="#4ade80" />
      <circle cx="16" cy="7" r="1.5" fill="#4ade80" />
    </svg>
  );
}

export default function StrukPage() {
  const [params] = useSearchParams();
  const id = params.get("id") || "";
  const navigate = useNavigate();
  const location = useLocation();
  const [header, setHeader] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [payMeta, setPayMeta] = useState(() => location.state || null);

  useEffect(() => {
    if (!id) {
      setError("ID transaksi tidak ada");
      return;
    }
    let meta = location.state;
    if (!meta) {
      try {
        const raw = sessionStorage.getItem(STRUK_STORAGE_PREFIX + id);
        if (raw) meta = JSON.parse(raw);
      } catch {
        meta = null;
      }
    }
    setPayMeta(meta);

    api
      .get(`/transaksi/${id}`)
      .then((res) => {
        setError("");
        setHeader(res.data?.trx || null);
        setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      })
      .catch((err) => {
        setError(apiErrorMessage(err, "Gagal memuat struk"));
        setHeader(null);
        setItems([]);
      });
  }, [id, location.state]);

  const printedAt = useMemo(() => new Date(), []);

  const bayar = payMeta?.bayar != null ? Number(payMeta.bayar) : null;
  const kembalian = payMeta?.kembalian != null ? Number(payMeta.kembalian) : null;

  const goTransaksi = () => {
    try {
      sessionStorage.removeItem(STRUK_STORAGE_PREFIX + id);
    } catch {
      /* ignore */
    }
    navigate("/dashboard/transaksi", { replace: true });
  };

  const doPrint = () => {
    const node = document.getElementById("struk-print-area");
    if (!node) {
      window.print();
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "print-struk");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const styles = `
      body { margin: 0; padding: 16px; font-family: ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif; color: #111827; }
      * { box-sizing: border-box; }
      #struk-print-area { max-width: 420px; margin: 0 auto; }
    `;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${styles}</style></head><body>${node.outerHTML}</body></html>`);
    doc.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 500);
  };

  return (
    <div style={{ display: "grid", gap: 20, maxWidth: 500, margin: "0 auto" }}>
      <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" style={btnPrint} onClick={doPrint}>
          🖨️ Cetak Struk
        </button>
        <button type="button" style={btnSkip} onClick={goTransaksi}>
          ← Kembali ke Transaksi
        </button>
      </div>

      {error && <p className="no-print" style={{ color: "#b91c1c", margin: 0, fontSize: 13 }}>{error}</p>}

      <div id="struk-print-area" style={receiptWrap}>
        <div style={receiptInner}>
          {/* Header brand — logo sama dengan Login & Dashboard */}
          <div style={brandHeader}>
            <div style={logoBox} aria-hidden="true">
              <WarungPintarLogo size={36} />
            </div>
            <div style={brandTextCol}>
              <h1 style={brandTitle}>Warung-Pintar</h1>
              <p style={subTitle}>Struk Pembayaran</p>
            </div>
          </div>

          <p style={timestampTop}>{formatDateTime(printedAt)}</p>

          <div style={dividerSolid} />

          {header && (
            <div style={infoSection}>
              <div style={row}>
                <span style={label}>No. Transaksi</span>
                <span style={value}>{header.id_trx}</span>
              </div>
              <div style={row}>
                <span style={label}>Konsumen</span>
                <span style={value}>{header.nama_konsumen || "Umum"}</span>
              </div>
              <div style={row}>
                <span style={label}>Tanggal</span>
                <span style={value}>{header.tgl_trx || "-"}</span>
              </div>
            </div>
          )}

          <div style={dividerDashed} />

          {/* Table header */}
          <div style={tableHead}>
            <span style={{ ...thCell, flex: 1 }}>Item</span>
            <span style={{ ...thCell, width: 44, textAlign: "center" }}>Qty</span>
            <span style={{ ...thCell, width: 100, textAlign: "right" }}>Subtotal</span>
          </div>

          {/* Items */}
          <div style={{ marginBottom: 8 }}>
            {items.map((it, idx) => (
              <div key={`${it.id_brg}-${idx}`} style={itemBlock}>
                <div style={itemRow}>
                  <span style={{ ...tdName, flex: 1 }}>{it.nama}</span>
                  <span style={{ ...tdQty, width: 44, textAlign: "center" }}>{it.qty}</span>
                  <span style={{ ...tdSub, width: 100, textAlign: "right" }}>{rupiah(it.subtotal)}</span>
                </div>
                <p style={unitPrice}>@ {rupiah(it.harga)}</p>
              </div>
            ))}
          </div>

          <div style={dividerDashed} />

          {/* Total section */}
          {header && (
            <div style={totalSection}>
              <div style={totalRow}>
                <span style={totalLabel}>TOTAL</span>
                <span style={totalAmount}>{rupiah(header.total)}</span>
              </div>
              {bayar != null && (
                <div style={row}>
                  <span style={label}>Tunai</span>
                  <span style={{ ...value, color: "#065f46" }}>{rupiah(bayar)}</span>
                </div>
              )}
              {kembalian != null && (
                <div style={row}>
                  <span style={label}>Kembalian</span>
                  <span style={{ ...value, color: "#059669", fontWeight: 700 }}>{rupiah(kembalian)}</span>
                </div>
              )}
            </div>
          )}

          <div style={dividerSolid} />

          <p style={thanks}>✨ Terima kasih atas pembelian Anda! ✨</p>
          <p style={tagline}>Warung-Pintar — serba ada, serba murah!</p>

          <div style={footerRow}>
            <span style={footerSmall}>{formatFooterShort(printedAt)}</span>
            <span style={footerSmall}>{header?.id_trx || id}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ——— Styles ——— */

const btnPrint = {
  border: "none",
  borderRadius: 12,
  padding: "12px 22px",
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
  transition: "transform 0.15s",
};

const btnSkip = {
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "12px 22px",
  background: "#fff",
  color: "#374151",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const receiptWrap = {
  maxWidth: 460,
  width: "100%",
  margin: "0 auto",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  overflow: "hidden",
};

const receiptInner = {
  padding: "28px 28px 24px",
  fontFamily: 'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif',
  color: "#111827",
};

const brandHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  marginBottom: 12,
  flexWrap: "wrap",
};

const logoBox = {
  width: 56,
  height: 56,
  minWidth: 56,
  minHeight: 56,
  borderRadius: 14,
  background: "#065f46",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 14px rgba(6, 95, 70, 0.35)",
  flexShrink: 0,
};

const brandTextCol = {
  textAlign: "left",
  minWidth: 0,
};

const brandTitle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "#0f172a",
  lineHeight: 1.15,
};

const subTitle = {
  margin: "4px 0 0",
  fontSize: 13,
  color: "#64748b",
  fontWeight: 500,
};

const timestampTop = {
  margin: "0 0 12px",
  fontSize: 12,
  color: "#9ca3af",
  textAlign: "center",
};

const dividerSolid = {
  borderTop: "2px solid #e5e7eb",
  margin: "12px 0",
};

const dividerDashed = {
  borderTop: "1px dashed #d1d5db",
  margin: "10px 0",
};

const infoSection = {
  display: "grid",
  gap: 6,
  marginBottom: 4,
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 16,
  fontSize: 13,
  marginBottom: 4,
};

const label = { color: "#6b7280", flexShrink: 0, fontWeight: 500 };
const value = { fontWeight: 600, textAlign: "right", wordBreak: "break-all", color: "#111827" };

const tableHead = {
  display: "flex",
  fontSize: 11,
  fontWeight: 800,
  marginBottom: 8,
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
};

const thCell = { color: "#6b7280" };

const itemBlock = { marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #f3f4f6" };
const itemRow = { display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13 };
const tdName = { fontWeight: 600, color: "#111827" };
const tdQty = { color: "#374151", fontWeight: 500 };
const tdSub = { fontWeight: 700, color: "#111827" };
const unitPrice = { margin: "2px 0 0", fontSize: 11, color: "#9ca3af" };

const totalSection = {
  margin: "4px 0",
};

const totalRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
  gap: 12,
  padding: "8px 0",
};

const totalLabel = { fontSize: 16, fontWeight: 800, letterSpacing: "0.05em", color: "#374151" };
const totalAmount = { fontSize: 24, fontWeight: 800, color: "#065f46" };

const thanks = {
  margin: "12px 0 4px",
  textAlign: "center",
  fontSize: 13,
  color: "#374151",
  fontWeight: 600,
};

const tagline = {
  margin: "0 0 12px",
  textAlign: "center",
  fontSize: 11,
  color: "#9ca3af",
  fontStyle: "italic",
};

const footerRow = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 11,
  color: "#9ca3af",
  borderTop: "1px solid #f3f4f6",
  paddingTop: 8,
};

const footerSmall = { fontWeight: 500 };
