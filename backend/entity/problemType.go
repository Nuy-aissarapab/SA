package entity

import (
	"gorm.io/gorm"
)
type ProblemType struct {
	gorm.Model
	TypeName string `gorm:"unique" json:"type_name"`
}