package entity

import (
	"gorm.io/gorm"
)

type MaintenanceStatus struct {
	gorm.Model
	StatusName string `gorm:"unique" json:"status_name"`
}