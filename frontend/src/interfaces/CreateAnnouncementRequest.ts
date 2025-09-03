export interface CreateAnnouncementRequest {
Title: string;
Content: string;
Picture?: string | null; // ส่งเป็น URL/base64 ตามที่ backend รองรับ
AnnouncementTargetID: number;
AnnouncementTypeID: number;
AdminID?: number; // ถ้า backend ดึงจาก token ก็ไม่ต้องส่ง
}