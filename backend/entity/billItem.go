package entity

import "gorm.io/gorm"

type BillItem struct {
    gorm.Model
    ID       uint    `json:"id"`
    ItemType string  `json:"item_type" gorm:"type:varchar(100);not null"`
    Amount   float64 `json:"amount" gorm:"type:decimal(10,2)"`

    BillingID uint `json:"bill_id"`
    Billing   Billing  `gorm:"foreignKey:BillingID"`
}
