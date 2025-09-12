// entity/billing.go
package entity

import (
	"time"
	"gorm.io/gorm"
)

type Billing struct {
	gorm.Model

	// แนะนำให้ใช้ PeriodStart เป็นคีย์งวดของบิล (วันแรกของเดือน)
	BillingDate time.Time `json:"billing_date" gorm:"not null"` // วันที่ออกบิล
	PeriodStart time.Time `json:"period_start" gorm:"index;not null"`

	AmountDue float64   `json:"amount_due"`
	DueDate   time.Time `json:"due_date"`
	Status    *string   `json:"status"`

	// ความสัมพันธ์
	StudentID  uint    `json:"student_id"  gorm:"index"`
	// Student   Student  `json:"student"     gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`

	ContractID *uint    `json:"contract_id" gorm:"index"`
	// Contract  Contract `json:"contract"    gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`

	RoomID uint `json:"room_id" gorm:"index;not null"`
	Room   Room `json:"room"    gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`

	BillItems []BillItem `json:"bill_items" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	Payments  []Payment  `json:"payments"   gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
}

// แนะนำ unique index ป้องกัน “ห้องหนึ่งมีหนึ่งบิลต่อหนึ่งงวด”:
//   CREATE UNIQUE INDEX idx_billing_room_period ON billings(room_id, period_start);
