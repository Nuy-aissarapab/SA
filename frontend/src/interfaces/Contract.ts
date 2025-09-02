import type { StudentInterface } from "./Student";

export interface ContractInterface {
  ID: number;
  start_date: string;
  end_date: string;
  rate?: number;
  Student_ID?: number;
  Student?: StudentInterface;

  renewal_pending?: boolean;
  renewal_status?: "pending" | "approved" | "rejected" | null;
  renewal_start_date?: string | null;
  renewal_end_date?: string | null;
  renewal_months?: number | null;
  renewal_rate?: number | null;
}

type ContractWithRenewal = ContractInterface & {
  // existing renewal fields...
  renewal_pending?: boolean;
  renewal_status?: string | null;
  renewal_start_date?: string | null;
  renewal_end_date?: string | null;
  renewal_months?: number | null;
  renewal_rate?: number | null;

  // 🔽 add termination fields
  termination_pending?: boolean | null;
  termination_status?: string | null;              // "pending" | "approved" | "rejected"
  termination_effective_date?: string | null;
  termination_reason?: string | null;
  termination_penalty?: number | null;
  termination_refund?: number | null;
};
