package entity

import (
	"gorm.io/gorm"
)

type Announcement struct {
	gorm.Model
	Title       string
	Content     string
	Picture     string

	AdminID     uint
	Admin       Admin `gorm:"foreignKey:AdminID"`

	AnnouncementTargetID uint
	AnnouncementsTarget   AnnouncementTarget `gorm:"foreignKey:AnnouncementTargetID"`
	
 
	AnnouncementTypeID uint
	AnnouncementType   AnnouncementType `gorm:"foreignKey:AnnouncementTypeID"`
}
// // Helper: FirstOrCreate ด้วย title ไม่ให้ซ้ำ
// seedAnnouncement := func(title, content, picture string, targetID, typeID uint) {
//     var a entity.Announcement
//     _ = db.
//         Where("title = ?", title).
//         Attrs(entity.Announcement{
//             Content:              content,
//             Picture:              picture,
//             AdminID:              admin.ID,
//             AnnouncementTargetID: targetID,
//             AnnouncementTypeID:   typeID,
//         }).
//         FirstOrCreate(&a).Error
// }


// // ตัวอย่างประกาศพื้นฐาน
// seedAnnouncement(
//     "ประกาศปิดปรับปรุงระบบ 3 ก.ย.",
//     "ระบบจะปิดปรับปรุงระหว่างเวลา 22:00 - 02:00 เพื่ออัปเดตเวอร์ชันใหม่ โปรดวางแผนการใช้งานล่วงหน้า",
//     "https://scontent-bkk1-2.xx.fbcdn.net/v/t39.30808-6/542711775_1281624446845366_8433981477510126776_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=CvnD3swNXNUQ7kNvwE083ln&_nc_oc=AdnAMXwpTVtVEgVv08niZs1IicgyOnBz2v6DV6Y7qSdpOthHj1fDBEEvxubIrHbqYkE&_nc_zt=23&_nc_ht=scontent-bkk1-2.xx&_nc_gid=EyILN72RssREW_B4sHBZDw&oh=00_AfWdL0FKqnP5epJRRvXY1wRV0DQrbQXUyHUDKTo2jPTrOw&oe=68BCCBC1",
//     targetAll.ID, typeSystem.ID,
// )

// seedAnnouncement(
//     "แจ้งซ่อมบำรุงท่อชั้น 2",
//     "พรุ่งนี้ 09:00-12:00 ช่างจะเข้าซ่อมท่อชั้น 2 อาจมีเสียงดังและน้ำไหลช้า ขออภัยในความไม่สะดวก",
//     "https://picsum.photos/seed/maintenance/800/400",
//     targetRepair.ID, typeMaintenance.ID,
// )

// seedAnnouncement(
//     "ชำระค่าเช่าเดือนนี้ภายในวันที่ 5",
//     "กรุณาชำระค่าเช่า 2,900 บาท ภายในวันที่ 5 ของทุกเดือน หากเกินกำหนดจะมีค่าปรับตามระเบียบ",
//     "https://picsum.photos/seed/fee/800/400",
//     targetUnpaid.ID, typeFee.ID,
// )

// seedAnnouncement(
//     "ต่อสัญญาเช่าประจำปี",
//     "นักศึกษาที่ต้องการต่อสัญญาเช่ากรุณายื่นเรื่องภายในวันที่ 30 กันยายน ที่สำนักงานหอพัก",
//     "https://picsum.photos/seed/renew/800/400",
//     targetRenew.ID, typeFee.ID,
// )