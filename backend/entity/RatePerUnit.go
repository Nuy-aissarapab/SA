// entity/rate_per_unit.go
package entity

import (
	"time"
	"gorm.io/gorm"
)

// อัตราต่อหน่วยของมิเตอร์แต่ละประเภท (เผื่ออนาคตมีช่วงเวลา)
type RatePerUnit struct {
    gorm.Model
    PricePerUnit float64    `json:"price_per_unit" gorm:"not null"`
    StartDate    *time.Time `json:"start_date"`
    EndDate      *time.Time `json:"end_date"`

    MeterTypeID  uint      `json:"meter_type_id" gorm:"index;not null"`
    MeterType    MeterType `json:"meter_type" gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`

    // 🔧 ให้ back-ref ใช้ foreignKey:RatePerUnitID (ที่เราพึ่งสร้างด้านบน)
    Records []MeterRecord `json:"records" gorm:"foreignKey:RatePerUnitID"`
}
