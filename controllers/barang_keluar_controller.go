package controllers

import (
	"database/sql"
	"fmt"
	"net/http"
	"pos-golang/config"

	"github.com/gin-gonic/gin"
)

func resolveBarangKeluarTable() (string, error) {
	candidates := []string{"trxbarangkeluar", "trxbarang_keluar", "trx_barang_keluar"}

	for _, table := range candidates {
		var count int
		err := config.DB.QueryRow(`
			SELECT COUNT(*)
			FROM information_schema.tables
			WHERE table_schema = DATABASE() AND table_name = ?
		`, table).Scan(&count)
		if err != nil {
			return "", err
		}
		if count > 0 {
			return table, nil
		}
	}

	return "", fmt.Errorf("tabel transaksi barang keluar tidak ditemukan (cek: trxbarangkeluar/trxbarang_keluar/trx_barang_keluar)")
}

func GetBarangKeluar(c *gin.Context) {
	table, err := resolveBarangKeluarTable()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rows, err := config.DB.Query(fmt.Sprintf(`
	SELECT t.id_trxbrg, t.tgl_trxbrg, t.id_brg,
	       IFNULL(b.nama, '-') AS nama,
	       t.tujuan, t.jml_brg, IFNULL(t.ket_trxbrg, '')
	FROM %s t
	LEFT JOIN barang_jasa b ON t.id_brg=b.id_brg
	ORDER BY t.id_trxbrg DESC
`, table))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	data := []gin.H{}
	for rows.Next() {
		var id int
		var tgl, nama, tujuan, ket string
		var idBarang string
		var jml int
		if err := rows.Scan(&id, &tgl, &idBarang, &nama, &tujuan, &jml, &ket); err != nil {
			continue
		}

		data = append(data, gin.H{
			"id":         id,
			"tanggal":    tgl,
			"id_brg":     idBarang,
			"barang":     nama,
			"tujuan":     tujuan,
			"jumlah":     jml,
			"keterangan": ket,
		})
	}

	c.JSON(http.StatusOK, data)
}

func CreateBarangKeluar(c *gin.Context) {
	table, err := resolveBarangKeluarTable()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var input struct {
		Tanggal    string `json:"tanggal"`
		IDBarang   string `json:"id_brg"`
		Tujuan     string `json:"tujuan"`
		Jumlah     int    `json:"jumlah"`
		Keterangan string `json:"keterangan"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.Jumlah <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jumlah harus lebih dari 0"})
		return
	}

	// cek stok
	var stok int
	err = config.DB.QueryRow("SELECT stok FROM barang_jasa WHERE id_brg=?", input.IDBarang).Scan(&stok)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Barang tidak ditemukan"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if stok < input.Jumlah {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stok tidak cukup"})
		return
	}

	// insert
	_, err = config.DB.Exec(fmt.Sprintf(`
		INSERT INTO %s (tgl_trxbrg,id_brg,tujuan,jml_brg,ket_trxbrg)
		VALUES (?,?,?,?,?)
	`, table), input.Tanggal, input.IDBarang, input.Tujuan, input.Jumlah, input.Keterangan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// update stok
	_, err = config.DB.Exec(`
		UPDATE barang_jasa SET stok = stok - ? WHERE id_brg=?
	`, input.Jumlah, input.IDBarang)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Barang keluar berhasil"})
}

func UpdateBarangKeluar(c *gin.Context) {
	id := c.Param("id")
	table, err := resolveBarangKeluarTable()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var input struct {
		Tanggal    string `json:"tanggal"`
		IDBarang   string `json:"id_brg"`
		Tujuan     string `json:"tujuan"`
		Jumlah     int    `json:"jumlah"`
		Keterangan string `json:"keterangan"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.Jumlah <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jumlah harus lebih dari 0"})
		return
	}

	var oldJml int
	var oldBarang string
	err = config.DB.QueryRow(fmt.Sprintf(`
		SELECT id_brg, jml_brg FROM %s WHERE id_trxbrg=?
	`, table), id).Scan(&oldBarang, &oldJml)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_, err = config.DB.Exec(`
		UPDATE barang_jasa SET stok = stok + ? WHERE id_brg=?
	`, oldJml, oldBarang)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var stokBaru int
	err = config.DB.QueryRow("SELECT stok FROM barang_jasa WHERE id_brg=?", input.IDBarang).Scan(&stokBaru)
	if err == sql.ErrNoRows {
		_, _ = config.DB.Exec(`
			UPDATE barang_jasa SET stok = stok - ? WHERE id_brg=?
		`, oldJml, oldBarang)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Barang tidak ditemukan"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if stokBaru < input.Jumlah {
		_, _ = config.DB.Exec(`
			UPDATE barang_jasa SET stok = stok - ? WHERE id_brg=?
		`, oldJml, oldBarang)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stok tidak cukup"})
		return
	}

	_, err = config.DB.Exec(fmt.Sprintf(`
		UPDATE %s
		SET tgl_trxbrg=?, id_brg=?, tujuan=?, jml_brg=?, ket_trxbrg=?
		WHERE id_trxbrg=?
	`, table), input.Tanggal, input.IDBarang, input.Tujuan, input.Jumlah, input.Keterangan, id)
	if err != nil {
		_, _ = config.DB.Exec(`
			UPDATE barang_jasa SET stok = stok - ? WHERE id_brg=?
		`, oldJml, oldBarang)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_, err = config.DB.Exec(`
		UPDATE barang_jasa SET stok = stok - ? WHERE id_brg=?
	`, input.Jumlah, input.IDBarang)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data berhasil diupdate"})
}

func DeleteBarangKeluar(c *gin.Context) {
	id := c.Param("id")
	table, err := resolveBarangKeluarTable()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var idBrg string
	var jml int
	err = config.DB.QueryRow(fmt.Sprintf(`
		SELECT id_brg, jml_brg FROM %s WHERE id_trxbrg=?
	`, table), id).Scan(&idBrg, &jml)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_, err = config.DB.Exec(`
		UPDATE barang_jasa SET stok = stok + ? WHERE id_brg=?
	`, jml, idBrg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_, err = config.DB.Exec(fmt.Sprintf(`
		DELETE FROM %s WHERE id_trxbrg=?
	`, table), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data dihapus"})
}
