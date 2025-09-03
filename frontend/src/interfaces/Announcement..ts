export interface AnnouncementInterface {
  ID?: number;
  Title?: string;
  Content?: string;
  Picture?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  AdminID?: number; 
  AnnouncementTargetID?: number;
  AnnouncementTypeID?: number;
}