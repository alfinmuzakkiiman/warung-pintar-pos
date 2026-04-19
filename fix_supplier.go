//go:build ignore
// +build ignore

package main


import (
	"fmt"
	"log"
	"pos-golang/config"
)

func main() {
	config.ConnectDB()

	// Delete supplier with empty ID
	res, err := config.DB.Exec("DELETE FROM supplier WHERE id_spl = '' OR id_spl IS NULL")
	if err != nil {
		log.Fatalf("Error deleting: %v", err)
	}

	affected, _ := res.RowsAffected()
	fmt.Printf("Berhasil menghapus %d supplier dengan ID kosong.\n", affected)
}
