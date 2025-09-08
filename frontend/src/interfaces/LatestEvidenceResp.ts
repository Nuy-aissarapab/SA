// types/evidence.ts
export type LatestEvidenceResp = {
    student_id: number;
    evidence?: {
      address?: string;   // "/uploads/xxx.jpg" หรือ "uploads\\xxx.jpg"
      url?: string;       // absolute ถ้า API เติมให้
      file_name?: string;
      mime_type?: string;
      date?: string;
      note?: string;
    } | null;
  };