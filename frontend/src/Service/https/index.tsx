import type { UsersInterface } from "../../interfaces/IUser";
import type { SignInInterface } from "../../interfaces/SignIn";
import type { StudentInterface ,CreateStudentRequest, LoginStudentRequest} from "../../interfaces/Student";
import type { AdminInterface, CreateAdminRequest, LoginAdminRequest} from "../../interfaces/Admin";
import type { PaymentInterface } from "../../interfaces/Payment";
import type { ContractInterface } from "../../interfaces/Contract";
import type { ReviewInterface } from "../../interfaces/Review";
import { requestOptions as authOptions } from "../../Service/https/requestOptions";
import axios, { AxiosError } from "axios";
import type { AxiosResponse } from "axios";

const apiUrl = "http://localhost:8000";
const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");

const requestOptions = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  },
};

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000";

const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(`${name}=`));

  if (cookie) {
    let AccessToken = decodeURIComponent(cookie.split("=")[1]);
    AccessToken = AccessToken.replace(/\\/g, "").replace(/"/g, "");
    return AccessToken ? AccessToken : null;
  }
  return null;
};

// const getConfig = () => ({
//   headers: {
//     Authorization: `Bearer ${getCookie("0195f494-feaa-734a-92a6-05739101ede9")}`,
//     "Content-Type": "application/json",
//   },
// });

const token = localStorage.getItem("token");
const tokenType = localStorage.getItem("token_type");

if (!token || !tokenType) {
  console.warn("No token found, redirect to login");
  window.location.href = "/login"; // หรือจัดการให้เหมาะสม
}

const getConfig = () => {
  // ✅ อ่านสดทุกครั้ง
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `${tokenType} ${token}`;

  return { headers };
};



const getConfigWithoutAuth = () => ({
  headers: { "Content-Type": "application/json" },
});

export const Post = async (url: string, data: any, requireAuth: boolean = true) => {
  const config = requireAuth ? getConfig() : getConfigWithoutAuth();
  try {
    const res = await axios.post(`${API_URL}${url}`, data, config);
    return res;
  } catch (error: any) {
    return error.response ?? { status: 500, data: { error: "Unexpected error" } };
  }
};

export const Get = async (
  url: string,
  requireAuth: boolean = true
): Promise<AxiosResponse | any> => {
  const config = requireAuth ? getConfig() : getConfigWithoutAuth();
  return await axios
    .get(`${API_URL}${url}`, config)
    .then((res) => res.data)
    .catch((error: AxiosError) => {
      if (error?.message === "Network Error") {
        return error.response;
      }
      if (error?.response?.status === 401) {
        localStorage.clear();
        window.location.reload();
      }
      return error.response;
    });
};

export const Update = async (
  url: string,
  data: any,
  requireAuth: boolean = true
): Promise<AxiosResponse | any> => {
  const config = requireAuth ? getConfig() : getConfigWithoutAuth();
  return await axios
    .put(`${API_URL}${url}`, data, config)
    .then((res) => res.data)
    .catch((error: AxiosError) => {
      if (error?.response?.status === 401) {
        localStorage.clear();
        window.location.reload();
      }
      return error.response;
    });
};

export const Delete = async (
  url: string,
  requireAuth: boolean = true
): Promise<AxiosResponse | any> => {
  const config = requireAuth ? getConfig() : getConfigWithoutAuth();
  return await axios
    .delete(`${API_URL}${url}`, config)
    .then((res) => res.data)
    .catch((error: AxiosError) => {
      if (error?.response?.status === 401) {
        localStorage.clear();
        window.location.reload();
      }
      return error.response;
    });
};


// Authentication APIs
export const authAPI = {
  // Student
  studentSignup: (data: CreateStudentRequest) =>
    Post("/student/signup", data, false),
  studentLogin: (data: LoginStudentRequest) =>
    Post("/student/auth", data, false),

  // Admin
  adminSignup: (data: CreateAdminRequest) =>
    Post("/admin/signup", data, false),
  adminLogin: (data: LoginAdminRequest) =>
    Post("/admin/auth", data, false),
};

