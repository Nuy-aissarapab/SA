import type { StudentInterface } from "./Student";
import type { ProblemTypeInterface } from "./ProblemType";
import type { MaintenanceStatusInterface } from "./MaintenanceStatus";
import type { RoomInterface } from "./Room";

export interface MaintenanceInterface {
  ID?: number;

  Title?: string;  title?: string;
  Detail?: string; detail?: string;
  ReportDate?: string | Date; report_date?: string;

  ImageURL?: string; image_url?: string;
  ImageName?: string; image_name?: string;

  StudentID?: number; student_id?: number;
  ProblemTypeID?: number; problem_type_id?: number;
  MaintenanceStatusID?: number; maintenance_status_id?: number;

  // ✅ snapshot ห้อง
  RoomID?: number; room_id?: number;

  // ส่งรูปแบบ base64 (สร้าง/แก้ไข)
  image_base64?: string;
  image_name?: string;

  Student?: StudentInterface;
  ProblemType?: ProblemTypeInterface;
  MaintenanceStatus?: MaintenanceStatusInterface;
  Room?: RoomInterface; room?: RoomInterface;
}
