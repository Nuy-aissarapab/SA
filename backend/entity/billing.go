package entity

import (
	"time"
	"gorm.io/gorm"
)

type Billing struct {
	gorm.Model
	Billing_date time.Time `json:"Billing_date"`
	Invoice      time.Time `json:"invoice"`
	Due_Date     time.Time `json:"due_Date"`
	Status       *string `json:"status"` // ✅ ต้องเป็น pointer
	AmountDue    float64  `json:"amount_due" gorm:"type:decimal(10,2)"` // ✅ ยอดที่ต้องชำระ

	// Foreign key → Student
	StudentID uint    `json:"student_id"`
	Student   Student `gorm:"foreignKey:StudentID" json:"student"`

	// 1 Billing มีได้หลาย Payment
	Payment []Payment `gorm:"foreignKey:BillingID" json:"payment"`

	// FK → Contract
	ContractID uint     `json:"contract_id"`
	Contract   Contract `gorm:"foreignKey:ContractID" json:"contract"`
}
