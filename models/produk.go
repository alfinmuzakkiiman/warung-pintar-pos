package models

type Produk struct {
	ID         string `json:"id_brg"`
	Nama       string `json:"nama"`
	Harga      int    `json:"harga"`
	Stok       int    `json:"stok"`
	Satuan     string `json:"satuan"`
	Keterangan string `json:"keterangan"`
	Foto       string `json:"foto"`
}
