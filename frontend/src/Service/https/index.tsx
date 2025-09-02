// Service/https/index.ts (ฉบับแก้ วิธี B)
import type { UsersInterface } from "../../interfaces/IUser";
import type { SignInInterface } from "../../interfaces/SignIn";
import type {
  StudentInterface,
  CreateStudentRequest,
  LoginStudentRequest,
} from "../../interfaces/Student";
import type {
  AdminInterface,
  CreateAdminRequest,
  LoginAdminRequest,
} from "../../interfaces/Admin";
import type { PaymentInterface } from "../../interfaces/Payment";
import type { ContractInterface } from "../../interfaces/Contract";
import type { ReviewInterface } from "../../interfaces/Review";
// import { requestOptions as authOptions } from "../../Service/https/requestOptions";
import axios, { AxiosError } from "axios";
import type { AxiosResponse } from "axios";

/** ============================================================
 *  ฐาน URL ของ API แบบ "อ่านสดทุกครั้ง" (env → localStorage → <meta>)
 *  - ใช้ได้แม้ .env ไม่ทำงาน
 *  - ตั้งค่าขณะรันได้ด้วย: localStorage.setItem('api_base','http://<IP>:8000')
 *  - ตั้งผ่าน index.html ก็ได้: <meta name="api-base" content="http://<IP>:8000">
 *  ============================================================ */
const normalize = (s?: string) => (s || "").trim().replace(/\/+$/g, "");

export function resolveAPIBase(): string {
  const env =
    ((import.meta as any)?.env?.VITE_API_KEY as string | undefined) || "";
  const ls =
    (typeof window !== "undefined" ? localStorage.getItem("api_base") : "") ||
    "";
  const meta =
    (typeof document !== "undefined"
      ? (document.querySelector(
          'meta[name="api-base"]'
        ) as HTMLMetaElement | null)?.content
      : "") || "";

  const pick = (...xs: string[]) => {
    for (const x of xs) {
      const v = normalize(x);
      if (v) return v;
    }
    return "";
  };

  return (
    pick(env, ls, meta) ||
    `${window.location.protocol}//${window.location.hostname}:8000`
  );
}
localStorage.setItem('api_base','http://10.1.179.240:8000');
// DEBUG: ดูค่าจริงตอนรัน
// (จะเห็นค่า env, ค่าใน LS และผลลัพธ์สุดท้าย)
console.log(
  "[ENV] VITE_API_KEY =",
  (import.meta as any)?.env?.VITE_API_KEY,
  "api_base(ls) =",
  (typeof window !== "undefined" && localStorage.getItem("api_base")) || "",
  "API_BASE =",
  resolveAPIBase()
);

/** =========================
 *  Headers แบบอ่าน token สดทุกครั้ง
 *  ========================= */
const getConfig = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `${tokenType} ${token}`;
  return { headers };
};

const getConfigWithoutAuth = () => ({
  headers: { "Content-Type": "application/json" },
});

/** =========================
 *  Helper wrappers (ใช้ base URL สดทุกครั้ง)
 *  ========================= */
