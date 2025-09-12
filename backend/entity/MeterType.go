// entity/meter_type.go
package entity

import "gorm.io/gorm"

type MeterType struct {
	gorm.Model
	MeterName   string        `json:"meter_name" gorm:"uniqueIndex;not null"`
	Rates       []RatePerUnit `json:"rates"       gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	Records     []MeterRecord `json:"records"     gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
}
