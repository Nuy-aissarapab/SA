// Admin
export interface AdminInterface {
  AdminID?: number;
  Email?: string;
  Password?: string;
  first_name?: string;
  last_name?: string;
  Birthday?: string;
  Phone?: string;
}

export interface CreateAdminRequest {
  Email: string;
  Password: string;
}

export interface LoginAdminRequest {
  Email: string;
  Password: string;
}