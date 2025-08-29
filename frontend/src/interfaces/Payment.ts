import type { StudentInterface } from "./Student";

export interface PaymentInterface {
  ID?: number;
  Payment_Date?: string;   // ใช้ string จาก API
  Amount?: number;
  Payment_Status?: string;
  Student?: StudentInterface;

}
