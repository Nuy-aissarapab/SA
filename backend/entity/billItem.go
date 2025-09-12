// entity/bill_item.go
package entity

import "gorm.io/gorm"

type BillItem struct {
	gorm.Model
	ItemType  string   `json:"item_type" gorm:"type:varchar(100);not null"`
	Amount    float64  `json:"amount"`

	BillingID uint     `json:"billing_id" gorm:"index;not null"`
	Billing   Billing  `json:"billing"    gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}
// ป้องกันซ้ำรายการในบิลเดียวกัน:
//   CREATE UNIQUE INDEX ux_billitem ON bill_items(billing_id, item_type);
