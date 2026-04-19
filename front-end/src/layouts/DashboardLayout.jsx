import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const MENU_MAP = [
  { label: "Dashboard", path: "/dashboard", icon: "grid", roles: ["admin", "kasir", "gudang"] },
  { label: "Data Barang", path: "/dashboard/data-barang", icon: "box", roles: ["admin", "kasir", "gudang"] },
  { label: "Supplier", path: "/dashboard/supplier", icon: "truck", roles: ["admin", "gudang"] },
  { label: "Barang Masuk", path: "/dashboard/barang-masuk", icon: "arrowup", roles: ["admin", "gudang"] },
  { label: "Barang Keluar", path: "/dashboard/barang-keluar", icon: "arrowdown", roles: ["admin", "gudang"] },
  { label: "Transaksi", path: "/dashboard/transaksi", icon: "receipt", roles: ["admin", "kasir"] },
  { label: "Detail Transaksi", path: "/dashboard/detail-transaksi", icon: "lines", roles: ["admin", "kasir"] },
  { label: "Laporan", path: "/dashboard/laporan", icon: "report", roles: ["admin"] },
  { label: "Data Admin", path: "/dashboard/data-admin", icon: "admin", roles: ["admin"] },
];

function useBreakpoint() {
  const getWidth = () => (typeof window !== "undefined" ? window.innerWidth : 1400);
  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1200,
    isDesktop: width >= 1200,
  };
}

function Icon({ name, size = 16, color = "currentColor" }) {
  const s = { width: size, height: size, flexShrink: 0 };
  const icons = {
    grid: <svg style={s} viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill={color} /><rect x="9" y="1" width="6" height="6" rx="1.5" fill={color} /><rect x="1" y="9" width="6" height="6" rx="1.5" fill={color} /><rect x="9" y="9" width="6" height="6" rx="1.5" fill={color} /></svg>,
    arrowup: <svg style={s} viewBox="0 0 12 12" fill="none"><path d="M6 9V3M3 6l3-3 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    arrowdown: <svg style={s} viewBox="0 0 12 12" fill="none"><path d="M6 3v6M3 6l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    box: <svg style={s} viewBox="0 0 16 16" fill="none"><path d="M2.5 5.5L8 2.7l5.5 2.8-5.5 2.8-5.5-2.8z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /><path d="M2.5 5.5V12L8 15l5.5-3V5.5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /><path d="M8 8.3V15" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    receipt: <svg style={s} viewBox="0 0 16 16" fill="none"><path d="M4 2h8v12l-1.2-.8L9.6 14l-1.2-.8L7.2 14 6 13.2 4.8 14 4 13.2V2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /><path d="M6 5h4M6 8h4M6 11h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    lines: <svg style={s} viewBox="0 0 16 16" fill="none"><path d="M3 5h10M3 8h7M3 11h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    report: <svg style={s} viewBox="0 0 16 16" fill="none"><path d="M3 2.5h7l3 3V13a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 13V2.5z" stroke={color} strokeWidth="1.5" /><path d="M10 2.5V6h3" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /><path d="M5.5 8.5h5M5.5 11h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    admin: <svg style={s} viewBox="0 0 16 16" fill="none"><path d="M8 1.5l5 2v4.3c0 3.1-2 5.9-5 6.7-3-0.8-5-3.6-5-6.7V3.5l5-2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /><path d="M6.2 8.2l1.1 1.1 2.5-2.6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    users: <svg style={s} viewBox="0 0 16 16" fill="none"><path d="M10.5 4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" stroke={color} strokeWidth="1.5" /><path d="M2 13.5C2 11 4 9.5 8 9.5s6 1.5 6 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    truck: <svg style={s} viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" stroke={color} strokeWidth="2" strokeLinejoin="round" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke={color} strokeWidth="2" strokeLinejoin="round" /><circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" /><circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" /></svg>,
    search: <svg style={s} viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke={color} strokeWidth="1.5" /><path d="M11 11l3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    mail: <svg style={s} viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="11" rx="2" stroke={color} strokeWidth="1.5" /><path d="M1 6l7 4 7-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    bell: <svg style={s} viewBox="0 0 16 16" fill="none"><path d="M8 1a5 5 0 015 5c0 3 1.5 4 1.5 5h-13C1.5 10 3 9 3 6a5 5 0 015-5z" stroke={color} strokeWidth="1.5" /><path d="M6.5 14a1.5 1.5 0 003 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    menu: <svg style={s} viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    close: <svg style={s} viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    logout: <svg style={s} viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    help: <svg style={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" /><path d="M6.5 6.5a1.5 1.5 0 012.9.5c0 1-1.5 1.5-1.5 2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" /><circle cx="8" cy="12" r=".6" fill={color} /></svg>,
    sun: <svg style={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.5" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M11 3.5L9.5 5M5 11L3.5 12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    moon: <svg style={s} viewBox="0 0 16 16" fill="none"><path d="M10.8 1.6a6 6 0 11-7.2 7.2A5.2 5.2 0 0010.8 1.6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  };
  return icons[name] || null;
}

function NavItem({ icon, label, active, onClick }) {
  const color = active ? "#065f46" : "var(--muted)";
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "9px 10px",
        borderLeft: active ? "3px solid #065f46" : "3px solid transparent",
        borderRadius: active ? "0 9px 9px 0" : 9,
        background: active ? "#f0fdf4" : "transparent",
        cursor: "pointer", marginBottom: 2,
      }}>
      <Icon name={icon} size={15} color={color} />
      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color }}>{label}</span>
    </div>
  );
}

