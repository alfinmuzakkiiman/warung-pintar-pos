package models

type BarangMasuk struct {
	ID         int    `json:"id"`
	Tanggal    string `json:"tanggal"`
	IDBarang   string `json:"id_brg"`
	IDSupplier string `json:"id_spl"`
	Jumlah     int    `json:"jumlah"`
	Keterangan string `json:"keterangan"`
}
