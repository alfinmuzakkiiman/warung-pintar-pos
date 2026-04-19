package controllers

import (
	"database/sql"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"pos-golang/config"

	"github.com/gin-gonic/gin"
)

func GetTransaksi(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	q := strings.TrimSpace(c.Query("q"))

	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}

	offset := (page - 1) * limit

	countQuery := "SELECT COUNT(*) FROM trx"
	countArgs := []interface{}{}
	if q != "" {
		countQuery += " WHERE nama_konsumen LIKE ?"
		countArgs = append(countArgs, "%"+q+"%")
	}

	var totalData int
	if err := config.DB.QueryRow(countQuery, countArgs...).Scan(&totalData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalPage := int(math.Ceil(float64(totalData) / float64(limit)))
	if totalPage == 0 {
		totalPage = 1
	}

	dataQuery := `
		SELECT CAST(id_trx AS CHAR), nama_konsumen, DATE_FORMAT(tgl_trx, '%Y-%m-%d'), total
		FROM trx
	`
	dataArgs := []interface{}{}
	if q != "" {
		dataQuery += " WHERE nama_konsumen LIKE ?"
		dataArgs = append(dataArgs, "%"+q+"%")
	}
	dataQuery += " ORDER BY id_trx DESC LIMIT ? OFFSET ?"
	dataArgs = append(dataArgs, limit, offset)

	rows, err := config.DB.Query(dataQuery, dataArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := []gin.H{}
	for rows.Next() {
		var idTrx sql.NullString
		var namaKonsumen sql.NullString
		var tglTrx sql.NullString
		var total float64

		if err := rows.Scan(&idTrx, &namaKonsumen, &tglTrx, &total); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		items = append(items, gin.H{
			"id_trx":        idTrx.String,
			"nama_konsumen": namaKonsumen.String,
			"tgl_trx":       tglTrx.String,
			"total":         total,
		})
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items":       items,
		"page":        page,
		"limit":       limit,
		"total_data":  totalData,
		"total_page":  totalPage,
		"has_prev":    page > 1,
		"has_next":    page < totalPage,
		"search":      q,
		"start_index": offset + 1,
	})
}

type transaksiItemInput struct {
	IDBarang string  `json:"id_brg"`
	Qty      int     `json:"qty"`
	Harga    float64 `json:"harga"`
}

type createTransaksiInput struct {
	NamaKonsumen string               `json:"nama_konsumen"`
	Bayar        float64              `json:"bayar"`
	Items        []transaksiItemInput `json:"items"`
}

func CreateTransaksi(c *gin.Context) {
	var input createTransaksiInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(input.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Item transaksi tidak boleh kosong"})
		return
	}

	total := 0.0
	for _, item := range input.Items {
		if strings.TrimSpace(item.IDBarang) == "" || item.Qty <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Item transaksi tidak valid"})
			return
		}
		total += float64(item.Qty) * item.Harga
	}

	if input.Bayar < total {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Uang bayar kurang dari total transaksi"})
		return
	}

	tx, err := config.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer tx.Rollback()

	idTrx, err := generateTrxID(tx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, item := range input.Items {
		var stok int
		err := tx.QueryRow("SELECT stok FROM barang_jasa WHERE id_brg=? FOR UPDATE", item.IDBarang).Scan(&stok)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Barang %s tidak ditemukan", item.IDBarang)})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if stok < item.Qty {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Stok barang %s tidak cukup", item.IDBarang)})
			return
		}
	}

	namaKonsumen := strings.TrimSpace(input.NamaKonsumen)
	_, err = tx.Exec(`
		INSERT INTO trx (id_trx, nama_konsumen, tgl_trx, total)
		VALUES (?, ?, ?, ?)
	`, idTrx, namaKonsumen, time.Now().Format("2006-01-02"), total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, item := range input.Items {
		subtotal := float64(item.Qty) * item.Harga
		_, err = tx.Exec(`
			INSERT INTO trx_detail (id_trx, id_brg, qty, harga, subtotal)
			VALUES (?, ?, ?, ?, ?)
		`, idTrx, item.IDBarang, item.Qty, item.Harga, subtotal)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		_, err = tx.Exec("UPDATE barang_jasa SET stok = stok - ? WHERE id_brg = ?", item.Qty, item.IDBarang)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Transaksi berhasil disimpan",
		"id_trx":        idTrx,
		"nama_konsumen": namaKonsumen,
		"total":         total,
		"bayar":         input.Bayar,
		"kembalian":     input.Bayar - total,
	})
}

func generateTrxID(tx *sql.Tx) (string, error) {
	datePrefix := time.Now().Format("20060102")
	prefix := "TRX" + datePrefix

	var count int
	if err := tx.QueryRow("SELECT COUNT(*) FROM trx WHERE id_trx LIKE ?", prefix+"%").Scan(&count); err != nil {
		return "", err
	}

	return fmt.Sprintf("%s%04d", prefix, count+1), nil
}
