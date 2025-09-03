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
	db.AutoMigrate(&entity.Billing{},
		&entity.Payment{},
		&entity.Contract{},
		&entity.Room{},
		&entity.Admin{},
		&entity.Student{},
		&entity.Evidence{},
		&entity.ReviewTopic{},
		&entity.Review{},
		&entity.AnnouncementTarget{},
		&entity.AnnouncementType{},
		&entity.Announcement{},
	)

	password, _ := bcrypt.GenerateFromPassword([]byte("123456"), 14)

	// Admin Base
	Admin := entity.Admin{
		Username: "admin",
		Password: string(password),
		Email:    "admin@gmail.com",
		First_Name: "สิษฐ์สโรจ",
		Last_Name:  "กันทรสุรพล",
		Birthday:   time.Date(2004, 12, 16, 0, 0, 0, 0, time.UTC),
		Phone:        "08130512752",
	}
	db.Create(&Admin)

	// Student Base
	student := entity.Student{
		Username:   "SA",
		Password:   string(password),
		Email:      "sa@gmail.com",
		First_Name: "เจษฎา",
		Last_Name:  "เชือดขุนทด",
		Birthday:   time.Date(2003, 7, 15, 0, 0, 0, 0, time.UTC),
		Phone:        "0812345678",
		Parent_Phone: "0898765432",
		Parent_Name:  "สมชาย เชือดขุนทด",
		Major:        "วิทยาการคอมพิวเตอร์",
		Address:      "123 หมู่ 4 ต.บ้านใหม่ อ.เมือง จ.นครราชสีมา 30000",
	}
	db.Create(&student)

	db.Model(&entity.Student{}).Create(&entity.Student{
		Username:   "SA1",
		Password:   string(password),
		Email:      "sa1@gmail.com",
		First_Name: "สมชาติ",
		Last_Name:  "เชือดขุนทด",
	})
	db.Model(&entity.Student{}).Create(&entity.Student{
		Username:   "SA2",
		Password:   string(password),
		Email:      "sa2@gmail.com",
		First_Name: "รชต",
		Last_Name:  "สวุขใจ",
	})

	//Payment
	db.Model(&entity.Payment{}).Create(&entity.Payment{
		StudentID:      1,
		Payment_Date:   time.Now(),
		Amount:         2900.00,
		Payment_Status: "ยังไม่ได้ชำระ",
	})
	db.Model(&entity.Payment{}).Create(&entity.Payment{
		StudentID:      2,
		Payment_Date:   time.Now(),
		Amount:         2900.00,
		Payment_Status: "ยังไม่ได้ชำระ",
	})
	db.Model(&entity.Payment{}).Create(&entity.Payment{
		StudentID:      3,
		Payment_Date:   time.Now(),
		Amount:         2900.00,
		Payment_Status: "ยังไม่ได้ชำระ",
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

	// ✅ Seed ReviewTopic (ComboBox)
	db.FirstOrCreate(&entity.ReviewTopic{}, entity.ReviewTopic{TopicName: "ความสะอาด"})
	db.FirstOrCreate(&entity.ReviewTopic{}, entity.ReviewTopic{TopicName: "ความปลอดภัย"})
	db.FirstOrCreate(&entity.ReviewTopic{}, entity.ReviewTopic{TopicName: "เสียงรบกวน"})
	db.FirstOrCreate(&entity.ReviewTopic{}, entity.ReviewTopic{TopicName: "อื่นๆ"})

	// // วันที่ตัวอย่าง
	// date1, _ := time.Parse("2006-01-02", "2025-01-01")
	// date2, _ := time.Parse("2006-01-02", "2025-02-01")
	// date3, _ := time.Parse("2006-01-02", "2025-03-01")

	// // สร้าง 3 รีวิว
	// r1 := uint(1)
	// r2 := uint(2)
	// r3 := uint(3)

	// db.Create(&entity.Review{
	// 	StudentID:     &r1,
	//    ReviewTopicID:     &r1,
	// 	ReviewDate:    date1,
	// 	Title:         "รีวิวความสะอาด 1",
	// 	Comment:       "ดีมาก",
	// 	Rating:        5,

	// })

	// db.Create(&entity.Review{
	// 	StudentID:     &r2,
	//    ReviewTopicID:     &r2,
	// 	ReviewDate:    date2,
	// 	Title:         "รีวิวความสะอาด 2",
	// 	Comment:       "โอเค",
	// 	Rating:        4,
	// })

	// db.Create(&entity.Review{
	// 	StudentID:     &r3,
	//    ReviewTopicID:     &r3,
	// 	ReviewDate:    date3,
	// 	Title:         "รีวิวความสะอาด 3",
	// 	Comment:       "พอใช้ได้",
	// 	Rating:        3,
	// })
	// Target (เช่น ทั้งหอ, เฉพาะนักศึกษา, เฉพาะชั้น 2)
	db.FirstOrCreate(&entity.AnnouncementTarget{}, entity.AnnouncementTarget{Name: "นักศึกษาทุกคน"})
	db.FirstOrCreate(&entity.AnnouncementTarget{}, entity.AnnouncementTarget{Name: "นักศึกษาที่ยังไม่ชำระเงิน"})
	db.FirstOrCreate(&entity.AnnouncementTarget{}, entity.AnnouncementTarget{Name: "นักศึกษาที่ต้องการแจ้งซ่อม"})
	db.FirstOrCreate(&entity.AnnouncementTarget{}, entity.AnnouncementTarget{Name: "นักศึกษาที่ต้องการต่อสัญญาเช่า"})

	// Type (เช่น ทั่วไป, ด่วน, แจ้งซ่อม)
	db.FirstOrCreate(&entity.AnnouncementType{}, entity.AnnouncementType{Name: "ปรับปรุงระบบ"})
	db.FirstOrCreate(&entity.AnnouncementType{}, entity.AnnouncementType{Name: "ซ่อมแซ่มหอพัก"})
	db.FirstOrCreate(&entity.AnnouncementType{}, entity.AnnouncementType{Name: "ค่าใช้จ่าย"})

	// ===== Seed Announcements (หลังจาก Seed Target / Type แล้ว) =====

// ดึง Admin ที่เพิ่งสร้างมาใช้เป็นผู้ประกาศ
var admin entity.Admin
if err := db.First(&admin, "email = ?", "admin@gmail.com").Error; err != nil {
    panic("admin seed missing: " + err.Error())
}

// ดึง Target ที่ต้องใช้
var targetAll, targetUnpaid, targetRepair, targetRenew entity.AnnouncementTarget
db.First(&targetAll,   "name = ?", "นักศึกษาทุกคน")
db.First(&targetUnpaid,"name = ?", "นักศึกษาที่ยังไม่ชำระเงิน")
db.First(&targetRepair,"name = ?", "นักศึกษาที่ต้องการแจ้งซ่อม")
db.First(&targetRenew, "name = ?", "นักศึกษาที่ต้องการต่อสัญญาเช่า")

// ดึง Type ที่ต้องใช้
var typeSystem, typeMaintenance, typeFee entity.AnnouncementType
db.First(&typeSystem,     "name = ?", "ปรับปรุงระบบ")
db.First(&typeMaintenance,"name = ?", "ซ่อมแซ่มหอพัก")
db.First(&typeFee,        "name = ?", "ค่าใช้จ่าย")

// Helper: FirstOrCreate ด้วย title ไม่ให้ซ้ำ
seedAnnouncement := func(title, content, picture string, targetID, typeID uint) {
    var a entity.Announcement
    _ = db.
        Where(&entity.Announcement{Title: title}). // << ใช้ struct
        Attrs(entity.Announcement{
            Content:              content,
            Picture:              picture,
            AdminID:              admin.ID,
            AnnouncementTargetID: targetID,
            AnnouncementTypeID:   typeID,
        }).
        FirstOrCreate(&a)
}


// ตัวอย่างประกาศพื้นฐาน
seedAnnouncement(
    "ประกาศปิดปรับปรุงระบบ 3 ก.ย.",
    "ระบบจะปิดปรับปรุงระหว่างเวลา 22:00 - 02:00 เพื่ออัปเดตเวอร์ชันใหม่ โปรดวางแผนการใช้งานล่วงหน้า",
    "https://scontent-bkk1-2.xx.fbcdn.net/v/t39.30808-6/542711775_1281624446845366_8433981477510126776_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=CvnD3swNXNUQ7kNvwE083ln&_nc_oc=AdnAMXwpTVtVEgVv08niZs1IicgyOnBz2v6DV6Y7qSdpOthHj1fDBEEvxubIrHbqYkE&_nc_zt=23&_nc_ht=scontent-bkk1-2.xx&_nc_gid=EyILN72RssREW_B4sHBZDw&oh=00_AfWdL0FKqnP5epJRRvXY1wRV0DQrbQXUyHUDKTo2jPTrOw&oe=68BCCBC1",
    targetAll.ID, typeSystem.ID,
)

seedAnnouncement(
    "แจ้งซ่อมบำรุงท่อชั้น 2",
    "พรุ่งนี้ 09:00-12:00 ช่างจะเข้าซ่อมท่อชั้น 2 อาจมีเสียงดังและน้ำไหลช้า ขออภัยในความไม่สะดวก",
    "https://picsum.photos/seed/maintenance/800/400",
    targetRepair.ID, typeMaintenance.ID,
)

seedAnnouncement(
    "ชำระค่าเช่าเดือนนี้ภายในวันที่ 5",
    "กรุณาชำระค่าเช่า 2,900 บาท ภายในวันที่ 5 ของทุกเดือน หากเกินกำหนดจะมีค่าปรับตามระเบียบ",
    "https://picsum.photos/seed/fee/800/400",
    targetUnpaid.ID, typeFee.ID,
)

seedAnnouncement(
    "ต่อสัญญาเช่าประจำปี",
    "นักศึกษาที่ต้องการต่อสัญญาเช่ากรุณายื่นเรื่องภายในวันที่ 30 กันยายน ที่สำนักงานหอพัก",
    "https://picsum.photos/seed/renew/800/400",
    targetRenew.ID, typeFee.ID,
)
}