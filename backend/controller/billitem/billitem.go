package billitem


import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/SA/config"
	"github.com/SA/entity"
	
)


func GetBillItemsByBillId(c *gin.Context) {
    db := config.DB()

    billId := c.Param("billId")

    var items []entity.BillItem

    results := db.Where("billing_id = ?", billId).Find(&items)
    if results.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
        return
    }

    c.JSON(http.StatusOK, items)
}

