// interfaces/Payment.ts
import type { StudentInterface } from "./Student";
import type { AdminInterface } from "./Admin";
import type { BillingInterface } from "./Billing";

export interface PaymentInterface {
  ID?: number;
  Payment_Date?: string;
  Amount?: number;
  Payment_Status?: "pending" | "remaining" | "paid" | null;

  Method?: string;
  PayerName?: string;
  ReceiptNumber?: string;
  EvidenceURL?: string;

  ReceiverID?: number | null;
  Receiver?: AdminInterface;

  StudentID?: number;
  Student?: StudentInterface;

  BillingID?: number;
  Billing?: BillingInterface;
}