export default function DashboardLayout() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [generalActive, setGeneralActive] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop]);

  const role = localStorage.getItem("role") || "admin";
  const userInitial = role.substring(0, 2).toUpperCase();
  const filteredMenu = MENU_MAP.filter((item) => item.roles.includes(role));

  const activePath = MENU_MAP.find((x) => location.pathname === x.path)?.path || "/dashboard";
  const activeLabel = MENU_MAP.find((x) => x.path === activePath)?.label || "Dashboard";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  const theme = { bg: "#f3f4f6", panel: "#ffffff", border: "#e5e7eb", text: "#111827", muted: "#6b7280" };

  return (
    <div style={{ display: "flex", height: "100vh", background: theme.bg, fontFamily: "'Inter', -apple-system, sans-serif", overflow: "hidden", ["--muted"]: theme.muted }}>
      {(isMobile || isTablet) && drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      )}

      <aside style={{
        width: 240,
        background: theme.panel,
        borderRight: `1px solid ${theme.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "18px 12px",
        flexShrink: 0,
        overflowY: "auto",
        ...((!isDesktop) ? {
          position: "fixed", top: 0, left: 0, height: "100%", zIndex: 50,
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: drawerOpen ? "4px 0 24px rgba(0,0,0,0.12)" : "none",
        } : {
          position: "relative",
        }),
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, padding: "0 6px" }}>
          <div style={{ width: 36, height: 36, background: "#065f46", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="6" fill="#064e3b" />
              <path d="M7 9h10l-1 6H8L7 9z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="10" cy="18" r="1" fill="#4ade80" />
              <circle cx="15" cy="18" r="1" fill="#4ade80" />
              <circle cx="16" cy="7" r="1.5" fill="#4ade80" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: theme.text, flex: 1 }}>Warung-Pintar</span>
          {!isDesktop && (
            <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
              <Icon name="close" size={18} color="#6b7280" />
            </button>
          )}
        </div>

        <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", margin: "0 0 6px 10px" }}>MENU</p>
        {filteredMenu.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            active={activePath === item.path}
            onClick={() => {
              navigate(item.path);
              if (!isDesktop) setDrawerOpen(false);
            }}
          />
        ))}

        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: "0.08em", margin: "0 0 6px 10px" }}>GENERAL</p>

          <NavItem
            icon="help"
            label="Help"
            active={generalActive === "help"}
            onClick={() => {
              setGeneralActive("help");
              window.open("https://www.instagram.com/404.alpnn/", "_blank", "noopener,noreferrer");
            }}
          />
        </div>

        <div style={{ marginTop: "auto", paddingTop: 8 }}>
          <NavItem
            icon="logout"
            label="Log out"
            active={false}
            onClick={logout}
          />
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "10px 14px" : "12px 22px",
          background: theme.panel, borderBottom: `1px solid ${theme.border}`, flexShrink: 0, gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            {!isDesktop && (
              <button
                onClick={() => setDrawerOpen(true)}
                style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <Icon name="menu" size={16} color="#374151" />
              </button>
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#f9fafb",
              border: `1px solid ${theme.border}`,
              borderRadius: 10, padding: "8px 14px",
              width: isMobile ? "100%" : 260, minWidth: 0,
            }}>
              <Icon name="search" size={14} color={theme.muted} />
              <input placeholder={`Cari di ${activeLabel}`} style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: theme.text, width: "100%", minWidth: 0, padding: 0 }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexShrink: 0 }}>
            {["mail", "bell"].map((ic) => (
              <div key={ic} style={{ width: 36, height: 36, border: `1px solid ${theme.border}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: theme.panel }}>
                <Icon name={ic} size={15} color={theme.muted} />
              </div>
            ))}
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0, letterSpacing: 1 }}>{userInitial}</div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "14px 12px" : isTablet ? "18px 18px" : "22px 26px" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
