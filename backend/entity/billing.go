package entity

import (
	"time"
	"gorm.io/gorm"
)

type Billing struct {
	gorm.Model
	
	ID           uint       `json:"id"`
	BillingDate time.Time `json:"Billing_date"`
	AmountDue		float64		`json:"amount_due" gorm:"type:decimal(10,2)"`
	DueDate			time.Time	`json:"due_date" `
	Status			*string		`json:"status"`

	// Foreign key → Student
	StudentID uint    `json:"student_id"`
	// Student   Student `gorm:"foreignKey:StudentID" json:"student"`

	// FK → Contract
	ContractID uint     `json:"contract_id"`

	BillItem []BillItem `gorm:"foreignKey:BillingID"`

	Payment []Payment `gorm:"foreignKey:BillingID"`
	
	RoomID uint
	Room   Room `gorm:"foreignKey:RoomID" json:"room"`
}
