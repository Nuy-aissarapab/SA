import type { RoomType } from "./RoomType";
import type { Student } from "./Student";
import type { Admin } from "./Admin";
import type { RoomAsset } from "./RoomAsset";

export interface Room {
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;

  room_number: string;
  room_status: string;
  image: string;
  BookingTime: string; // ISO date string

  // Foreign Keys
  RoomTypeID: number;
  StudentID: number | null;
  AdminID: number;

  // Relations
  RoomType?: RoomType;
  Student?: Student;
  Admin?: Admin;
  RoomAsset?: RoomAsset[];
}
