package review

import (
	"strconv"
	"github.com/gin-gonic/gin"
)

func getAuth(c *gin.Context) (userID uint, role string, ok bool) {
	var idAny, roleAny any

	if v, exists := c.Get("id"); exists { idAny = v }
	if v, exists := c.Get("user_id"); exists { idAny = v }          // เผื่อบาง middleware ใช้ key นี้
	if v, exists := c.Get("student_id"); exists { idAny = v }       // หรือ key นี้

	if v, exists := c.Get("role"); exists { roleAny = v }
	if v, exists := c.Get("Role"); exists { roleAny = v }

	if s, ok2 := roleAny.(string); ok2 { role = s }

	switch vv := idAny.(type) {
	case string:
		if n, err := strconv.Atoi(vv); err == nil { userID = uint(n) }
	case float64:
		userID = uint(vv)
	case int:
		userID = uint(vv)
	case uint:
		userID = vv
	}

	ok = (userID != 0 && role != "")
	return
}
