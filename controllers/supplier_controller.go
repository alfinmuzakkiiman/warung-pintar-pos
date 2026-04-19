package controllers

import (
	"net/http"
	"pos-golang/config"
	"pos-golang/helpers"

	"github.com/gin-gonic/gin"
)

func GetSupplier(c *gin.Context) {
	rows, err := config.DB.Query(`
		SELECT id_spl, nama_spl
		FROM supplier
		ORDER BY id_spl ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	data := []gin.H{}
	for rows.Next() {
		var id, nama string
		if err := rows.Scan(&id, &nama); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		data = append(data, gin.H{
			"id_spl":   id,
			"nama_spl": nama,
		})
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

func CreateSupplier(c *gin.Context) {
	var input struct {
		NamaSpl string `json:"nama_spl"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := "SP" + helpers.RandString(4)

	_, err := config.DB.Exec("INSERT INTO supplier (id_spl, nama_spl) VALUES (?, ?)", id, input.NamaSpl)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id_spl":   id,
		"nama_spl": input.NamaSpl,
	})
}

func UpdateSupplier(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		NamaSpl string `json:"nama_spl"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := config.DB.Exec("UPDATE supplier SET nama_spl = ? WHERE id_spl = ?", input.NamaSpl, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Supplier diupdate"})
}

func DeleteSupplier(c *gin.Context) {
	id := c.Param("id")
	_, err := config.DB.Exec("DELETE FROM supplier WHERE id_spl = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Supplier dihapus"})
}
