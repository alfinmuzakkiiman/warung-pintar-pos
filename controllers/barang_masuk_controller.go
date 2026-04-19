package controllers

import (
	"net/http"
	"pos-golang/config"

	"github.com/gin-gonic/gin"
)

// 🔥 GET
func GetBarangMasuk(c *gin.Context) {
	rows, err := config.DB.Query(`
	SELECT t.id_trxbrg, t.tgl_trxbrg, t.id_brg, IFNULL(t.id_spl, ''),
	       IFNULL(b.nama, '-') AS nama,
	       IFNULL(s.nama_spl, '-') AS nama_spl,
	       t.jml_brg, t.ket_trxbrg
	FROM trxbarang t
	LEFT JOIN barang_jasa b ON t.id_brg=b.id_brg
	LEFT JOIN supplier s ON t.id_spl=s.id_spl
	ORDER BY t.id_trxbrg DESC
`)

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	data := []gin.H{}

	for rows.Next() {
		var id int
		var tgl, nama, spl, ket string
		var idBarang, idSupplier string
		var jml int

		err := rows.Scan(&id, &tgl, &idBarang, &idSupplier, &nama, &spl, &jml, &ket)
		if err != nil {
			continue
		}

		data = append(data, gin.H{
			"id":         id,
			"tanggal":    tgl,
			"id_brg":     idBarang,
			"id_spl":     idSupplier,
			"barang":     nama,
			"supplier":   spl,
			"jumlah":     jml,
			"keterangan": ket,
		})
	}

	c.JSON(http.StatusOK, data)
}

func CreateBarangMasuk(c *gin.Context) {
	var input struct {
		Tanggal    string `json:"tanggal"`
		IDBarang   string `json:"id_brg"`
		IDSupplier string `json:"id_spl"`
		Jumlah     int    `json:"jumlah"`
		Keterangan string `json:"keterangan"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if input.IDSupplier == "" {
		c.JSON(400, gin.H{"error": "Supplier wajib diisi"})
		return
	}

	// 🔥 2. VALIDASI BARANG (TAMBAH DI SINI)
	var exist int
	err := config.DB.QueryRow(
		"SELECT COUNT(*) FROM barang_jasa WHERE id_brg=?",
		input.IDBarang,
	).Scan(&exist)

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if exist == 0 {
		c.JSON(400, gin.H{"error": "Barang tidak ditemukan"})
		return
	}

	// 🔥 VALIDASI SUPPLIER
	var existSupplier int
	err = config.DB.QueryRow("SELECT COUNT(*) FROM supplier WHERE id_spl=?", input.IDSupplier).Scan(&existSupplier)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if existSupplier == 0 {
		c.JSON(400, gin.H{"error": "Supplier tidak ditemukan"})
		return
	}

	// 3. insert trx
	_, err = config.DB.Exec(`
		INSERT INTO trxbarang (tgl_trxbrg,id_brg,id_spl,jml_brg,ket_trxbrg)
		VALUES (?,?,?,?,?)
	`, input.Tanggal, input.IDBarang, input.IDSupplier, input.Jumlah, input.Keterangan)

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// 4. update stok
	_, err = config.DB.Exec(`
		UPDATE barang_jasa SET stok = stok + ? WHERE id_brg=?
	`, input.Jumlah, input.IDBarang)

	c.JSON(200, gin.H{"message": "Barang masuk berhasil"})
}

// 🔥 PUT (UPDATE + FIX STOK)
func UpdateBarangMasuk(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Tanggal    string `json:"tanggal"`
		IDBarang   string `json:"id_brg"`
		IDSupplier string `json:"id_spl"`
		Jumlah     int    `json:"jumlah"`
		Keterangan string `json:"keterangan"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if input.IDSupplier == "" {
		c.JSON(400, gin.H{"error": "Supplier wajib diisi"})
		return
	}

	var existBarang int
	err := config.DB.QueryRow(
		"SELECT COUNT(*) FROM barang_jasa WHERE id_brg=?",
		input.IDBarang,
	).Scan(&existBarang)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	if existBarang == 0 {
		c.JSON(400, gin.H{"error": "Barang tidak ditemukan"})
		return
	}

	var existSupplier int
	err = config.DB.QueryRow("SELECT COUNT(*) FROM supplier WHERE id_spl=?", input.IDSupplier).Scan(&existSupplier)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	if existSupplier == 0 {
		c.JSON(400, gin.H{"error": "Supplier tidak ditemukan"})
		return
	}

	// ambil data lama
	var oldJml int
	var oldBarang string

	err = config.DB.QueryRow(`
		SELECT id_brg, jml_brg FROM trxbarang WHERE id_trxbrg=?
	`, id).Scan(&oldBarang, &oldJml)

	if err != nil {
		c.JSON(404, gin.H{"error": "Data tidak ditemukan"})
		return
	}

	// rollback stok lama
	config.DB.Exec(`
		UPDATE barang_jasa SET stok = stok - ? WHERE id_brg=?
	`, oldJml, oldBarang)

	// update trx
	_, err = config.DB.Exec(`
		UPDATE trxbarang 
		SET tgl_trxbrg=?, id_brg=?, id_spl=?, jml_brg=?, ket_trxbrg=?
		WHERE id_trxbrg=?
	`, input.Tanggal, input.IDBarang, input.IDSupplier, input.Jumlah, input.Keterangan, id)

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// tambah stok baru
	config.DB.Exec(`
		UPDATE barang_jasa SET stok = stok + ? WHERE id_brg=?
	`, input.Jumlah, input.IDBarang)

	c.JSON(200, gin.H{"message": "Data berhasil diupdate"})
}

// 🔥 DELETE
func DeleteBarangMasuk(c *gin.Context) {
	id := c.Param("id")

	var idBrg string
	var jml int

	err := config.DB.QueryRow(`
		SELECT id_brg, jml_brg FROM trxbarang WHERE id_trxbrg=?
	`, id).Scan(&idBrg, &jml)

	if err != nil {
		c.JSON(404, gin.H{"error": "Data tidak ditemukan"})
		return
	}

	config.DB.Exec(`
		UPDATE barang_jasa SET stok = stok - ? WHERE id_brg=?
	`, jml, idBrg)

	config.DB.Exec(`
		DELETE FROM trxbarang WHERE id_trxbrg=?
	`, id)

	c.JSON(200, gin.H{"message": "Data dihapus"})
}
