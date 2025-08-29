// interfaces/Evidence.ts

import { type StudentInterface } from "./Student";
import { type PaymentInterface } from "./Payment";

export interface EvidenceInterface {
  ID?: number;         // primary key
  File: string;
  Date: Date | string;

  StudentID: number;
  Student?: StudentInterface;

  PaymentID: number;
  Payment?: PaymentInterface;

  // CreatedAt?: Date;
  // UpdatedAt?: Date;
  // DeletedAt?: Date | null;
}