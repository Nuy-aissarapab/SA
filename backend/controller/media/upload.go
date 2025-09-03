// controller/media/upload.go
package media

import (
  "fmt"
  "net/http"
  "os"
  "path/filepath"
  "strings"
  "time"
  "github.com/gin-gonic/gin"
)

func ensureDir(path string) error {
  if _, err := os.Stat(path); os.IsNotExist(err) {
    return os.MkdirAll(path, 0o755)
  }
  return nil
}

func sanitize(name string) string {
  base := filepath.Base(name)
  return strings.ReplaceAll(base, "..", "_")
}

func UploadAnnouncementImage(c *gin.Context) {
  file, err := c.FormFile("file")
  if err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": "missing file (field: file)"})
    return
  }
  ext := strings.ToLower(filepath.Ext(file.Filename))
  switch ext {
  case ".jpg", ".jpeg", ".png", ".webp", ".gif":
  default:
    c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported file type"})
    return
  }

  dir := "./uploads/announcements"
  if err := ensureDir(dir); err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create uploads dir"})
    return
  }

  fname := fmt.Sprintf("%d_%s", time.Now().UnixNano(), sanitize(file.Filename))
  save := filepath.Join(dir, fname)
  if err := c.SaveUploadedFile(file, save); err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot save file"})
    return
  }

  c.JSON(http.StatusOK, gin.H{
    "url": fmt.Sprintf("http://localhost:8000/uploads/announcements/%s", fname),
})

}
