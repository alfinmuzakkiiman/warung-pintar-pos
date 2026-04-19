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
	rows, err := config.DB.Query("DESCRIBE supplier")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var field, typ, null, key, extra string
		var def interface{}
		err := rows.Scan(&field, &typ, &null, &key, &def, &extra)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Field: %s, Type: %s, Key: %s, Extra: %s\n", field, typ, key, extra)
	}
}
