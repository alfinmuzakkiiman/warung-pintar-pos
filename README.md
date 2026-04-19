# Warung Pintar POS

Sistem Kasir (Point of Sale) modern yang dibangun menggunakan Go (Gin Framework) untuk backend dan React (Vite) untuk frontend.

## Fitur Utama
- **Role Based Access Control (RBAC)**: Admin, Kasir, dan Staff Gudang.
- **Manajemen Produk**: CRUD produk dengan kategori dan supplier.
- **Transaksi Penjualan**: Pencatatan transaksi real-time.
- **Laporan Penjualan**: Dashboard dan laporan periodik.
- **Responsive Design**: Optimal untuk tampilan desktop maupun mobile.

## Teknologi
- **Backend**: Go (Gin Gonic), GORM, MySQL/PostgreSQL.
- **Frontend**: React (Vite), CSS Modern, Lucide React (Icons).
- **Authentication**: JWT (JSON Web Token).

## Cara Menjalankan

### 1. Backend (Go)
Pastikan Anda sudah menginstal Go.
```bash
go mod tidy
go run main.go
```

### 2. Frontend (React)
Pindah ke direktori `front-end`:
```bash
cd front-end
npm install
npm run dev
```

## Lisensi
Proyek ini dilisensikan di bawah [MIT License](LICENSE).