// student APIs
export const student = {
  getAll: () => Get("/students"),
  getById: (id: number) => Get(`/student/${id}`),
  delete: (id: number) => Delete(`/student/${id}`),
};

// admin APIs
export const adminAPI = {
  getAll: () => Get("/admins"),
  getById: (id: number) => Get(`/admin/${id}`),
  delete: (id: number) => Delete(`/admin/${id}`),
};



// Gender
async function GetGender() {
  return await axios
    .get(`${apiUrl}/genders`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

// Users
async function GetUsers() {
  return await axios
    .get(`${apiUrl}/users`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

// Students
async function GetStudents() {
  return await axios
    .get(`${apiUrl}/students`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

// Payment API
async function GetPayment(studentId?: string) {
  const url = studentId
    ? `${apiUrl}/payments?studentId=${studentId}`
    : `${apiUrl}/payments`;

  return await axios
    .get(url, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
// Evidence (Upload transfer slip)
async function UploadEvidence(data: any) {
  return await axios
    .post(`${apiUrl}/upload`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `${Bearer} ${Authorization}`,
      },
    })
    .then((res) => res)              // 👈 ต้อง return res
    .catch((e) => e.response);       // 👈 return error.response ด้วย
}


// Contract API
async function GetContracts(studentId?: string) {
  const url = studentId
    ? `${apiUrl}/contracts?studentId=${studentId}`
    : `${apiUrl}/contracts`;

  return await axios
    .get(url, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

export async function RenewContract(
  id: number,
  body: {
    months?: number;           // 6 | 12
    start_date?: string;       // "YYYY-MM-DD"
    end_date?: string;         // "YYYY-MM-DD" (ใช้ตอน custom)
    rate?: number;             // ค่าเช่าใหม่ (optional)
  }
) {
  return await axios
    .put(`${apiUrl}/contracts/${id}/renew`, body, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateContract(data: ContractInterface) {
  return await axios
    .post(`${apiUrl}/contract`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateContractById(id: string, data: ContractInterface) {
  return await axios
    .put(`${apiUrl}/contract/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function DeleteContractById(id: string) {
  return await axios
    .delete(`${apiUrl}/contract/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}




async function GetUsersById(id: string) {
  return await axios
    .get(`${apiUrl}/user/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateUsersById(id: string, data: UsersInterface) {
  return await axios
    .put(`${apiUrl}/user/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function DeleteUsersById(id: string) {
  return await axios
    .delete(`${apiUrl}/user/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateUser(data: UsersInterface) {
  return await axios
    .post(`${apiUrl}/signup`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}




async function GetStudentById(id: string) {
  return await axios
    .get(`${apiUrl}/student/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateStudent(data: StudentInterface) {
  return await axios
    .post(`${apiUrl}/signup`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateStudentById(id: string, data: StudentInterface) {
  return await axios
    .put(`${apiUrl}/student/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function DeleteStudentById(id: string) {
  return await axios
    .delete(`${apiUrl}/student/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

// Review
export async function GetReviews() {
  return await axios
    .get(`${API_URL}/reviews`, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function CreateReview(data: ReviewInterface) {
  return await axios
    .post(`${API_URL}/reviews`, data, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function GetReviewById(id: string) {
  return await axios
    .get(`${API_URL}/reviews/${id}`, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function UpdateReview(id: string, data: Partial<ReviewInterface>) {
  return await axios
    .put(`${API_URL}/reviews/${id}`, data, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function DeleteReview(id: string) {
  return await axios
    .delete(`${API_URL}/reviews/${id}`, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}
export async function GetReviewTopics() {
  return await axios.get(`${apiUrl}/reviewtopics`, requestOptions).then((r) => r).catch((e) => e.response);
}

export {
  GetGender,
  GetUsers,
  GetUsersById,
  UpdateUsersById,
  DeleteUsersById,
  CreateUser,
  GetStudents,
  GetStudentById,
  CreateStudent,
  UpdateStudentById,
  DeleteStudentById,
  GetPayment,
  GetContracts,
  CreateContract,
  UpdateContractById,
  DeleteContractById,
  UploadEvidence,
};