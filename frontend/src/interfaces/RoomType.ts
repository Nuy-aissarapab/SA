import type { Room } from "./Room";

export interface RoomType {
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;

  RoomTypeName: string;
  RentalPrice: number;

  // Relations
  Rooms?: Room[];
}
