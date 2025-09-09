package config

import (
	"golang.org/x/crypto/bcrypt"
	"log"
	"time"
)

// ค่า cost ที่เหมาะสม (10-12 แทน 14)
const BCRYPT_COST = 12

// HashPassword เป็น function สำหรับการแปลง password
func HashPassword(password string) (string, error) {
	start := time.Now()
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), BCRYPT_COST)
	log.Printf("Password hashing took: %v", time.Since(start))
   return string(bytes), err
}

// CheckPasswordHash เป็น function สำหรับ check password ที่ hash แล้ว ว่าตรงกันหรือไม่
// พารามิเตอร์: password = รหัสผ่านธรรมดา, hash = รหัสผ่านที่ hash แล้ว
func CheckPasswordHash(password, hash string) bool {
	start := time.Now()
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	log.Printf("Password comparison took: %v", time.Since(start))
   return err == nil
}

// ฟังก์ชันเพิ่มเติมสำหรับ debug
func GetPasswordCost(hashedPassword string) (int, error) {
	cost, err := bcrypt.Cost([]byte(hashedPassword))
	return cost, err
}