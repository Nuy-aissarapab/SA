import type { RoomInterface } from "./Room";
import type { AssetType } from "./AssetType";

export interface RoomAsset {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;

  Quantity: number;

 
  CheckDate: string;   // ISO date string

  // Foreign Keys
  RoomNumber: string;
  AssetTypeID: number;

  // Relations
  Room?: RoomInterface;
  AssetType?: AssetType;
}
