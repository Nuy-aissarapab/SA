// interfaces/Evidence.ts

import { type StudentInterface } from "./Student";
import { type PaymentInterface } from "./Payment";

export interface EvidenceInterface {
  EvidenceID: number;
  address: string;      // เช่น "/uploads/evidence_xxx.jpg" หรือ "uploads\xxx.jpg"
  date: string;
  note?: string;
  student_id: number;
  student_name?: string;
  student_code?: string;
  file_name?: string;
  mime_type?: string;

  StudentID: number;
  Student?: StudentInterface;

  PaymentID: number;
  Payment?: PaymentInterface;

  // CreatedAt?: Date;
  // UpdatedAt?: Date;
  // DeletedAt?: Date | null;
}
