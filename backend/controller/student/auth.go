package student

import (
   "errors"
   "net/http"
   "time"
   "github.com/gin-gonic/gin"
   "golang.org/x/crypto/bcrypt"
   "gorm.io/gorm"
   "github.com/SA/config"
   "github.com/SA/entity"
   "github.com/SA/services"
)

type (
   Authen struct {
       Email	 	 string		`json:"email"`
       Password 	 string		`json:"password"`
   }
   
   signUp struct {
        Username 	 string 	`json:"username"`
	    Password 	 string		`json:"password"`
	    Email	 	 string		`json:"email"`
	    First_Name 	 string		`json:"first_name"`
	    Last_Name    string  	`json:"last_name"`
	    Birthday	 time.Time	`json:"birthday"`
	    Phone		 string		`json:"phone"`
	    Parent_Phone string		`json:"parent_phone"`
	    Parent_Name  string		`json:"parent_name"`
   }
)


func SignUp(c *gin.Context) {
   var payload signUp
   // Bind JSON payload to the struct
   if err := c.ShouldBindJSON(&payload); err != nil {
       c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
       return
   }

   db := config.DB()
   var userCheck entity.Student

   // Check if the user with the provided email already exists
   result := db.Where("email = ?", payload.Email).First(&userCheck)
   if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
       // If there's a database error other than "record not found"
       c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
       return
   }


   if userCheck.ID != 0 {
       // If the user with the provided email already exists
       c.JSON(http.StatusConflict, gin.H{"error": "Email is already registered"})
       return
   }

   // Hash the user's password
   hashedPassword, _ := config.HashPassword(payload.Password)
   // Create a new user
   user := entity.Student{
       Username: payload.First_Name,
       First_Name: payload.First_Name,
       Last_Name:  payload.Last_Name,
       Email:     payload.Email,
       Phone:       payload.Phone,
       Password:  hashedPassword,
       Birthday:  payload.Birthday,
       Parent_Phone:  payload.Parent_Phone,
       Parent_Name:  payload.Parent_Name,
   }
   // Save the user to the database
   if err := db.Create(&user).Error; err != nil {
       c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
       return
   }
   c.JSON(http.StatusCreated, gin.H{"message": "Sign-up successful"})
}

func SignIn(c *gin.Context) {
   var payload Authen
   var user entity.Student
   if err := c.ShouldBindJSON(&payload); err != nil {
       c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
       return
   }
   // ค้นหา user ด้วย Username ที่ผู้ใช้กรอกเข้ามา
   if err := config.DB().Raw("SELECT * FROM students WHERE email = ?", payload.Email).Scan(&user).Error; err != nil {
       c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
       return
   }

   // ตรวจสอบรหัสผ่าน
   err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(payload.Password))

   if err != nil {
       c.JSON(http.StatusBadRequest, gin.H{"error": "password is incerrect"})
       return
   }
   jwtWrapper := services.JwtWrapper{
       SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
       Issuer:          "AuthService",
       ExpirationHours: 24,
   }

   signedToken, err := jwtWrapper.GenerateToken(user.Email, user.ID, "student")

   if err != nil {
       c.JSON(http.StatusBadRequest, gin.H{"error": "error signing token"})
       return
   }
   c.JSON(http.StatusOK, gin.H{"token_type": "Bearer", "token": signedToken, "id": user.ID})
}