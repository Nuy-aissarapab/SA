package entity

import (
	"time"

	"gorm.io/gorm"
)

// entity/contract.go
type Contract struct {
	gorm.Model
	Start_Date time.Time `json:"start_date"`
	End_Date   time.Time `json:"end_date"`
	Rate       float64   `json:"rate" gorm:"type:decimal(10,2)"`
	RenewalPending   bool       `json:"renewal_pending" gorm:"default:false"`
	RenewalMonths    *int       `json:"renewal_months"`
	RenewalStartDate *time.Time `json:"renewal_start_date"`
	RenewalEndDate   *time.Time `json:"renewal_end_date"`
	RenewalRate      *float64   `json:"renewal_rate"`
	RenewalStatus    *string    `json:"renewal_status"` // "pending" | "approved" | "rejected"

	RoomID *uint `json:"Room_ID"`
	Room    Room    // ความสัมพันธ์ย้อนกลับ

	Admin_ID *uint
	Admin    Admin `gorm:"foreignKey:Admin_ID"`

	StudentID *uint
	Student   *Student `gorm:"foreignKey:StudentID"`
	
	PaymentID *uint
	Payment   *Payment `gorm:"foreignKey:PaymentID"`


}
