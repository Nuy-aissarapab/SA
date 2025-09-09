// ---------------------- imports ----------------------
import axios from "axios";
import type { RoomInterface } from "../../interfaces/Room";
import type { RoomType } from "../../interfaces/RoomType";
import type { StudentInterface } from "../../interfaces/Student";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
    .post(`${apiUrl}/rooms`, data, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetAllRooms() {
  return axios
    .get(`${apiUrl}/rooms`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function DeleteAllRoom(id: number) {
  return axios
    .delete(`${apiUrl}/rooms/${id}`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetRoomById(id: number) {
  return axios
    .get(`${apiUrl}/rooms/${id}`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateAllRoom(id: number, data: RoomInterface) {
  return axios
    .put(`${apiUrl}/rooms/${id}`, data, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function BookRoom(room_id: number, student_id: number) {
  return axios
    .post(
      `${apiUrl}/rooms/book`,
      { room_id, student_id },
      getAuthHeader()
    )
    .then((res) => res)
    .catch((e) => e.response);
}

export async function CancelBooking(room_id: number, student_id: number) {
  return axios
    .post(
      `${apiUrl}/rooms/cancel-booking`,
      { room_id, student_id },
      getAuthHeader()
    )
    .then((res) => res)
    .catch((e) => e.response);
}

// ---------------------- RoomType ----------------------
export async function GetAllRoomTypes() {
  return axios
    .get(`${apiUrl}/room-types`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

// ---------------------- RoomAsset ----------------------
export async function CreateRoomAsset(data: any) {
  return axios.post(`${apiUrl}/room-assets`, data, getAuthHeader());
}

export async function GetAllRoomAssets() {
  return axios
    .get(`${apiUrl}/room-assets`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function DeleteRoomAsset(id: number) {
  return axios
    .delete(`${apiUrl}/room-assets/${id}`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateRoomAsset(id: number, data: any) {
  return axios
    .put(`${apiUrl}/room-assets/${id}`, data, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetRoomAssetById(id: number) {
  return axios
    .get(`${apiUrl}/room-assets/${id}`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetAllAssetTypes() {
  return axios
    .get(`${apiUrl}/asset-types`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

// ---------------------- Student ----------------------
export async function GetStudents() {
  return axios
    .get(`${apiUrl}/students`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetStudentBookingStatus(student_id: number) {
  return axios
    .get(`${apiUrl}/students/${student_id}/booking-status`, getAuthHeader())
    .then((res) => res)
    .catch((e) => e.response);
}
