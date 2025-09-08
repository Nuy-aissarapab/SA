package entity

import (
	"time"
	"gorm.io/gorm"
)

type Payment struct {
    gorm.Model
    Payment_Date   time.Time `json:"payment_date"`
    Amount         float64   `json:"amount" gorm:"type:decimal(10,2)"`
    Payment_Status *string   `json:"payment_status"`
    Method         string    `json:"method"`
    PayerName     string `json:"payer_name"`
    ReceiptNumber string `json:"receipt_number"` // ← ยังมีได้ แต่จะถูกเซ็ตจาก BillingID
    EvidenceURL   string `json:"evidence_url"`

    ReceiverID *uint `json:"receiver_id"`
    Receiver   Admin `gorm:"foreignKey:ReceiverID" json:"receiver"`

    StudentID uint    `json:"student_id"`
    Student   Student `gorm:"foreignKey:StudentID" json:"student"`

    BillingID uint    `json:"billing_id"`
    Billing   Billing `gorm:"foreignKey:BillingID" json:"billing"`

    EvidenceID uint    `json:"evidence_id"`
    Evidence   Evidence `gorm:"foreignKey:BillingID" json:"evidence"`

    ContractID uint `json:"contract_id"`
    // Contract   Contract `gorm:"foreignKey:ContractID" json:"contract"`

}
