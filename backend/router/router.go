package router

import (
    "SA/backend/controller"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

func SetupRouter(db *gorm.DB) *gin.Engine {
    r := gin.Default()

    // สร้าง controller instance
    // roomController := controller.RoomController{DB: db}

    // POST /rooms → สำหรับสร้างห้อง
    r.GET("/rooms", controller.GetAllRooms)
    r.POST("/rooms", controller.CreateRoom)
    r.GET("/rooms/:id", controller.GetRoomByID)
    r.POST("/rooms/book", controller.BookRoom)
    r.POST("/rooms/cancel-booking", controller.CancelBooking)

    return r
}