export const Post = async (
  url: string,
  data: any,
  requireAuth: boolean = true
) => {
  const config = requireAuth ? getConfig() : getConfigWithoutAuth();
  try {
    const res = await axios.post(`${resolveAPIBase()}${url}`, data, config);
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
    .get(`${resolveAPIBase()}${url}`, config)
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
    .put(`${resolveAPIBase()}${url}`, data, config)
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
    .delete(`${resolveAPIBase()}${url}`, config)
    .then((res) => res.data)
    .catch((error: AxiosError) => {
      if (error?.response?.status === 401) {
        localStorage.clear();
        window.location.reload();
      }
      return error.response;
    });
};

/** ========== Auth ========== */
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

/** ========== Student/Admin basic ========== */
export const student = {
  getAll: () => Get("/students"),
  getById: (id: number) => Get(`/student/${id}`),
  delete: (id: number) => Delete(`/student/${id}`),
};

export const adminAPI = {
  getAll: () => Get("/admins"),
  getById: (id: number) => Get(`/admin/${id}`),
  delete: (id: number) => Delete(`/admin/${id}`),
};

/** ========== Misc (ใช้ axios ตรงเพื่อรักษา signature เหมือนเดิม) ========== */
async function GetGender() {
  return await axios
    .get(`${resolveAPIBase()}/genders`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetUsers() {
  return await axios
    .get(`${resolveAPIBase()}/users`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetStudents() {
  return await axios
    .get(`${resolveAPIBase()}/students`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

/** ========== Payments ========== */
async function GetPayment(studentId?: string) {
  const url = studentId
    ? `${resolveAPIBase()}/payments?studentId=${studentId}`
    : `${resolveAPIBase()}/payments`;

  return await axios
    .get(url, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function ConfirmPayment(id: number) {
  return await axios
    .put(`${resolveAPIBase()}/payments/${id}/confirm`, {}, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function RejectPayment(id: number) {
  return await axios
    .put(`${resolveAPIBase()}/payments/${id}/reject`, {}, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdatePaymentStatus(
  id: number,
  status: "paid" | "pending" | "remaining" | null
) {
  return await axios
    .patch(
      `${resolveAPIBase()}/payments/${id}/status`,
      { status },
      getConfig()
    )
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdatePaymentReceiver(
  id: number,
  receiver_id: number | null
) {
  return await axios
    .patch(
      `${resolveAPIBase()}/payments/${id}/receiver`,
      { receiver_id },
      getConfig()
    )
    .then((res) => res)
    .catch((e) => e.response);
}

export async function AssignReceiverSelf(id: number) {
  return await axios
    .patch(`${resolveAPIBase()}/payments/${id}/receiver/self`, {}, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function CreatePayment(body: {
  student_id: number;
  billing_id: number;
  amount: number;
  method: string;
  payment_date?: string;
  payer_name?: string;
  receipt_number?: string;
  evidence_url?: string;
  status?: "paid" | "pending" | "remaining" | null;
  receiver_id?: number | null;
}) {
  return await axios
    .post(`${resolveAPIBase()}/payments`, body, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdatePaymentMethod(id: number, method: string) {
  return await axios
    .patch(
      `${resolveAPIBase()}/payments/${id}/method`,
      { method },
      getConfig()
    )
    .then((res) => res)
    .catch((e) => e.response);
}

/** ========== Evidence (Upload) ========== */
export async function UploadEvidence(data: any) {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `${tokenType} ${token}`;

  return axios
    .post(`${resolveAPIBase()}/upload`, data, { headers })
    .then((res) => res)
    .catch((e) => e.response ?? { status: 0, data: e });
}

export async function GetLatestEvidencesByStudents(studentIds: number[]) {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `${tokenType} ${token}`;

  const qs = studentIds.join(",");
  return await axios
    .get(
      `${resolveAPIBase()}/evidences/latest-by-students?student_ids=${qs}`,
      { headers }
    )
    .then((res) => res)
    .catch((e) => e.response);
}

/** ========== Contracts ========== */
async function GetContracts(studentId?: string) {
  const url = studentId
    ? `${resolveAPIBase()}/contracts?studentId=${studentId}`
    : `${resolveAPIBase()}/contracts`;

  return await axios
    .get(url, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function RenewContract(
  id: number,
  body: {
    months?: number; // 6 | 12
    start_date?: string; // "YYYY-MM-DD"
    end_date?: string; // "YYYY-MM-DD"
    rate?: number; // ค่าเช่าใหม่ (optional)
  }
) {
  return await axios
    .put(`${resolveAPIBase()}/contracts/${id}/renew`, body, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function RequestRenewContract(
  id: number,
  body: { months?: number; start_date?: string; end_date?: string; rate?: number }
) {
  return await axios
    .put(
      `${resolveAPIBase()}/contracts/${id}/renew-request`,
      body,
      getConfig()
    )
    .then((res) => res)
    .catch((e) => e.response);
}

export async function ApproveRenewContract(id: number) {
  return await axios
    .put(
      `${resolveAPIBase()}/contracts/${id}/renew-approve`,
      {},
      getConfig()
    )
    .then((res) => res)
    .catch((e) => e.response);
}

export async function RejectRenewContract(id: number) {
  return await axios
    .put(
      `${resolveAPIBase()}/contracts/${id}/renew-reject`,
      {},
      getConfig()
    )
    .then((res) => res)
    .catch((e) => e.response);
}

export async function CreateContract(data: ContractInterface) {
  return await axios
    .post(`${resolveAPIBase()}/contracts`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateContractById(
  id: string,
  data: Partial<ContractInterface> & any
) {
  return await axios
    .put(`${resolveAPIBase()}/contracts/${id}`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function DeleteContractById(id: string) {
  return await axios
    .delete(`${resolveAPIBase()}/contracts/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

/** ========== Users CRUD (ผูกกับ student) ========== */
async function GetUsersById(id: string) {
  return await axios
    .get(`${resolveAPIBase()}/student/${id}`, getConfig()) // 🔥 แก้ user → student
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateUsersById(id: string, data: UsersInterface) {
  return await axios
    .put(`${resolveAPIBase()}/student/${id}`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

async function DeleteUsersById(id: string) {
  return await axios
    .delete(`${resolveAPIBase()}/student/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateUser(data: UsersInterface) {
  return await axios
    .post(`${resolveAPIBase()}/signup`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

/** ========== Student CRUD ========== */
async function GetStudentById(id: number) {
  return await axios
    .get(`${resolveAPIBase()}/student/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateStudent(data: StudentInterface) {
  return await axios
    .post(`${resolveAPIBase()}/signup`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateStudentById(id: number, data: StudentInterface) {
  return await axios
    .put(`${resolveAPIBase()}/student/${id}`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

async function DeleteStudentById(id: number) {
  return await axios
    .delete(`${resolveAPIBase()}/student/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

/** ========== Announcements ========== */
async function GetAnnouncements(params?: any) {
  return await axios
    .get(`${resolveAPIBase()}/announcements`, {
      ...getConfig(),
      params,
    })
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateAnnouncement(data: any) {
  return await axios
    .post(`${resolveAPIBase()}/announcements`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateAnnouncementById(id: string, data: any) {
  return await axios
    .put(`${resolveAPIBase()}/announcements/${id}`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

async function DeleteAnnouncementById(id: string) {
  return await axios
    .delete(`${resolveAPIBase()}/announcements/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetAnnouncementById(id: string) {
  return await axios
    .get(`${resolveAPIBase()}/announcements/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

/** ========== Reviews ========== */
export async function GetReviews() {
  return await axios
    .get(`${resolveAPIBase()}/reviews`, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function CreateReview(data: ReviewInterface) {
  return await axios
    .post(`${resolveAPIBase()}/reviews`, data, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function GetReviewById(id: string) {
  return await axios
    .get(`${resolveAPIBase()}/reviews/${id}`, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function UpdateReview(
  id: string,
  data: Partial<ReviewInterface>
) {
  return await axios
    .put(`${resolveAPIBase()}/reviews/${id}`, data, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function DeleteReview(id: string) {
  return await axios
    .delete(`${resolveAPIBase()}/reviews/${id}`, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function GetReviewTopics() {
  return await axios
    .get(`${resolveAPIBase()}/reviewtopics`, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}



/** ========== export misc ========== */
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
  GetAnnouncements,
  CreateAnnouncement,
  UpdateAnnouncementById,
  DeleteAnnouncementById,
  GetAnnouncementById,
};
