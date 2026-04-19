package controllers

import (
	"net/http"
	"pos-golang/config"
	"pos-golang/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Login(c *gin.Context) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	c.ShouldBindJSON(&input)

	var user struct {
		ID       int
		Username string
		Password string
		Role     string
	}

	err := config.DB.QueryRow(`
		SELECT id, username, password, role 
		FROM users WHERE username=?
	`, input.Username).Scan(&user.ID, &user.Username, &user.Password, &user.Role)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak ditemukan"})
		return
	}

	// 🔐 cek password pakai bcrypt
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password salah"})
		return
	}

	// 🔑 generate token
	token, _ := utils.GenerateToken(user.ID, user.Username, user.Role)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login berhasil",
		"token":   token,
		"role":    user.Role,
	})
}
