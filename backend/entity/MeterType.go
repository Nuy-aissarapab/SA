package entity

import "gorm.io/gorm"

type MeterType struct {
	gorm.Model
	ID           uint       `json:"id"`
	MeterName 	string  	`json:"meter_name"`

	RatePerUnit []RatePerUnit `gorm:"foreignKey:MeterTypeID"`
	MeterRecord []MeterRecord `gorm:"foreignKey:MeterTypeID"`
}