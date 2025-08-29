import type { StudentInterface } from "./Student";
import type { ContractInterface } from "./Contract";
import type { ReviewTopicInterface } from "./ReviewTopic";

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
  Contract?: ContractInterface;
  ReviewTopic?: ReviewTopicInterface;
}
