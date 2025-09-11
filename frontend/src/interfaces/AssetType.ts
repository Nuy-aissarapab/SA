  import type { RoomAsset } from "./RoomAsset";

  export interface AssetType {
    ID?: number;
    CreatedAt?: string;
    UpdatedAt?: string;
    DeletedAt?: string | null;

    Name: string;
    Type:string ;
    PenaltyFee: number;
    Date: string; // ISO date string

    // Relations
    RoomAssets?: RoomAsset[];
  }
