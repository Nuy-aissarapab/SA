import type { StudentInterface } from "./Student";

export interface ContractInterface {
  ID: number;
  start_date: string; // "YYYY-MM-DDTHH:mm:ssZ" จาก Go time.Time ก็พาร์สได้
  end_date: string;
  rate?: number;
  Student_ID?: number;   // foreign key ไปยัง Student
  Student?: StudentInterface;
}

