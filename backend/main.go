package main

import (
	"net/http"

	"github.com/SA/config"
	"github.com/SA/controller/admin"
	"github.com/SA/controller/announcement"
	"github.com/SA/controller/contract"
	"github.com/SA/controller/evidence"
	"github.com/SA/controller/payment"
	"github.com/SA/controller/review"
	"github.com/SA/controller/reviewTopic"
	"github.com/SA/controller/student"
	"github.com/SA/entity"
	"github.com/SA/middlewares"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

const PORT = "8000"

func main() {
	// เปิด DB (เพื่อความเข้ากันได้กับโค้ดเดิมของโปรเจกต์)
	db, err := gorm.Open(sqlite.Open("sa.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	_ = db

	// เชื่อมต่อผ่าน config (ใช้ที่อื่น ๆ ในโปรเจกต์)
	config.ConnectionDB()
	config.SetupDatabase()

	r := gin.Default()
	r.Use(CORSMiddleware())

	// ✅ เสิร์ฟไฟล์อัปโหลด (static)
	r.Static("/uploads/EvidentPayment", "./uploads/EvidentPayment")

	// ===== Public routes (ไม่ต้องใช้ token) =====
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	// อัปโหลดสลิป และดึงสลิปล่าสุดตาม student_ids
	r.POST("/upload", evidence.UploadEvidence)
	r.GET("/evidences/latest-by-students", evidence.GetLatestByStudents)

	r.POST("/student/auth", student.SignIn)
	r.POST("/student/signup", student.SignUp)

	r.POST("/admin/auth", admin.SignIn)
	r.POST("/admin/signup", admin.SignUp)

	// ===== Protected routes (ต้องมี token) =====
	router := r.Group("/")
	router.Use(middlewares.Authorizes())
	{
		// Student
		router.GET("/students", student.GetAll)
		router.GET("/student/:id", student.Get)
		router.DELETE("/student/:id", student.Delete)
		router.PUT("/student/:id", student.UpdateUser)

		// Admin
		router.GET("/admins", admin.GetAll)
		router.GET("/admin/:id", admin.Get)
		router.DELETE("/admin/:id", admin.Delete)

		// Payments
		router.GET("/payments", payment.GetPayments)
		router.GET("/payment/:id", payment.GetPaymentById)
		router.POST("/payments", payment.CreatePayment)
		router.PATCH("/payments/:id/status", payment.UpdatePaymentStatus)
		router.PUT("/payments/:id/confirm", payment.ConfirmPayment)
		router.PUT("/payments/:id/reject", payment.RejectPayment)
		router.PATCH("/payments/:id/receiver", payment.UpdatePaymentReceiver)
		router.PATCH("/payments/:id/method", payment.UpdatePaymentMethod)

		// Evidence
		router.GET("/evidences", evidence.ListEvidences)

		// Contracts
		router.GET("/contracts", contract.ListContracts)
		router.PUT("/contracts/:id/renew-request", contract.RenewRequest)
		router.PUT("/contracts/:id/renew-approve", contract.RenewApprove)
		router.PUT("/contracts/:id/renew-reject", contract.RenewReject)
		router.POST("/contracts", contract.Create)
		router.PUT("/contracts/:id", contract.Update)
		router.DELETE("/contracts/:id", contract.Delete)

		// Reviews
		router.GET("/reviews", review.List)
		router.POST("/reviews", review.Create) // student only
		router.GET("/reviews/:id", review.GetByID)
		router.PUT("/reviews/:id", review.Update)    // student: owner only
		router.DELETE("/reviews/:id", review.Delete) // admin:any, student:owner

		// Review Topics
		router.GET("/reviewtopics", reviewTopic.GetReviewTopics)

		// Announcements
		router.POST("/announcements", announcement.CreateAnnouncement) // admin only
		router.GET("/announcements", announcement.ListAnnouncements)
		router.GET("/announcements/:id", announcement.ListByIDAnnouncements)
		router.DELETE("/announcements/:id", announcement.DeleteAnnouncement)
		router.PATCH("/announcements/:id", announcement.UpdateAnnouncement) // admin only
	}

	// ✅ AutoMigrate (รวม Evidence)
	config.DB().AutoMigrate(
		&entity.Billing{},
		&entity.Payment{},
		&entity.Contract{},
		&entity.Room{},
		&entity.Student{},
		&entity.Evidence{},
		&entity.Admin{},
	)

	// ✅ เปิดรับทุกอินเตอร์เฟส (ย้ายเครื่องได้)
	r.Run("0.0.0.0:" + PORT)
}

// ===== CORS Middleware =====
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
