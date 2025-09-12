package config

import (
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/SA/entity"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
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
	// === AutoMigrate ===
	if err := db.AutoMigrate(
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
	); err != nil {
		panic(err)
	}
		
	// ใช้ Transaction เพื่อความถูกต้องครบชุด
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// === Seed base password ===
	password, _ := bcrypt.GenerateFromPassword([]byte("123456"), 14)

	// ===== Admin (ระบุเอกลักษณ์ด้วย Email) =====
	adminSeed := entity.Admin{
		First_Name: "แอดมิน",
		Last_Name:  "เองนะ",
		Username:   "admin",
		Password:   string(password),
		Email:      "admin@gmail.com", // ใช้เป็น unique key
		Birthday:   time.Date(2004, 12, 16, 0, 0, 0, 0, time.UTC),
		Phone:      "08130512752",
	}
	{
		var a entity.Admin
		if err := tx.
			Where(&entity.Admin{Email: adminSeed.Email}).
			Attrs(adminSeed).
			FirstOrCreate(&a).Error; err != nil {
			tx.Rollback()
			panic(err)
		}
	}


	// ===== Student (เอกลักษณ์ด้วย Email) =====
	r1, r2, r3 := uint(1), uint(2), uint(3)
	students := []entity.Student{
		{
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
		},
		{
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
		},
		{
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
		},
		{
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
		},
		{
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
		},
	}
	for i := range students {
		s := students[i]
		var got entity.Student
		if err := tx.
			Where(&entity.Student{Email: s.Email}).
			Attrs(s).
			FirstOrCreate(&got).Error; err != nil {
			tx.Rollback()
			panic(err)
		}
	}

	// ===== Contract (เอกลักษณ์: StudentID + Start_Date + End_Date) =====
	startDate, _ := time.Parse("2006-01-02", "2025-01-01")
	endDate, _ := time.Parse("2006-01-02", "2026-04-01")
	s1, s2, s3 := uint(1), uint(2), uint(3)

	contracts := []entity.Contract{
		{Start_Date: startDate, End_Date: endDate, Rate: 2900.00, StudentID: &s1, RoomID: &s1, Admin_ID: &s1},
		{Start_Date: startDate, End_Date: endDate, Rate: 2900.00, StudentID: &s2, RoomID: &s2, Admin_ID: &s1},
		{Start_Date: startDate, End_Date: endDate, Rate: 2900.00, StudentID: &s3, RoomID: &s2, Admin_ID: &s1},
	}
	for i := range contracts {
		ct := contracts[i]
		var got entity.Contract
		if err := tx.
			Where(&entity.Contract{
				Start_Date: ct.Start_Date,
				End_Date:   ct.End_Date,
				StudentID:  ct.StudentID,
			}).
			Attrs(ct).
			FirstOrCreate(&got).Error; err != nil {
			tx.Rollback()
			panic(err)
		}
	}

	// ===== Payment (เอกลักษณ์: StudentID + BillingID + ContractID) =====
	recv := uint(1)
	payments := []entity.Payment{
		{StudentID: 1, BillingID: 1, ContractID: 1, EvidenceID: 1, ReceiverID: &recv, Amount: 2900, Payment_Date: time.Now(), Method: "-", PayerName: "ผู้ปกครอง A"},
		{StudentID: 2, BillingID: 2, ContractID: 2, EvidenceID: 2, ReceiverID: &recv, Amount: 2900, Payment_Date: time.Now(), Method: "-", PayerName: "ผู้ปกครอง A"},
		{StudentID: 3, BillingID: 3, ContractID: 3, EvidenceID: 3, ReceiverID: &recv, Amount: 2900, Payment_Date: time.Now(), Method: "-", PayerName: "ผู้ปกครอง A"},
	}
	for i := range payments {
		p := payments[i]
		var got entity.Payment
		if err := tx.
			Where(&entity.Payment{StudentID: p.StudentID, BillingID: p.BillingID, ContractID: p.ContractID}).
			Attrs(p).
			FirstOrCreate(&got).Error; err != nil {
			tx.Rollback()
			panic(err)
		}
	}

	

// ===== RoomType (idempotent) =====
rtSeeds := []struct {
    Name  string
    Price float64
}{
    {"Air Room", 2900.00},
    {"Fan Room", 2500.00},
}
for _, s := range rtSeeds {
    var rt entity.RoomType
    if err := tx.Where(&entity.RoomType{RoomTypeName: s.Name}).
        Attrs(entity.RoomType{RentalPrice: s.Price}).
        FirstOrCreate(&rt).Error; err != nil {
        tx.Rollback(); panic(err)
    }
}

// ดึง RoomType IDs
var rtAir, rtFan entity.RoomType
if err := tx.First(&rtAir, "room_type_name = ?", "Air Room").Error; err != nil { tx.Rollback(); panic(err) }
if err := tx.First(&rtFan, "room_type_name = ?", "Fan Room").Error; err != nil { tx.Rollback(); panic(err) }

// ===== Room (อย่าเดา ID ให้ผูกด้วย RoomNumber และเซ็ต RoomTypeID ที่ดึงมาจริง) =====
roomSeeds := []struct {
    Number string
    Status string
    Image  string
    RTID   uint
    StudID *uint // ใส่ให้อยู่ทีหลังเมื่อมี Students แล้วก็ได้ (ตอนนี้ค่าว่างไว้ก่อนจะปลอดภัยกว่า)
}{
    {"100", "ว่าง",   "room1.jpg",  rtAir.ID, nil},
    {"101", "ไม่ว่าง","room2.jpg",  rtAir.ID, nil},
    {"102", "ไม่ว่าง","room3.jpg",  rtAir.ID, nil},
    {"103", "ว่าง",   "room4.jpg",  rtFan.ID, nil},
    {"104", "ว่าง",   "room5.jpg",  rtFan.ID, nil},
    {"105", "ว่าง",   "room6.jpg",  rtFan.ID, nil},
    {"201", "ว่าง",   "room7.jpg",  rtAir.ID, nil},
    {"202", "ว่าง",   "room8.jpg",  rtAir.ID, nil},
    {"203", "ว่าง",   "room9.jpg",  rtFan.ID, nil},
    {"204", "ว่าง",   "room10.jpg", rtFan.ID, nil},
    {"205", "ว่าง",   "room11.jpg", rtAir.ID, nil},
}
for _, r := range roomSeeds {
    var rm entity.Room
    if err := tx.Where(&entity.Room{RoomNumber: r.Number}).
        Attrs(entity.Room{
            Status:     r.Status,
            Image:      r.Image,
            RoomTypeID: r.RTID,
            AdminID:    1, // ใช้ admin seed ตัวแรก
        }).
        FirstOrCreate(&rm).Error; err != nil {
        tx.Rollback(); panic(err)
    }
}

// สร้าง map: roomNumber -> roomID (เอาไว้ใช้ต่อ)
var roomList []entity.Room
if err := tx.Find(&roomList).Error; err != nil { tx.Rollback(); panic(err) }
roomIDByNumber := map[string]uint{}
for _, r := range roomList { roomIDByNumber[r.RoomNumber] = r.ID }

// ===== AssetType =====
atSeeds := []struct {
    Name       string
    Type       string
    PenaltyFee float64
}{
    {"เตียง", "เฟอร์นิเจอร์", 500.00},
    {"Wi-Fi", "สิ่งอำนวยความสะดวก", 1000.00},
}
now := time.Now()
for _, s := range atSeeds {
    var at entity.AssetType
    if err := tx.Where(&entity.AssetType{Name: s.Name}).
        Attrs(entity.AssetType{Type: s.Type, PenaltyFee: s.PenaltyFee, Date: now}).
        FirstOrCreate(&at).Error; err != nil {
        tx.Rollback(); panic(err)
    }
}

// ดึง AssetType เป็น map ชื่อ -> ID
var atList []entity.AssetType
if err := tx.Find(&atList).Error; err != nil { tx.Rollback(); panic(err) }
atID := map[string]uint{}
for _, a := range atList { atID[a.Name] = a.ID }

// ===== RoomAsset (ใช้ FirstOrCreate กันซ้ำ และอ้างด้วย RoomNumber + AssetTypeID) =====
raSeeds := []struct {
    RoomNumber  string
    AssetName   string
    Qty         int
}{
    {"101", "เตียง", 1},
    {"102", "เตียง", 1},
    {"103", "Wi-Fi", 1},
}
for _, s := range raSeeds {
    var ra entity.RoomAsset
    if err := tx.Where(&entity.RoomAsset{
        RoomNumber:  s.RoomNumber,
        AssetTypeID: atID[s.AssetName],
    }).Attrs(entity.RoomAsset{
        Quantity:  s.Qty,
        CheckDate: &now,
    }).FirstOrCreate(&ra).Error; err != nil {
        tx.Rollback(); panic(err)
    }
}








	// ===== ComboBox Seeds =====
	// ProblemType
	for _, name := range []string{"ไฟฟ้า", "ประปา", "เฟอร์นิเจอร์", "อื่นๆ"} {
		var pt entity.ProblemType
		if err := tx.
			Where(&entity.ProblemType{TypeName: name}).
			Attrs(entity.ProblemType{TypeName: name}).
			FirstOrCreate(&pt).Error; err != nil {
			tx.Rollback()
			panic(err)
		}
	}

	// MaintenanceStatus
	for _, name := range []string{"แจ้งซ่อม", "กำลังดำเนินการ", "เสร็จสิ้น"} {
		var st entity.MaintenanceStatus
		if err := tx.
			Where(&entity.MaintenanceStatus{StatusName: name}).
			Attrs(entity.MaintenanceStatus{StatusName: name}).
			FirstOrCreate(&st).Error; err != nil {
			tx.Rollback()
			panic(err)
		}
	}

	// ReviewTopic
	for _, name := range []string{"ความสะอาด", "ความปลอดภัย", "เสียงรบกวน", "อื่นๆ"} {
		var t entity.ReviewTopic
		if err := tx.
			Where(&entity.ReviewTopic{TopicName: name}).
			Attrs(entity.ReviewTopic{TopicName: name}).
			FirstOrCreate(&t).Error; err != nil {
			tx.Rollback()
			panic(err)
		}
	}

	// AnnouncementTarget
	for _, name := range []string{
		"นักศึกษาทุกคน",
		"นักศึกษาที่ยังไม่ชำระเงิน",
		"นักศึกษาที่ต้องการแจ้งซ่อม",
		"นักศึกษาที่ต้องการต่อสัญญาเช่า",
	} {
		var t entity.AnnouncementTarget
		if err := tx.
			Where(&entity.AnnouncementTarget{Name: name}).
			Attrs(entity.AnnouncementTarget{Name: name}).
			FirstOrCreate(&t).Error; err != nil {
			tx.Rollback()
			panic(err)
		}
	}

	// AnnouncementType
	for _, name := range []string{"ปรับปรุงระบบ", "ซ่อมแซ่มหอพัก", "ค่าใช้จ่าย"} {
		var t entity.AnnouncementType
		if err := tx.
			Where(&entity.AnnouncementType{Name: name}).
			Attrs(entity.AnnouncementType{Name: name}).
			FirstOrCreate(&t).Error; err != nil {
			tx.Rollback()
			panic(err)
		}
	}

	// ===== Announcements (หลัง Target/Type พร้อมแล้ว) =====
	// ดึง Admin ที่ใช้เป็นผู้ประกาศ
	var admin entity.Admin
	if err := tx.First(&admin, "email = ?", "admin@gmail.com").Error; err != nil {
		tx.Rollback()
		panic("admin seed missing: " + err.Error())
	}

	// ดึง Target
	var targetAll, targetUnpaid, targetRepair, targetRenew entity.AnnouncementTarget
	tx.First(&targetAll, "name = ?", "นักศึกษาทุกคน")
	tx.First(&targetUnpaid, "name = ?", "นักศึกษาที่ยังไม่ชำระเงิน")
	tx.First(&targetRepair, "name = ?", "นักศึกษาที่ต้องการแจ้งซ่อม")
	tx.First(&targetRenew, "name = ?", "นักศึกษาที่ต้องการต่อสัญญาเช่า")

	// ดึง Type
	var typeSystem, typeMaintenance, typeFee entity.AnnouncementType
	tx.First(&typeSystem, "name = ?", "ปรับปรุงระบบ")
	tx.First(&typeMaintenance, "name = ?", "ซ่อมแซ่มหอพัก")
	tx.First(&typeFee, "name = ?", "ค่าใช้จ่าย")

	seedAnnouncement := func(title, content, picture string, targetID, typeID uint) {
		var a entity.Announcement
		_ = tx.
			Where(&entity.Announcement{Title: title}).
			Attrs(entity.Announcement{
				Content:              content,
				Picture:              picture,
				AdminID:              admin.ID,
				AnnouncementTargetID: targetID,
				AnnouncementTypeID:   typeID,
			}).
			FirstOrCreate(&a)
	}

	seedAnnouncement(
		"ประกาศปิดปรับปรุงระบบ 3 ก.ย.",
		"ระบบจะปิดปรับปรุงระหว่างเวลา 22:00 - 02:00 เพื่ออัปเดตเวอร์ชันใหม่ โปรดวางแผนการใช้งานล่วงหน้า",
		"https://picsum.photos/seed/system/800/400",
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

	// === Commit ===
	if err := tx.Commit().Error; err != nil {
		panic(err)
	}
}

