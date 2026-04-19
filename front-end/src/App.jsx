import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/dashboard";
import DataBarangPage from "./pages/DataBarangPage";
import SupplierPage from "./pages/SupplierPage";
import BarangMasukPage from "./pages/BarangMasukPage";
import BarangKeluarPage from "./pages/BarangKeluarPage";
import TransaksiPage from "./pages/TransaksiPage";
import DetailTransaksiPage from "./pages/DetailTransaksiPage";
import StrukPage from "./pages/StrukPage";
import LaporanPage from "./pages/LaporanPage";
import AdminPage from "./pages/AdminPage";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ children, allowed }) {
  const role = localStorage.getItem("role") || "admin";
  if (!allowed.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicOnly({ children }) {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }>
          <Route index element={<DashboardHome />} />
          <Route path="data-barang" element={<DataBarangPage />} />
          <Route path="supplier" element={<RequireRole allowed={["admin", "gudang"]}><SupplierPage /></RequireRole>} />
          <Route path="barang-masuk" element={<RequireRole allowed={["admin", "gudang"]}><BarangMasukPage /></RequireRole>} />
          <Route path="barang-keluar" element={<RequireRole allowed={["admin", "gudang"]}><BarangKeluarPage /></RequireRole>} />
          <Route path="transaksi" element={<RequireRole allowed={["admin", "kasir"]}><TransaksiPage /></RequireRole>} />
          <Route path="detail-transaksi" element={<RequireRole allowed={["admin", "kasir"]}><DetailTransaksiPage /></RequireRole>} />
          <Route path="struk" element={<StrukPage />} />
          <Route path="laporan" element={<RequireRole allowed={["admin"]}><LaporanPage /></RequireRole>} />
          <Route path="data-admin" element={<RequireRole allowed={["admin"]}><AdminPage /></RequireRole>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;