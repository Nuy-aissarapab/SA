import type { RoomType } from "./RoomType";
import type { StudentInterface } from "./Student";
import type { AdminInterface } from "./Admin";
import type { RoomAsset } from "./RoomAsset";
import type { MeterInterface } from "./Meter";
import type { BillInterface } from "./Bill";

export interface RoomInterface {
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;

  ID?: number;
  RoomNumber: string;
  Status: string;
  Image?: string;
  BookingTime: string; // ISO date string

  // Foreign Keys
  RoomTypeID: number;
  StudentID: number | null;
  AdminID: number;

  // Relations
  RoomType?: RoomType;
  Student?: StudentInterface;
  Admin?: AdminInterface;
  RoomAsset?: RoomAsset[];
}

export interface RoomMeterInterface {
  ID: number;
  RoomNumber?: string;

  Student?: StudentInterface;       // ✅ array ของ student
  MeterRecords?: MeterInterface[];     // ✅ array ของ meter record
  Bills?: BillInterface[]; 
  
}
