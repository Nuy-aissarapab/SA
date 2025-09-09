import type { Room } from "./Room";
import type { AssetType } from "./AssetType";

export interface RoomAsset {
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;

  Image: string;
  Quantity: number;
  Condition: string;
  Status: string;
  CreatedDate: string; // ISO date string
  CheckDate: string;   // ISO date string

  // Foreign Keys
  RoomNumber: string;
  AssetTypeID: number;

  // Relations
  Room?: Room;
  AssetType?: AssetType;
}
