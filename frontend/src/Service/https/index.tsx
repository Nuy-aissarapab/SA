import type { UsersInterface } from "../../interfaces/IUser";
import type { SignInInterface } from "../../interfaces/SignIn"; // (not used here but kept for parity)
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
import type { MaintenanceInterface } from "../../interfaces/Maintenance";
import type { CreateAnnouncementRequest } from "../../interfaces/CreateAnnouncementRequest";
import type { RoomInterface } from "../../interfaces/Room";
import type { CreateMeterPayload } from "../../interfaces/Meter";

import type { UpdateMeterPayload } from "../../interfaces/Meter";

import axios, { AxiosError } from "axios";

import type { AxiosResponse } from "axios";

// =============================
// Base URL & shared config
// =============================
export const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000";

const getConfig = () => {
  // อ่าน token สดทุกครั้ง
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `${tokenType} ${token}`;

  return { headers };
};

const getConfigWithoutAuth = () => ({
  headers: { "Content-Type": "application/json" },
});

// =============================
// Low-level helpers (POST/GET/PUT/PATCH/DELETE)
// =============================
export const Post = async (
  url: string,
  data: any,
  requireAuth: boolean = true
) => {
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

export const Update = async (url: string, data: any, requireAuth = true) => {
  const config = requireAuth ? getConfig() : getConfigWithoutAuth();
  try {
    const res = await axios.put(`${API_URL}${url}`, data, config);
    return res; // สำคัญ: คืน AxiosResponse
  } catch (error: any) {
    return error.response ?? { status: 500, data: { error: "Unexpected error" } };
  }
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

// =============================
// Auth APIs
// =============================
export const authAPI = {
  // Student
  studentSignup: (data: CreateStudentRequest) =>
    Post("/student/signup", { email: data.Email, password: data.Password }, false),
  studentLogin: (data: LoginStudentRequest) => Post("/student/auth", data, false),

  // Admin
  adminSignup: (data: CreateAdminRequest) => Post("/admin/signup", data, false),
  adminLogin: (data: LoginAdminRequest) => Post("/admin/auth", data, false),
};

// =============================
// Student APIs (object style)
// =============================
export const student = {
  getAll: () => Get("/students"),
  getById: (id: number) => Get(`/student/${id}`),
  delete: (id: number) => Delete(`/student/${id}`),
};

// =============================
// Admin APIs (object style)
// =============================
export const adminAPI = {
  getAll: () => Get("/admins"),
  getById: (id: number) => Get(`/admin/${id}`),
  delete: (id: number) => Delete(`/admin/${id}`),
};

// =============================
// Gender
// =============================
export async function GetGender() {
  return await axios
    .get(`${API_URL}/genders`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

// =============================
// Users
// =============================
export async function GetUsers() {
  return await axios
    .get(`${API_URL}/users`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

// =============================
// Students (direct endpoints used elsewhere)
// =============================
export async function GetStudents() {
  return await axios
    .get(`${API_URL}/students`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetUsersById(id: string) {
  return await axios
    .get(`${API_URL}/student/${id}`, getConfig()) // user → student
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateUsersById(id: string, data: UsersInterface) {
  return await axios
    .put(`${API_URL}/student/${id}`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function DeleteUsersById(id: string) {
  return await axios
    .delete(`${API_URL}/student/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function CreateUser(data: UsersInterface) {
  return await axios
    .post(`${API_URL}/signup`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetStudentById(id: number) {
  return await axios
    .get(`${API_URL}/student/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function CreateStudent(data: any) {
  return await axios
    .post(`${API_URL}/student/signup`, data, getConfigWithoutAuth())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateStudentById(id: number, data: StudentInterface) {
  return await axios
    .put(`${API_URL}/student/${id}`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function DeleteStudentById(id: number) {
  return await axios
    .delete(`${API_URL}/student/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function ChangeStudentPassword(id: number, password: string) {
  return await axios
    .put(`${API_URL}/student/${id}/password`, { password }, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

// =============================
// Payments & Evidences
// =============================
export async function GetPayment(studentId?: string) {
  const url = studentId
    ? `${API_URL}/payments?studentId=${studentId}`
    : `${API_URL}/payments`;

  return await axios
    .get(url, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UploadEvidence(data: any) {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `${tokenType} ${token}`;

  return axios
    .post(`${API_URL}/upload`, data, { headers })
    .then((res) => res)
    .catch((e) => e.response ?? { status: 0, data: e });
}

export async function GetLatestEvidencesByStudents(studentIds: number[]) {
  const headers = getConfig().headers;
  const qs = studentIds.join(",");
  return await axios
    .get(`${API_URL}/evidences/latest-by-students?student_ids=${qs}`, { headers })
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetLatestEvidencesByStudent(
  studentId: number
): Promise<AxiosResponse<any>> {
  const headers = getConfig().headers;
  const base = (API_URL || "").replace(/\/+$/, "");
  const url = `${base}/evidences/latest?student_id=${encodeURIComponent(String(studentId))}`;

  try {
    const res = await axios.get(url, { headers });
    return res;
  } catch (e: any) {
    return (
      e?.response ?? {
        status: 500,
        statusText: "Network Error",
        headers: {},
        config: {},
        data: { error: "Network error" },
      }
    );
  }
}

export function normalizeWebPath(p?: string): string | undefined {
  if (!p) return undefined;
  const s = p.replace(/\\/g, "/").trim();
  if (/^https?:\/\//i.test(s)) return s; // absolute
  return "/" + s.replace(/^\/+/, "");
}

export function evidenceToImgSrc(ev?: {
  url?: string;
  address?: string;
  mime_type?: string;
}): string | undefined {
  if (!ev) return undefined;
  if (ev.url) return ev.url;
  return normalizeWebPath(ev.address);
}

export async function ConfirmPayment(id: number) {
  return await axios
    .put(`${API_URL}/payments/${id}/confirm`, {}, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function RejectPayment(id: number) {
  return await axios
    .put(`${API_URL}/payments/${id}/reject`, {}, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetEvidenceByID(id: number) {
  return await axios
    .get(`${API_URL}/evidences/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateEvidence(id: number, data: any) {
  return await axios
    .put(`${API_URL}/evidences/${id}`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetEvidencesByPaymentId(pid: number) {
  return await axios
    .get(`${API_URL}/evidences?payment_id=${pid}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdatePaymentStatus(
  id: number,
  status: "paid" | "pending" | "remaining" | null
) {
  return await axios
    .patch(`${API_URL}/payments/${id}/status`, { status }, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdatePaymentReceiver(id: number, receiver_id: number | null) {
  return await axios
    .patch(`${API_URL}/payments/${id}/receiver`, { receiver_id }, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function AssignReceiverSelf(id: number) {
  return await axios
    .patch(`${API_URL}/payments/${id}/receiver/self`, {}, getConfig())
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
    .post(`${API_URL}/payments`, body, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdatePaymentMethod(id: number, method: string) {
  return await axios
    .patch(`${API_URL}/payments/${id}/method`, { method }, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

// =============================
// Contracts
// =============================
export async function GetContracts(studentId?: string) {
  const url = studentId
    ? `${API_URL}/contracts?studentId=${studentId}`
    : `${API_URL}/contracts`;

  return await axios
    .get(url, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function RenewContract(
  id: number,
  body: {
    months?: number; // 6 | 12
    start_date?: string; // YYYY-MM-DD
    end_date?: string; // YYYY-MM-DD
    rate?: number; // ค่าเช่าใหม่ (optional)
  }
) {
  return await axios
    .put(`${API_URL}/contracts/${id}/renew`, body, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function RequestRenewContract(
  id: number,
  body: { months?: number; start_date?: string; end_date?: string; rate?: number }
) {
  return await axios
    .put(`${API_URL}/contracts/${id}/renew-request`, body, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function ApproveRenewContract(id: number) {
  return await axios
    .put(`${API_URL}/contracts/${id}/renew-approve`, {}, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function RejectRenewContract(id: number) {
  return await axios
    .put(`${API_URL}/contracts/${id}/renew-reject`, {}, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function CreateContract(data: ContractInterface) {
  return await axios
    .post(`${API_URL}/contracts`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateContractById(
  id: string,
  data: Partial<ContractInterface> & any
) {
  return await axios
    .put(`${API_URL}/contracts/${id}`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function DeleteContractById(id: string) {
  return await axios
    .delete(`${API_URL}/contracts/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetRooms() {
  try {
    const res = await axios.get(`${API_URL}/rooms`, getConfig());
    const items = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    return { status: res.status, data: items };
  } catch (e: any) {
    return e?.response ?? { status: 500, data: { error: "network error" } };
  }
}

// =============================
// Announcements
// =============================
export async function GetAnnouncements() {
  return await axios
    .get(`${API_URL}/announcements`, getConfig())
    .then((res) => res)
    .catch((e) => e?.response);
}

export async function CreateAnnouncement(data: CreateAnnouncementRequest) {
  return await axios
    .post(`${API_URL}/announcements`, data, getConfig())
    .then((res) => res)
    .catch((e) => e?.response);
}

export interface UpdateAnnouncementRequest {
  Title?: string;
  Content?: string;
  Picture?: string | null;
  AnnouncementTargetID?: number;
  AnnouncementTypeID?: number;
  AdminID?: number;
}

export async function UpdateAnnouncementById(
  id: string | number,
  data: UpdateAnnouncementRequest
) {
  return await axios
    .patch(`${API_URL}/announcements/${id}`, data, getConfig())
    .then((res) => res)
    .catch((e) => e?.response);
}

export async function DeleteAnnouncementById(id: string | number) {
  return await axios
    .delete(`${API_URL}/announcements/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetAnnouncementById(id: string | number) {
  return await axios
    .get(`${API_URL}/announcements/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e?.response);
}

// Announcement Target Service
export async function CreateAnnouncementTarget(data: any) {
  return await axios
    .post(`${API_URL}/announcement-targets`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetAnnouncementTarget(id: string) {
  return await axios
    .get(`${API_URL}/announcement-targets/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function ListAnnouncementTargets() {
  return await axios
    .get(`${API_URL}/announcement-targets`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

// Announcement Type Service
export async function CreateAnnouncementType(data: any) {
  return await axios
    .post(`${API_URL}/announcement-types`, data, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetAnnouncementType(id: string) {
  return await axios
    .get(`${API_URL}/announcement-types/${id}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function ListAnnouncementTypes() {
  return await axios
    .get(`${API_URL}/announcement-types`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

// =============================
// Reviews
// =============================
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
  return await axios
    .get(`${API_URL}/reviewtopics`, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

// =============================
// Maintenance
// =============================
export async function GetProblemTypes() {
  return axios
    .get(`${API_URL}/problem-types`, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function GetMaintenanceStatuses() {
  return axios
    .get(`${API_URL}/maintenance-statuses`, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function GetMaintenances(params?: any) {
  return axios
    .get(`${API_URL}/maintenances`, { ...getConfig(), params })
    .then((r) => r)
    .catch((e) => e.response);
}

export async function GetMyMaintenances() {
  return axios
    .get(`${API_URL}/maintenances`, { ...getConfig(), params: { myOnly: 1 } })
    .then((r) => r)
    .catch((e) => e.response);
}

export async function GetMaintenanceById(id: number) {
  return axios
    .get(`${API_URL}/maintenance/${id}`, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function CreateMaintenance(body: any) {
  // JSON
  return axios
    .post(`${API_URL}/maintenances`, body, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function UpdateMaintenance(id: number, body: any) {
  // JSON
  return axios
    .put(`${API_URL}/maintenance/${id}`, body, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function UpdateMaintenanceStatus(
  id: number,
  body: { maintenance_status_id: number }
) {
  return axios
    .patch(`${API_URL}/maintenance/${id}/status`, body, getConfig())
    .then((r) => r)
    .catch((e) => e.response);
}

export async function DeleteMaintenance(id: number) {
  return axios
    .delete(`${API_URL}/maintenance/${id}`, getConfig()) // เอกพจน์
    .then((r) => r)
    .catch((e) => e.response);
}


// =============================
// Rooms
// =============================
// Header สำหรับ auth
const getAuthHeader = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `${localStorage.getItem("token_type")} ${localStorage.getItem("token")}`,
  },
});

// ---------------------- Room ----------------------
export async function PostAllRooms(data: RoomInterface) {
  return axios
    .post(`${API_URL}/rooms`, data, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetAllRooms() {
  return axios
    .get(`${API_URL}/room`, getAuthHeader())
    .then((res) => res.data)
    .catch((e) => e.response);
}

export async function DeleteAllRoom(id: number) {
  return axios
    .delete(`${API_URL}/rooms/${id}`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetRoomById(id: number) {
  return axios
    .get(`${API_URL}/rooms/${id}`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateAllRoom(id: number, data: any) {
  return axios
    .put(`${API_URL}/rooms/${id}`, data, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function BookRoom(room_id: number, student_id: number) {
  return axios
    .post(
      `${API_URL}/rooms/book`,
      { room_id, student_id },
      getAuthHeader()
    )
    .then((res) => res)
    .catch((e) => e.response);
}

export async function CancelBooking(room_id: number, student_id: number) {
  return axios
    .post(`${API_URL}/rooms/cancel-booking`, { room_id, student_id }, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}


// ---------------------- RoomType ----------------------
export async function GetAllRoomTypes() {
  return axios
    .get(`${API_URL}/room-types`, getAuthHeader())
    .then((res) => res.data)
    .catch((e) => e.response);
}

// ---------------------- RoomAsset ----------------------
export async function CreateRoomAsset(data: any) {
  return axios.post(`${API_URL}/room-assets`, data, getAuthHeader());
}

export async function GetAllRoomAssets() {
  return axios
    .get(`${API_URL}/room-assets`, getAuthHeader())
    .then((res) => res.data)
    .catch((e) => e.response);
}

export async function DeleteRoomAsset(id: number) {
  return axios
    .delete(`${API_URL}/room-assets/${id}`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateRoomAsset(id: number, data: any) {
  return axios
    .put(`${API_URL}/room-assets/${id}`, data, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetRoomAssetById(id: number) {
  return axios
    .get(`${API_URL}/room-assets/${id}`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetAllAssetTypes() {
  try {
    const res = await axios.get(`${API_URL}/asset-types`, getAuthHeader());
    return { status: res.status, data: res.data }; // ✅ คืนทั้ง status + data
  } catch (e: any) {
    return e?.response ?? { status: 500, data: [] };
  }
}

// =============================
// Meter
// =============================

export async function GetRoomByMeter() {
  return await axios
    .get(`${API_URL}/room/meter`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function Getmeter() {
  return await axios
    .get(`${API_URL}/meter`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}


export async function CreateMeter(payload: CreateMeterPayload) {
  return await axios
    .post(`${API_URL}/meter`, payload, getConfig()) // เปลี่ยนจาก /reviews -> /meter
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetMeterByRoom(room_id: string | undefined) {
  if (!room_id) return { status: 400, data: { error: "room_id is required" } };

  return await axios
    .get(`${API_URL}/meter/${room_id}`, getConfig())
  .then(res => res)
  .catch(e => e.response);
}

export async function GetMeterType() {
  return await axios
    .get(`${API_URL}/metertype`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function DeleteMeter(id: string) {
  try {
    const res = await axios.delete(`${API_URL}/meter/${id}`, getConfig());
    return res; // res.status, res.data
  } catch (error: any) {
    // ถ้า axios error, คืน response หรือ object default
    return error.response ?? { status: 500, data: { error: "เกิดข้อผิดพลาด" } };
  }
}



export async function UpdateMeter(id: string, payload: UpdateMeterPayload) {
  try {
    const res = await axios.put(`${API_URL}/meter/${id}`, payload, getConfig());
    return res;
  } catch (error: any) {
    return error.response ?? { status: 500, data: { error: "เกิดข้อผิดพลาด" } };
  }
}

export async function GetMeterById(id: string) {
  try {
    const res = await axios.get(`${API_URL}/meter/${id}`, getConfig());
    return res; // res.status, res.data (object มิเตอร์เดี่ยว)
  } catch (error: any) {
    return error.response ?? { status: 500, data: { error: "เกิดข้อผิดพลาด" } };
  }
}

export async function GetRoomByBill() {
  return await axios
    .get(`${API_URL}/room/bill`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

// Service/https/index.ts
export async function GetBillByRoom(room_id: string) {
  return await axios
    .get(`${API_URL}/bill/room/${room_id}`, getConfig()) // <-- เพิ่ม "room/" ให้ตรงกับ backend
    .then((res) => res)
    .catch((e) => e.response);
}

export async function DeleteBill(billId: string) {
  return await axios
    .delete(`${API_URL}/bill/${billId}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetBillItemsByBillId(billId: string) {
  return await axios
    .get(`${API_URL}/billitem/${billId}`, getConfig())
    .then((res) => res)
    .catch((e) => e.response);
}

interface CreateBillPayload {
  room_id: number;
  due_date: string;
}

export async function CreateBill(payload: CreateBillPayload) {
  return await axios.post(`${API_URL}/bill`, payload, getConfig())
    .then(res => res)
    .catch(e => e.response);
}


interface PreviewBillItemsRequest {
  room_id: number;
  dueDate: string;
}

export async function PreviewBillItems(params: PreviewBillItemsRequest) {
  return await axios
    .get(`${API_URL}/bill/${params.room_id}/preview-items`, {
      ...getConfig(),
      params: { dueDate: params.dueDate } // ส่งเป็น query string
    })
    .then(res => res)
    .catch(e => e.response);
}



export async function PreviewBill(room_id: string) {
  return await axios
    .get(`${API_URL}/bill/${room_id}/preview`, getConfig())
    .then(res => res)
    .catch(e => e.response);
}

export const GetLastMeterRecord = async (roomId: number, meterTypeId: number) => {
  return axios.get(`/meter/last`, {
    params: { room_id: roomId, meter_type_id: meterTypeId },
  });
};

// ---------------------- Student ----------------------

// export async function GetStudentBookingStatus(student_id: number) {
//   return axios
//     .get(`${API_URL}/students/${student_id}/booking-status`, getAuthHeader())
//     .then((res) => res)
//     .catch((e) => e.response);
// }
