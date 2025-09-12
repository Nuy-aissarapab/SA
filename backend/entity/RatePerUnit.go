package entity

import (
	"time"
	"gorm.io/gorm"
)

type RatePerUnit struct {
	gorm.Model
	PricePerUnit  	float64   `json:"price_per_unit" gorm:"type:decimal(10,2)"`
	StartDate 		time.Time `json:"start_date"`
	EndDate       	time.Time `json:"end_date"`

	MeterRecord []MeterRecord `gorm:"foreignKey:RateID"`
	MeterTypeID *uint
	MeterType   MeterType `gorm:"foreignKey:MeterTypeID"`
}