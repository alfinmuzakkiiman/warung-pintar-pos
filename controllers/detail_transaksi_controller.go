package controllers

import (
	"database/sql"
	"net/http"
	"strings"

	"pos-golang/config"

	"github.com/gin-gonic/gin"
)

func GetDetailTransaksi(c *gin.Context) {
	idTrx := strings.TrimSpace(c.Param("id"))
	if idTrx == "" {
		idTrx = strings.TrimSpace(c.Query("id_trx"))
	}
	if idTrx == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID transaksi wajib diisi"})
		return
	}

	var header struct {
		IDTrx        string
		NamaKonsumen sql.NullString
		TglTrx       string
		Total        float64
	}

	err := config.DB.QueryRow(`
		SELECT CAST(id_trx AS CHAR), COALESCE(nama_konsumen, ''), DATE_FORMAT(tgl_trx, '%Y-%m-%d'), total
		FROM trx
		WHERE id_trx = ?
	`, idTrx).Scan(&header.IDTrx, &header.NamaKonsumen, &header.TglTrx, &header.Total)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Coba beberapa bentuk query agar kompatibel dengan skema lama/baru.
	detailQueries := []string{
		`
		SELECT d.id_brg, COALESCE(b.nama, '-'), d.harga, d.qty, d.subtotal
		FROM trx_detail d
		LEFT JOIN barang_jasa b ON b.id_brg = d.id_brg
		WHERE d.id_trx = ?
		ORDER BY d.id_detail ASC
	`,
		`
		SELECT d.id_brg, COALESCE(b.nama, '-'), d.harga, d.qty, (d.qty * d.harga) AS subtotal
		FROM trx_detail d
		LEFT JOIN barang_jasa b ON b.id_brg = d.id_brg
		WHERE d.id_trx = ?
		ORDER BY d.id_brg ASC
	`,
		`
		SELECT d.id_brg, COALESCE(b.nama, '-'), b.harga, d.jml AS qty, (d.jml * b.harga) AS subtotal
		FROM tmp_trx d
		LEFT JOIN barang_jasa b ON b.id_brg = d.id_brg
		WHERE d.id_trx = ?
		ORDER BY d.id_brg ASC
	`,
	}

	var rows *sql.Rows
	var lastErr error
	for _, q := range detailQueries {
		rows, err = config.DB.Query(q, idTrx)
		if err == nil {
			lastErr = nil
			break
		}
		lastErr = err
	}

	if lastErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": lastErr.Error()})
		return
	}
	defer rows.Close()

	items := []gin.H{}
	grandTotal := 0.0
	for rows.Next() {
		var idBrg, nama string
		var harga, subtotal float64
		var qty int

		if err := rows.Scan(&idBrg, &nama, &harga, &qty, &subtotal); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		grandTotal += subtotal
		items = append(items, gin.H{
			"id_brg":   idBrg,
			"nama":     nama,
			"harga":    harga,
			"qty":      qty,
			"subtotal": subtotal,
		})
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"trx": gin.H{
			"id_trx":        header.IDTrx,
			"nama_konsumen": header.NamaKonsumen.String,
			"tgl_trx":       header.TglTrx,
			"total":         header.Total,
		},
		"items":       items,
		"grand_total": grandTotal,
	})
}
