// Student
export interface StudentInterface {
  StudentID?: number;
  Email?: string;
  Password?: string;
  first_name?: string;
  last_name?: string;
  Birthday?: string;
  Phone?: string;
  Parent_Phone?: string;
  Parent_Name?: string;
}

export interface CreateStudentRequest {
  Email: string;
  Password: string;
}

export interface LoginStudentRequest {
  Email: string;
  Password: string;
}