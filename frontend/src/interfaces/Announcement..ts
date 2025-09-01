export interface AnnouncementInterface {
  ID?: number;
  Title?: string;
  Content?: string;
  Picture?: string; // URL ของรูปภาพ (ถ้ามี)
  CreatedAt?: string; // ควรเป็นวันที่ในรูปแบบ ISO 8601 (เช่น "2023-10-01T12:00:00Z")
  UpdatedAt?: string; // ควรเป็นวันที่ในรูปแบบ ISO 8601 (เช่น "2023-10-01T12:00:00Z")
  AdminID?: number; // ผู้ดูแลระบบที่โพสต์ประกาศ
  AnnouncementTargetID?: number; // ประเภทเป้าหมายของประกาศ
  AnnouncementTypeID?: number; // ประเภทของประกาศ
}