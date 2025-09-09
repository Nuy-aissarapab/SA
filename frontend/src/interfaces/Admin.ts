import type { Room } from "./Room";

export interface Admin {
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;

  Username: string;
  first_name: string;
  last_name: string;

  // Relations
  Rooms?: Room[];
}
