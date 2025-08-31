// interfaces/Student.ts
export interface StudentInterface {
  ID?: number;            // <-- เปลี่ยนจาก StudentID เป็น ID
  username?: string;
  email?: string;
  // password ไม่ต้องมีใน interface สำหรับ view
  first_name?: string;
  last_name?: string;
  birthday?: string;      // รับเป็น string แล้วไป format ในหน้า
  phone?: string;
  parent_phone?: string;
  parent_name?: string;
  address?: string;
  major?: string;

  room_id?: number | null;
  room?: any;             // ถ้ารู้ shape ก็พิมพ์ชัด ๆ ได้
  contracts?: any[];
  payments?: any[];
}

export interface CreateStudentRequest {
  Email: string;
  Password: string;
}

export interface LoginStudentRequest {
  Email: string;
  Password: string;
}
