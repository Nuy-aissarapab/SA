package config

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"

	"github.com/SA/entity"

	"gorm.io/driver/sqlite"

	"gorm.io/gorm"

	"time"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {
	database, err := gorm.Open(sqlite.Open("sa.db?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	fmt.Println("connected database")
	db = database
}

func SetupDatabase() {
	// Migrate the schema
	db.AutoMigrate(
		&entity.Admin{},
		&entity.Billing{},
		&entity.Payment{},
		&entity.Contract{},
		&entity.Room{},
		&entity.Student{},
		&entity.Evidence{},
		&entity.ReviewTopic{},
		&entity.Review{},
		&entity.MaintenanceStatus{},
		&entity.ProblemType{},
		&entity.Maintenance{},
		&entity.AnnouncementTarget{},
		&entity.AnnouncementType{},
		&entity.Announcement{},
	)

	password, _ := bcrypt.GenerateFromPassword([]byte("123456"), 14)

	// Admin Base
	Admin := entity.Admin{
		First_Name: "แอดมิน",
		Last_Name: "เองนะ",
		Username: "admin",
		Password: string(password),
		Email:    "admin@gmail.com",
	}
	db.Create(&Admin)

	r1 := uint(1)
	r2 := uint(2)
	r3 := uint(3)
	
	// Student Base
	student := entity.Student{
		Username:   "SA",
		Password:   string(password),
		Email:      "sa@gmail.com",
		First_Name: "เจษฎา",
		Last_Name:  "เชือดขุนทด",
		Room_ID:  &r1,
	}
	db.Create(&student)

	db.Model(&entity.Student{}).Create(&entity.Student{
		Username:   "SA1",
		Password:   string(password),
		Email:      "sa1@gmail.com",
		First_Name: "สมชาติ",
		Last_Name:  "เชือดขุนทด",
		Room_ID:  &r2,
	})
	db.Model(&entity.Student{}).Create(&entity.Student{
		Username:   "SA2",
		Password:   string(password),
		Email:      "sa2@gmail.com",
		First_Name: "อิสรภาพ",
		Last_Name:  "วาตุรัมย์",
		Room_ID:  &r3,
	})

	//Payment
	db.Create(&entity.Payment{
		StudentID:      1,
		BillingID:      1,
		ReceiverID:     UPtr(1),            // ✅ ผู้รับเงิน admin id = 1
		Amount:         2900,
		Payment_Date:   time.Now(),
		Payment_Status: StrPtr("paid"),     // หรือ pending
		Method:         "-",
		PayerName:      "ผู้ปกครอง A",
	})
	
	db.Create(&entity.Payment{
		StudentID:      2,
		BillingID:      2,
		ReceiverID:     UPtr(1),            // ✅ ผู้รับเงิน admin id = 1
		Amount:         2900,
		Payment_Date:   time.Now(),
		Payment_Status: StrPtr("paid"),     // หรือ pending
		Method:         "-",
		PayerName:      "ผู้ปกครอง A",
	})
	
	db.Create(&entity.Payment{
		StudentID:      3,
		BillingID:      3,
		ReceiverID:     UPtr(1),            // ✅ ผู้รับเงิน admin id = 1
		Amount:         2900,
		Payment_Date:   time.Now(),
		Payment_Status: StrPtr("paid"),     // หรือ pending
		Method:         "-",
		PayerName:      "ผู้ปกครอง A",
	})

	// สร้าง Contract ใหม่
	startDate, _ := time.Parse("2006-01-02", "2025-08-01")
	endDate, _ := time.Parse("2006-01-02", "2026-07-31")

	s1 := uint(1)
	s2 := uint(2)
	s3 := uint(3)
	db.Model(&entity.Contract{}).Create(&entity.Contract{
		Start_Date: startDate,
		End_Date:   endDate,
		Rate:       2900.00,
		StudentID:  &s1,
	})

	db.Model(&entity.Contract{}).Create(&entity.Contract{
		Start_Date: startDate,
		End_Date:   endDate,
		Rate:       2900.00,
		StudentID:  &s2,
	})

	db.Model(&entity.Contract{}).Create(&entity.Contract{
		Start_Date: startDate,
		End_Date:   endDate,
		Rate:       2900.00,
		StudentID:  &s3,
	})

	db.Model(&entity.Room{}).Create(&entity.Room{
		Rental_Price: 2900.00,
		Room_Status:  "ว่าง",
		Floor:        2,
	})

	db.Model(&entity.Room{}).Create(&entity.Room{
		Rental_Price: 2900.00,
		Room_Status:  "ว่าง",
		Floor:        2,
	})

	db.Model(&entity.Room{}).Create(&entity.Room{
		Rental_Price: 2900.00,
		Room_Status:  "ว่าง",
		Floor:        2,
	})

	// ✅ Seed Room
	RoomNumber := []string{"101", "102", "103", "104", "105", "201", "202", "203", "204", "205"}
	for _, name := range RoomNumber {
    db.FirstOrCreate(&entity.Room{}, entity.Room{RoomNumber: name})
	}

	// ✅ Seed ProblemType (ComboBox) and MaintenanceStatus (ComboBox)
	problemTypes := []string{"ไฟฟ้า", "ประปา", "เฟอร์นิเจอร์", "อื่นๆ"}
	for _, name := range problemTypes {
    db.FirstOrCreate(&entity.ProblemType{}, entity.ProblemType{TypeName: name})
	}

	statuses := []string{"แจ้งซ่อม", "กำลังดำเนินการ", "เสร็จสิ้น"}
	for _, name := range statuses {
    db.FirstOrCreate(&entity.MaintenanceStatus{}, entity.MaintenanceStatus{StatusName: name})
	}

	// ✅ Seed ReviewTopic (ComboBox)
	db.FirstOrCreate(&entity.ReviewTopic{}, entity.ReviewTopic{TopicName: "ความสะอาด"})
	db.FirstOrCreate(&entity.ReviewTopic{}, entity.ReviewTopic{TopicName: "ความปลอดภัย"})
	db.FirstOrCreate(&entity.ReviewTopic{}, entity.ReviewTopic{TopicName: "เสียงรบกวน"})
	db.FirstOrCreate(&entity.ReviewTopic{}, entity.ReviewTopic{TopicName: "อื่นๆ"})

	
	// Target (เช่น ทั้งหอ, เฉพาะนักศึกษา, เฉพาะชั้น 2)
	db.FirstOrCreate(&entity.AnnouncementTarget{}, entity.AnnouncementTarget{Name: "นักศึกษาทุกคน"})
	db.FirstOrCreate(&entity.AnnouncementTarget{}, entity.AnnouncementTarget{Name: "นักศึกษาที่ยังไม่ชำระเงิน"})
	db.FirstOrCreate(&entity.AnnouncementTarget{}, entity.AnnouncementTarget{Name: "นักศึกษาที่ต้องการแจ้งซ่อม"})
	db.FirstOrCreate(&entity.AnnouncementTarget{}, entity.AnnouncementTarget{Name: "นักศึกษาที่ต้องการต่อสัญญาเช่า"})

	// Type (เช่น ทั่วไป, ด่วน, แจ้งซ่อม)
	db.FirstOrCreate(&entity.AnnouncementType{}, entity.AnnouncementType{Name: "ปรับปรุงระบบ"})
	db.FirstOrCreate(&entity.AnnouncementType{}, entity.AnnouncementType{Name: "ซ่อมแซ่มหอพัก"})
	db.FirstOrCreate(&entity.AnnouncementType{}, entity.AnnouncementType{Name: "ค่าใช้จ่าย"})

}
