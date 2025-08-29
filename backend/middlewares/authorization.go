// middlewares/authorizes.go
package middlewares

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"

    "github.com/SA/services" // ✅ ใช้จริง
    "github.com/SA/config"
    "github.com/SA/entity"
)

var jwtWrapper = services.JwtWrapper{ // ✅ ประกาศตัวแปรให้มีจริง
    SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
    Issuer:          "AuthService",
    ExpirationHours: 24,
}

// middlewares/authorizes.go
func Authorizes() gin.HandlerFunc {
    return func(c *gin.Context) {
        auth := c.GetHeader("Authorization")
        if !strings.HasPrefix(auth, "Bearer ") {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
            return
        }
        tokenStr := strings.TrimPrefix(auth, "Bearer ")

        claims, err := jwtWrapper.ValidateToken(tokenStr)
        if err != nil {
            // ✨ log ชัด ๆ
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": "invalid token",
                "detail": err.Error(),
            })
            return
        }

        email := claims.Email

        // ลองหาเป็น Student ก่อน
        var st entity.Student
        if err := config.DB().Where("email = ?", email).First(&st).Error; err == nil {
            c.Set("role", "student")
            c.Set("id", st.ID) // ต้องเป็น Student.ID เพื่อไปเทียบกับ review.StudentID
            c.Next()
            return
        }

        // ไม่ใช่ Student → ลองเป็น Admin
        var ad entity.Admin
        if err := config.DB().Where("email = ?", email).First(&ad).Error; err == nil {
            c.Set("role", "admin")
            c.Set("id", ad.ID)
            c.Next()
            return
        }

        c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "user not found"})
    }
}
