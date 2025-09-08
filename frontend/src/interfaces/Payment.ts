import type { StudentInterface } from "./Student";
import type { AdminInterface } from "./Admin";
import type { EvidenceInterface } from "./Evidence";

export interface PaymentInterface {
  ID?: number;
  payment_date?: string;
  amount?: number;
  payment_status?: "pending" | "remaining" | "paid" | null;

  method?: string;
  payer_name?: string;
  receipt_number?: string;
  evidence_url?: string;

  receiver_id?: number | null;
  receiver?: AdminInterface;

  student_id?: number;
  student?: StudentInterface;

  evidence_id?: number;
  evidence?: EvidenceInterface;

  billing_id?: number;
  billing?: any;

  contract_id?: number;
}
