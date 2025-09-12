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
		&entity.RoomType{},
		&entity.AssetType{},
		&entity.RoomAsset{},
	)

	password, _ := bcrypt.GenerateFromPassword([]byte("123456"), 14)

	// Admin Base
	Admin := entity.Admin{
		First_Name: "แอดมิน",
		Last_Name:  "เองนะ",
		Username:   "admin",
		Password:   string(password),
		Email:      "admin@gmail.com",
		Birthday:   time.Date(2004, 12, 16, 0, 0, 0, 0, time.UTC),
		Phone:      "08130512752",
	}
	db.Create(&Admin)

	r1 := uint(1)
	r2 := uint(2)
	r3 := uint(3)

	// Student Base
	student := entity.Student{
		Username:     "SA",
		Password:     string(password),
		Email:        "sa@gmail.com",
		First_Name:   "ณัฐวุฒิ",
		Last_Name:    "พรมจันทร์",
		Birthday:     time.Date(2002, 12, 3, 0, 0, 0, 0, time.UTC),
		Phone:        "0811112233",
		Parent_Phone: "0899998877",
		Parent_Name:  "ประเสริฐ พรมจันทร์",
		Major:        "วิศวกรรมคอมพิวเตอร์",
		Address:      "45/6 ต.หนองจะบก อ.เมือง จ.นครราชสีมา 30000",
		Room_ID:      &r1,
	}
	db.Create(&student)

	db.Model(&entity.Student{}).Create(&entity.Student{
		Username:     "SA1",
		Password:     string(password),
		Email:        "sa1@gmail.com",
		First_Name:   "วิชญ์",
		Last_Name:    "อินทรโชติ",
		Birthday:     time.Date(2003, 4, 21, 0, 0, 0, 0, time.UTC),
		Phone:        "0823456789",
		Parent_Phone: "0812349876",
		Parent_Name:  "สมหมาย อินทรโชติ",
		Major:        "เทคโนโลยีสารสนเทศ",
		Address:      "88/9 ถ.สุรนารายณ์ ต.ในเมือง อ.เมือง จ.นครราชสีมา",
		Room_ID:      &r2,
	})
	db.Model(&entity.Student{}).Create(&entity.Student{
		Username:     "SA2",
		Password:     string(password),
		Email:        "sa2@gmail.com",
		First_Name:   "พิมพ์ชนก",
		Last_Name:    "บุญมาก",
		Birthday:     time.Date(2004, 1, 17, 0, 0, 0, 0, time.UTC),
		Phone:        "0865432198",
		Parent_Phone: "0856789123",
		Parent_Name:  "อำไพ บุญมาก",
		Major:        "วิทยาการข้อมูล",
		Address:      "129 หมู่ 7 ต.โคกกรวด อ.เมือง จ.นครราชสีมา",
		Room_ID:      &r3,
	})
	db.Model(&entity.Student{}).Create(&entity.Student{
		Username:     "SA3",
		Password:     string(password),
		Email:        "sa3@gmail.com",
		First_Name:   "ศรัณย์",
		Last_Name:    "อุดมสุข",
		Birthday:     time.Date(2002, 9, 9, 0, 0, 0, 0, time.UTC),
		Phone:        "0832224455",
		Parent_Phone: "0891234560",
		Parent_Name:  "มยุรี อุดมสุข",
		Major:        "วิศวกรรมซอฟต์แวร์",
		Address:      "12/3 ต.หนองบัวศาลา อ.เมือง จ.นครราชสีมา",
	})
	db.Model(&entity.Student{}).Create(&entity.Student{
		Username:     "SA4",
		Password:     string(password),
		Email:        "sa4@gmail.com",
		First_Name:   "กฤษณะ",
		Last_Name:    "สีทอง",
		Birthday:     time.Date(2003, 6, 28, 0, 0, 0, 0, time.UTC),
		Phone:        "0845556677",
		Parent_Phone: "0823331122",
		Parent_Name:  "บุญส่ง สีทอง",
		Major:        "ระบบสารสนเทศทางธุรกิจ",
		Address:      "56/78 ถ.มิตรภาพ ต.บ้านเกาะ อ.เมือง จ.นครราชสีมา",
	})
		//RoomType
	db.Create(&entity.RoomType{
		RoomTypeName:    "Air Room",
		RentalPrice: 2900.00,
	})
	db.Create(&entity.RoomType{
		RoomTypeName:    "Fan Room",
		RentalPrice: 2500.00,
	})
	//Room
