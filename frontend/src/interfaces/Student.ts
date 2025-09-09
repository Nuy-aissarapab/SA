import type { Room } from "./Room";

export interface Student {
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;

  first_name: string;
  Last_lame: string;
  parent_phone: string;

  // Relations
  Room_ID?: number | null;
  Room?: Room;
}
