import { useState, useEffect } from "react";
import {
  Space,
  Table,
  Button,
  Col,
  Row,
  Divider,
  message,
  Modal,
  Input,
  Select,
  Spin,
} from "antd";
import { PlusOutlined, SearchOutlined, HomeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, Link } from "react-router-dom";
import dayjs from "dayjs";
import "./room.css";

import type { RoomInterface } from "../../interfaces/Room";
import type { RoomType } from "../../interfaces/RoomType";

import {
  GetAllRooms,
  DeleteAllRoom,
  GetAllRoomTypes,
  BookRoom,
  CancelBooking,
} from "../../Service/https/index";

const { Option } = Select;


// ---- Helpers ----
const getRoomNumber = (r: RoomInterface) => r.RoomNumber;
const getStatus = (r: RoomInterface) => r.Status;
const getUpdated = (r: RoomInterface) => r.UpdatedAt;
const getStudentIdOfRoom = (r: RoomInterface) => r.StudentID;

function RoomPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomInterface[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const [roomNumberFilter, setRoomNumberFilter] = useState<string>("");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  const myId = Number(localStorage.getItem("id"));

  // ---- Loaders ----
  const getRooms = async () => {
    setLoading(true);
    try {
      const res = await GetAllRooms();
      console.log("🔥 DEBUG GetAllRooms:", res);

      // ถ้า res เป็น array → ใช้เลย
      // ถ้า res เป็น object ที่มี data (เวลา error) → ใช้ res.data
      const roomsArray = Array.isArray(res) ? res : res?.data ?? [];

      if (Array.isArray(roomsArray) && roomsArray.length > 0) {
        setRooms(roomsArray);
        setFilteredRooms(roomsArray);
      } else {
        setRooms([]);
        setFilteredRooms([]);
        messageApi.error(
          res?.error || res?.data?.error || "ไม่พบข้อมูลห้อง"
        );
      }
    } catch (error) {
      console.error("getRooms error:", error);
      setRooms([]);
      setFilteredRooms([]);
      messageApi.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const getRoomTypes = async () => {
    try {
      const data = await GetAllRoomTypes();
      console.log("🔥 DEBUG roomTypes:", data);

      if (Array.isArray(data)) {
        setRoomTypes(data);
      } else {
        setRoomTypes([]);
        messageApi.error("ไม่สามารถโหลดประเภทห้องได้");
      }
    } catch {
      setRoomTypes([]);
      messageApi.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    }
  };


  useEffect(() => {
    if (!localStorage.getItem("id")) {
      localStorage.setItem("id", "5"); // สมมติให้มี id ไว้ทดสอบ
    }
    getRooms();
    getRoomTypes();
  }, []);

  // ---- Delete ----
  const deleteRoom = async (roomId: number) => {
    setLoading(true);
    try {
      const res = await DeleteAllRoom(roomId);
      if (res?.status === 200) {
        setRooms((prev) => prev.filter((r) => r.ID !== roomId));
        setFilteredRooms((prev) => prev.filter((r) => r.ID !== roomId));
        messageApi.success("ลบห้องสำเร็จ");
      } else {
        messageApi.error(res?.data?.error || "ลบห้องไม่สำเร็จ");
      }
    } catch (err) {
      console.error("deleteRoom error:", err);
      messageApi.error("ลบห้องไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (roomId?: number, roomNumber?: string) => {
    if (!roomId) {
      return messageApi.error("ไม่พบ ID ของห้อง");
    }
    modal.confirm({
      title: "ยืนยันการลบ",
      content: `ลบข้อมูลห้องหมายเลข ${roomNumber} หรือไม่?`,
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: () => deleteRoom(roomId),
    });
  };


  // ---- Filter ----
  const filterRooms = (roomNumber: string, roomType?: string) => {
    let result = rooms;
    const kw = roomNumber.trim();

    if (kw) {
      result = result.filter((r) => getRoomNumber(r).startsWith(kw));
    }
    if (roomType) {
      result = result.filter((r) => r.RoomType?.RoomTypeName === roomType);
    }
    setFilteredRooms(result);
  };

  const handleSearch = () => filterRooms(roomNumberFilter, roomTypeFilter);

  // ---- Booking ----
  const handleBookRoom = async (roomID: number) => {
    const studentID = Number(localStorage.getItem("id"));
    if (!studentID) return messageApi.error("กรุณาเข้าสู่ระบบใหม่");
    try {
      const res = await BookRoom(roomID, studentID);
      if (res?.status === 200) {
        messageApi.success("จองห้องสำเร็จ");
        await getRooms();
      } else {
        messageApi.error(res?.data?.error || "จองห้องไม่สำเร็จ");
      }
    } catch (e) {
      console.error("handleBookRoom error:", e);
      messageApi.error("เกิดข้อผิดพลาดในการจองห้อง");
    }
  };

  const confirmBookRoom = (roomID: number) =>
    modal.confirm({
      title: "ยืนยันการจอง",
      content: "คุณต้องการจองห้องนี้หรือไม่?",
      okText: "จอง",
      cancelText: "ยกเลิก",
      onOk: () => handleBookRoom(roomID),
    });

  const handleCancelBooking = async (roomID: number) => {
    const studentID = Number(localStorage.getItem("id"));
    if (!studentID) return messageApi.error("กรุณาเข้าสู่ระบบใหม่");
    setLoading(true);
    try {
      const res = await CancelBooking(roomID, studentID); // ← ส่งทั้ง 2 ค่า
      if (res?.status === 200) {
        messageApi.success("ยกเลิกการจองสำเร็จ");
        await getRooms();
      } else {
        messageApi.error(res?.data?.error || "ยกเลิกการจองไม่สำเร็จ");
      }
    } catch (err) {
      console.error("handleCancelBooking error:", err);
      messageApi.error("เกิดข้อผิดพลาดในการยกเลิกการจอง");
    } finally {
      setLoading(false);
    }
  };


  const confirmCancelBooking = (roomID: number) =>
    modal.confirm({
      title: "ยืนยันการยกเลิกการจอง",
      content: "คุณต้องการยกเลิกการจองห้องนี้หรือไม่?",
      okText: "ยกเลิก",
      cancelText: "ไม่",
      onOk: () => handleCancelBooking(roomID),
    });

  // ---- Booking status ----
  const [bookingStatus] = useState<{ status: string; room?: string } | null>(null);

  // ---- Columns ----
  const columnsAdmin: ColumnsType<RoomInterface> = [
    {
      title: "เลขห้อง",
      key: "room_number",
      align: "center",
      render: (_, r) => getRoomNumber(r),
    },
    {
      title: "ประเภท",
      key: "RoomTypeName",
      align: "center",
      render: (_, r) => r.RoomType?.RoomTypeName ?? "-",
    },
    {
      title: "สถานะ",
      key: "room_status",
      align: "center",
      render: (_, r) => {
        const s = getStatus(r);
        const isVacant = s === "ว่าง" || s.toLowerCase() === "vacant";
        return (
          <span style={{ color: isVacant ? "#52c41a" : "#f5222d", fontWeight: 600 }}>
            {s || "-"}
          </span>
        );
      },
    },
    {
      title: "ราคา (บาท)",
      key: "RentalPrice",
      align: "center",
      render: (_, r) =>
        r.RoomType?.RentalPrice !== undefined
          ? r.RoomType.RentalPrice.toLocaleString()
          : "-",
    },
    {
      title: "แก้ไขล่าสุด",
      key: "LastUpdate",
      align: "center",
      render: (_, r) =>
        getUpdated(r) ? dayjs(getUpdated(r)).format("DD/MM/YYYY") : "-",
    },
    {
      title: "ผู้ดูแล",
      key: "admin",
      align: "center",
      render: (_, r) =>
        r.Admin ? `${r.Admin.first_name ?? ""} ${r.Admin.last_name ?? ""}`.trim() : "-",
    },
    {
      title: "แก้ไข",
      key: "edit",
      align: "center",
      render: (_, r) => (
        <Button onClick={() => navigate(`/Room/RoomEdit/${r.ID}`)}>แก้ไข</Button>
      ),
    },
    {
      title: "ลบ",
      key: "delete",
      align: "center",
      render: (_, r) => (
        <Button danger onClick={() => confirmDelete(r.ID!, getRoomNumber(r))}>ลบ</Button>
      ),
    },
  ];

  const columnsUser: ColumnsType<RoomInterface> = [
    {
      title: "เลขห้อง",
      key: "room_number",
      align: "center",
      render: (_, r) => getRoomNumber(r),
    },
    {
      title: "ประเภท",
      key: "RoomTypeName",
      align: "center",
      render: (_, r) => r.RoomType?.RoomTypeName ?? "-",
    },
    {
      title: "สถานะ",
      key: "room_status",
      align: "center",
      render: (_, r) => {
        const isBookedByMe = getStudentIdOfRoom(r) === myId;
        const raw = getStatus(r);
        const statusToShow = isBookedByMe ? "ไม่ว่าง" : raw;
        const isVacant = statusToShow === "ว่าง" || statusToShow.toLowerCase() === "vacant";
        return (
          <span style={{ color: isVacant ? "#52c41a" : "#f5222d", fontWeight: 600 }}>
            {statusToShow}
          </span>
        );
      },
    },
    {
      title: "ราคา",
      key: "RentalPrice",
      align: "center",
      render: (_, r) =>
        r.RoomType?.RentalPrice !== undefined
          ? r.RoomType.RentalPrice.toLocaleString()
          : "-",
    },
    {
      title: "ดำเนินการ",
      key: "action",
      align: "center",
      render: (_, r) => {
        const isBookedByMe = getStudentIdOfRoom(r) === myId;
        const isAvailable = (() => {
          const s = getStatus(r);
          return s === "ว่าง" || s.toLowerCase() === "vacant";
        })();
        return (
          <Space>
            <Button type="link" onClick={() => navigate(`/Room/RoomDetail/${r.ID}`)}>
              ดูรายละเอียด
            </Button>
            {isBookedByMe ? (
              <Button danger onClick={() => confirmCancelBooking(r.ID!)}>ยกเลิกการจอง</Button>
            ) : isAvailable ? (
              <Button type="primary" onClick={() => confirmBookRoom(r.ID!)}>จอง</Button>
            ) : (
              <Button type="dashed" disabled>ไม่ว่าง</Button>
            )}
          </Space>
        );
      },
    },
  ];

  // ---- Role ----
  const role = localStorage.getItem("role") || "user";

  return (
    <>
      {contextHolder}
      {modalContextHolder}
      {role === "admin" ? (
        <>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Space>
                <HomeOutlined style={{ fontSize: 24 }} />
                <h2>Admin Portal - ห้องพัก</h2>
              </Space>
            </Col>
            <Col>
              <Space>
                <Input
                  placeholder="หมายเลขห้อง"
                  value={roomNumberFilter}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRoomNumberFilter(value);
                    filterRooms(value, roomTypeFilter);
                  }}
                  suffix={<SearchOutlined />}
                />
                <Select
                  placeholder="ประเภท"
                  value={roomTypeFilter}
                  onChange={(value) => {
                    setRoomTypeFilter(value);
                    filterRooms(roomNumberFilter, value);
                  }}
                  allowClear
                  style={{ width: 180 }}
                >
                  {roomTypes.map((rt) => (
                    <Option key={rt.ID} value={rt.RoomTypeName}>
                      {rt.RoomTypeName}
                    </Option>
                  ))}
                </Select>
                <Button onClick={handleSearch}>ค้นหา</Button>
                <Link to="/Room/CreateRoom">
                  <Button type="primary" icon={<PlusOutlined />}>เพิ่มห้อง</Button>
                </Link>
              </Space>
            </Col>
          </Row>
          <Divider />
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin />
            </div>
          ) : (
            <Table
              rowKey={(r) => String(r?.ID ?? getRoomNumber(r) ?? Math.random())}
              columns={columnsAdmin}
              dataSource={filteredRooms}
              pagination={{ pageSize: 10 }}
            />
          )}
        </>
      ) : (
        <>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Space align="center" style={{ marginBottom: 16 }}>
                <HomeOutlined style={{ fontSize: 24 }} />
                <h2>User Portal - ห้องพัก</h2>
              </Space>
            </Col>
            <Col>
              <Space>
                <Input
                  placeholder="หมายเลขห้อง"
                  value={roomNumberFilter}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRoomNumberFilter(value);
                    filterRooms(value, roomTypeFilter);
                  }}
                  suffix={<SearchOutlined />}
                />
                <Select
                  placeholder="ประเภท"
                  value={roomTypeFilter}
                  onChange={(value) => {
                    setRoomTypeFilter(value);
                    filterRooms(roomNumberFilter, value);
                  }}
                  allowClear
                  style={{ width: 180 }}
                >
                  {roomTypes.map((rt) => (
                    <Option key={rt.ID} value={rt.RoomTypeName}>
                      {rt.RoomTypeName}
                    </Option>
                  ))}
                </Select>
                <Button onClick={handleSearch}>ค้นหา</Button>
              </Space>
            </Col>
          </Row>

          {bookingStatus && (
            <div style={{ marginBottom: 16, fontWeight: 600 }}>
              สถานะของคุณ:{" "}
              <span style={{ color: bookingStatus.status === "ว่าง" ? "#52c41a" : "#f5222d" }}>
                {bookingStatus.status}
              </span>
              {bookingStatus.room && ` (ห้อง: ${bookingStatus.room})`}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin />
            </div>
          ) : (
            <Table
              rowKey={(r) => String(r?.ID ?? getRoomNumber(r) ?? Math.random())}
              columns={columnsUser}
              dataSource={filteredRooms}
              pagination={{ pageSize: 10 }}
            />
          )}
        </>
      )}
    </>
  );
}

export default RoomPage; 