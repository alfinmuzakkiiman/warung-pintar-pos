package routes

import (
	"pos-golang/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	r.GET("/produk", controllers.GetProduk)
	r.POST("/produk", controllers.TambahProduk)
	r.PUT("/produk/:id", controllers.UpdateProduk)
	r.DELETE("/produk/:id", controllers.HapusProduk)
	r.GET("/supplier", controllers.GetSupplier)
	r.POST("/supplier", controllers.CreateSupplier)
	r.PUT("/supplier/:id", controllers.UpdateSupplier)
	r.DELETE("/supplier/:id", controllers.DeleteSupplier)

	r.GET("/barang-masuk", controllers.GetBarangMasuk)
	r.POST("/barang-masuk", controllers.CreateBarangMasuk)
	r.PUT("/barang-masuk/:id", controllers.UpdateBarangMasuk)
	r.DELETE("/barang-masuk/:id", controllers.DeleteBarangMasuk)

	// barang keluar
	r.GET("/barang-keluar", controllers.GetBarangKeluar)
	r.POST("/barang-keluar", controllers.CreateBarangKeluar)
	r.PUT("/barang-keluar/:id", controllers.UpdateBarangKeluar)
	r.DELETE("/barang-keluar/:id", controllers.DeleteBarangKeluar)

	// transaksi
	r.GET("/transaksi", controllers.GetTransaksi)
	r.POST("/transaksi", controllers.CreateTransaksi)
	r.GET("/transaksi/:id", controllers.GetDetailTransaksi)
	//login
	r.POST("/login", controllers.Login)

	// users / admin
	r.GET("/users", controllers.GetUsers)
	r.POST("/users", controllers.CreateUser)
	r.PUT("/users/:id", controllers.UpdateUser)
	r.DELETE("/users/:id", controllers.DeleteUser)
}
