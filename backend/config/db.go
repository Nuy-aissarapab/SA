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
   db.AutoMigrate( &entity.Billing{},
       &entity.Payment{}, 
       &entity.Contract{}, 
       &entity.Room{}, 
       &entity.Admin{}, 
       &entity.Student{},
       &entity.Evidence{},
      &entity.ReviewTopic{},
      &entity.Review{},
      )
   
   password, _ := bcrypt.GenerateFromPassword([]byte("123456"), 14)
   
   // Admin Base
   Admin := entity.Admin{
      Username:   "admin",
      Password:   string(password),
      Email:      "admin@gmail.com",
   }
   db.Create(&Admin)

   // Student Base
   student := entity.Student{
      Username:   "SA",
      Password:   string(password),
      Email:      "sa@gmail.com",
      First_Name: "เจษฎา",
      Last_Name:  "เชือดขุนทด",
   }
   db.Create(&student)
   
   db.Model(&entity.Student{}).Create(&entity.Student{
      Username:"SA1",
      Password: string(password),
      Email:    "sa1@gmail.com",
      First_Name: "สมชาติ",
      Last_Name:  "เชือดขุนทด",
   })
   db.Model(&entity.Student{}).Create(&entity.Student{
      Username:"SA2",
      Password: string(password),
      Email:    "sa2@gmail.com",
      First_Name: "รชต",
      Last_Name:  "สวุขใจ",
   })

   //Payment
   db.Model(&entity.Payment{},).Create(&entity.Payment{
      StudentID: 1,
      Payment_Date: time.Now(),
      Amount: 2900.00,
      Payment_Status: "ยังไม่ได้ชำระ",
   })
   db.Model(&entity.Payment{}).Create(&entity.Payment{
      StudentID: 2,
      Payment_Date: time.Now(),
      Amount: 2900.00,
      Payment_Status: "ยังไม่ได้ชำระ",
   })
   db.Model(&entity.Payment{}).Create(&entity.Payment{
      StudentID: 3,
      Payment_Date: time.Now(),
      Amount: 2900.00,
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
      Room_Status: "ว่าง",
      Floor:  2,
  })

  db.Model(&entity.Room{}).Create(&entity.Room{
      Rental_Price: 2900.00,
      Room_Status: "ว่าง",
      Floor:  2,
  })

  db.Model(&entity.Room{}).Create(&entity.Room{
      Rental_Price: 2900.00,
      Room_Status: "ว่าง",
      Floor:  2,
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

}