// ✅ Seed Room (เพิ่ม RoomTypeID ให้ทุกห้อง)
rooms := []entity.Room{
    {RoomNumber: "100", Status: "ว่าง", Image: "room1.jpg", RoomTypeID: 1, AdminID: 1},
    {RoomNumber: "101", Status: "ไม่ว่าง", Image: "room2.jpg", RoomTypeID: 1, StudentID: &r1, AdminID: 1},
    {RoomNumber: "102", Status: "ไม่ว่าง", Image: "room3.jpg", RoomTypeID: 1, StudentID: &r2, AdminID: 1},
    {RoomNumber: "103", Status: "ว่าง", Image: "room4.jpg", RoomTypeID: 2, AdminID: 1},
    {RoomNumber: "104", Status: "ว่าง", Image: "room5.jpg", RoomTypeID: 2, AdminID: 1},
    {RoomNumber: "105", Status: "ว่าง", Image: "room6.jpg", RoomTypeID: 2, AdminID: 1},
    {RoomNumber: "201", Status: "ว่าง", Image: "room7.jpg", RoomTypeID: 1, AdminID: 1},
    {RoomNumber: "202", Status: "ว่าง", Image: "room8.jpg", RoomTypeID: 1, AdminID: 1},
    {RoomNumber: "203", Status: "ว่าง", Image: "room9.jpg", RoomTypeID: 2, AdminID: 1},
    {RoomNumber: "204", Status: "ว่าง", Image: "room10.jpg", RoomTypeID: 2, AdminID: 1},
    {RoomNumber: "205", Status: "ว่าง", Image: "room11.jpg", RoomTypeID: 1, AdminID: 1},
}

for _, r := range rooms {
    db.FirstOrCreate(&entity.Room{}, r)
}

		//AssetType
	db.Create(&entity.AssetType{
		Name: "เตียง",
		Type: "เฟอร์นิเจอร์",
		PenaltyFee: 500.00,
		Date: time.Now(),
	})
	db.Create(&entity.AssetType{
		Name: "Wi-Fi",
		Type: "สิ่งอำนวยความสะดวก",
		PenaltyFee: 1000.00,
		Date: time.Now(),
	})
	//RoomAsset
	now := time.Now()
	db.Create(&entity.RoomAsset{
		Quantity:    1,


		
		CheckDate:   &now,
		RoomNumber:  "101",
		AssetTypeID: 1,
	})
	db.Create(&entity.RoomAsset{
		Quantity:    1,

		
		CheckDate:   &now,
		RoomNumber:  "102",
		AssetTypeID: 1,
	})
	db.Create(&entity.RoomAsset{
		Quantity:    1,

		
		CheckDate:   &now,
		RoomNumber:  "103",
		AssetTypeID: 2,
	})
	


	db.Create(&entity.Payment{
		StudentID:    2,
		BillingID:    2,
		ContractID:   2,
		EvidenceID:   2,
		ReceiverID:   UPtr(1),
		Amount:       2900,
		Payment_Date: time.Now(),
		Method:       "-",
		PayerName:    "ผู้ปกครอง A",
	})

	db.Create(&entity.Payment{
		StudentID:    3,
		BillingID:    3,
		ContractID:   3,
		EvidenceID:   3,
		ReceiverID:   UPtr(1),
		Amount:       2900,
		Payment_Date: time.Now(),
		Method:       "-",
		PayerName:    "ผู้ปกครอง A",
	})

	// สร้าง Contract ใหม่
	startDate, _ := time.Parse("2006-01-02", "2025-01-01")
	endDate, _ := time.Parse("2006-01-02", "2026-04-01")

	s1 := uint(1)
	s2 := uint(2)
	s3 := uint(3)
	db.Model(&entity.Contract{}).Create(&entity.Contract{
		Start_Date: startDate,
		End_Date:   endDate,
		Rate:       2900.00,
		StudentID:  &s1,
		RoomID:     &s1,
		Admin_ID:   &s1,
	})

	db.Model(&entity.Contract{}).Create(&entity.Contract{
		Start_Date: startDate,
		End_Date:   endDate,
		Rate:       2900.00,
		StudentID:  &s2,
		RoomID:     &s2,
		Admin_ID:   &s1,
	})

	db.Model(&entity.Contract{}).Create(&entity.Contract{
		Start_Date: startDate,
		End_Date:   endDate,
		Rate:       2900.00,
		StudentID:  &s3,
		RoomID:     &s2,
		Admin_ID:   &s1,
	})

	// // ✅ Seed Room
	// RoomNumber := []string{"101", "102", "103", "104", "105", "201", "202", "203", "204", "205"}
	// for _, name := range RoomNumber {
	// 	db.FirstOrCreate(&entity.Room{}, entity.Room{RoomNumber: name})
	// }

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

	// ===== Seed Announcements (หลังจาก Seed Target / Type แล้ว) =====

	// ดึง Admin ที่เพิ่งสร้างมาใช้เป็นผู้ประกาศ
	var admin entity.Admin
	if err := db.First(&admin, "email = ?", "admin@gmail.com").Error; err != nil {
		panic("admin seed missing: " + err.Error())
	}

	// ดึง Target ที่ต้องใช้
	var targetAll, targetUnpaid, targetRepair, targetRenew entity.AnnouncementTarget
	db.First(&targetAll, "name = ?", "นักศึกษาทุกคน")
	db.First(&targetUnpaid, "name = ?", "นักศึกษาที่ยังไม่ชำระเงิน")
	db.First(&targetRepair, "name = ?", "นักศึกษาที่ต้องการแจ้งซ่อม")
	db.First(&targetRenew, "name = ?", "นักศึกษาที่ต้องการต่อสัญญาเช่า")

	// ดึง Type ที่ต้องใช้
	var typeSystem, typeMaintenance, typeFee entity.AnnouncementType
	db.First(&typeSystem, "name = ?", "ปรับปรุงระบบ")
	db.First(&typeMaintenance, "name = ?", "ซ่อมแซ่มหอพัก")
	db.First(&typeFee, "name = ?", "ค่าใช้จ่าย")

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
