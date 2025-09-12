// entity/meter_record.go
package entity

import (
	"time"
	"gorm.io/gorm"
)

// บันทึกมิเตอร์รายงวด (แนะนำให้ใช้ PeriodStart = วันแรกของเดือนเป็นคีย์ร่วม)
type MeterRecord struct {
    gorm.Model
    RecordDate  time.Time `json:"record_date" gorm:"not null"`
    PeriodStart time.Time `json:"period_start" gorm:"index;not null"`

    OldValue    float64 `json:"old_value"`
    NewValue    float64 `json:"new_value"`
    UnitUsed    float64 `json:"unit_used"`
    TotalAmount float64 `json:"total_amount"`

    MeterTypeID    *uint     `json:"meter_type_id" gorm:"index"`
    MeterType      MeterType `json:"meter_type" gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`

    // 🔧 เปลี่ยนชื่อ FK ให้ตรงกับ field relation
    RatePerUnitID  *uint       `json:"rate_per_unit_id" gorm:"index"`
    RatePerUnit    RatePerUnit `json:"rate_per_unit" gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`

    RoomID   *uint `json:"room_id" gorm:"index"`
    Room     Room  `json:"room" gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`

    StudentID *uint   `json:"student_id" gorm:"index"`
    Student   Student `json:"student" gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`
}

// แนะนำให้สร้าง unique index ป้องกันซ้ำในหนึ่งงวด:
//   CREATE UNIQUE INDEX idx_mr_room_type_period ON meter_records(room_id, meter_type_id, period_start);
