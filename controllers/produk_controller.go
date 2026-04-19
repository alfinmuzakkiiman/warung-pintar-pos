package controllers

import (
	"database/sql"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"pos-golang/config"
	"pos-golang/helpers"
	"pos-golang/models"

	"github.com/gin-gonic/gin"
)

func GetProduk(c *gin.Context) {
	search := strings.TrimSpace(c.Query("search"))
	availableOnly := c.Query("available") == "1"

	query := "SELECT id_brg, nama, harga, stok, satuan, COALESCE(keterangan, ''), COALESCE(foto, '') FROM barang_jasa WHERE jenis='barang'"
	args := []interface{}{}

	if availableOnly {
		query += " AND stok > 0"
	}
	if search != "" {
		query += " AND (id_brg LIKE ? OR nama LIKE ? OR satuan LIKE ?)"
		like := "%" + search + "%"
		args = append(args, like, like, like)
	}
	query += " ORDER BY id_brg DESC"

	rows, err := config.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var produk []models.Produk

	for rows.Next() {
		var p models.Produk
		var keterangan sql.NullString
		var foto sql.NullString
		if err := rows.Scan(&p.ID, &p.Nama, &p.Harga, &p.Stok, &p.Satuan, &keterangan, &foto); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if keterangan.Valid {
			p.Keterangan = keterangan.String
		} else {
			p.Keterangan = ""
		}
		if foto.Valid {
			p.Foto = foto.String
		} else {
			p.Foto = ""
		}
		produk = append(produk, p)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, produk)
}

func TambahProduk(c *gin.Context) {
	harga, err := strconv.Atoi(c.PostForm("harga"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Harga harus berupa angka"})
		return
	}
	stok, err := strconv.Atoi(c.PostForm("stok"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stok harus berupa angka"})
		return
	}

	id := "BR" + helpers.RandString(3)
	fotoPath := ""

	if file, err := c.FormFile("foto"); err == nil {
		if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		ext := strings.ToLower(filepath.Ext(file.Filename))
		filename := id + "_" + helpers.RandString(6) + ext
		savePath := filepath.Join("uploads", filename)
		if err := c.SaveUploadedFile(file, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		fotoPath = "/uploads/" + filename
	}

	_, err = config.DB.Exec("INSERT INTO barang_jasa (id_brg, nama, harga, stok, satuan, keterangan, foto, jenis) VALUES (?, ?, ?, ?, ?, ?, ?, 'barang')",
		id,
		c.PostForm("nama"),
		harga,
		stok,
		c.PostForm("satuan"),
		c.PostForm("keterangan"),
		fotoPath,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Produk ditambahkan"})
}

func UpdateProduk(c *gin.Context) {
	id := c.Param("id")

	var fotoLama sql.NullString
	err := config.DB.QueryRow("SELECT foto FROM barang_jasa WHERE id_brg=? AND jenis='barang'", id).Scan(&fotoLama)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	harga, err := strconv.Atoi(c.PostForm("harga"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Harga harus berupa angka"})
		return
	}
	stok, err := strconv.Atoi(c.PostForm("stok"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stok harus berupa angka"})
		return
	}

	fotoPath := ""
	if fotoLama.Valid {
		fotoPath = fotoLama.String
	}
	if file, err := c.FormFile("foto"); err == nil {
		if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		ext := strings.ToLower(filepath.Ext(file.Filename))
		filename := id + "_" + helpers.RandString(6) + ext
		savePath := filepath.Join("uploads", filename)
		if err := c.SaveUploadedFile(file, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		fotoPath = "/uploads/" + filename

		if fotoLama.Valid && strings.HasPrefix(fotoLama.String, "/uploads/") {
			_ = os.Remove("." + fotoLama.String)
		}
	}

	result, err := config.DB.Exec("UPDATE barang_jasa SET nama=?, harga=?, stok=?, satuan=?, keterangan=?, foto=? WHERE id_brg=? AND jenis='barang'",
		c.PostForm("nama"),
		harga,
		stok,
		c.PostForm("satuan"),
		c.PostForm("keterangan"),
		fotoPath,
		id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Produk diupdate"})
}

func HapusProduk(c *gin.Context) {
	id := c.Param("id")

	var detailCount int
	err := config.DB.QueryRow("SELECT COUNT(*) FROM trx_detail WHERE id_brg=?", id).Scan(&detailCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if detailCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Produk tidak dapat dihapus karena sudah digunakan dalam transaksi"})
		return
	}

	var fotoPath sql.NullString
	_ = config.DB.QueryRow("SELECT foto FROM barang_jasa WHERE id_brg=? AND jenis='barang'", id).Scan(&fotoPath)

	result, err := config.DB.Exec("DELETE FROM barang_jasa WHERE id_brg=? AND jenis='barang'", id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
		return
	}
	if fotoPath.Valid && strings.HasPrefix(fotoPath.String, "/uploads/") {
		_ = os.Remove("." + fotoPath.String)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Produk dihapus"})
}
