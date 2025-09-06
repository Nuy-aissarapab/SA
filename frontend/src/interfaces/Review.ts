import type { StudentInterface } from "./Student";
import type { ReviewTopicInterface } from "./ReviewTopic";
import type { RoomInterface } from "./Room";

export interface ReviewInterface {
  ID?: number;                 // gorm.Model
  Title?: string;
  Comment?: string;
  Rating?: number;
  ReviewDate?: Date;
  StudentID?: number;
  ContractID?: number;
  ReviewTopicID?: number;

  Student?: StudentInterface;
  Room?: RoomInterface;
  ReviewTopic?: ReviewTopicInterface;
}
