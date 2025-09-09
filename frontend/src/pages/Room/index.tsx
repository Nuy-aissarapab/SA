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
import {
  PlusOutlined,
  SearchOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, Link } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios"; // <-- เพิ่ม import axios
import "./room.css";

import type { Room } from "../../interfaces/Room";
import type { RoomType } from "../../interfaces/RoomType";
import {
  GetAllRooms,
  DeleteAllRoom,
  GetAllRoomTypes,
  BookRoom,
  CancelBooking,
  GetStudentBookingStatus,
} from "../../Service/https/index";

// กำหนด apiUrl ให้ถูกต้อง (แก้ตามของคุณ)
const apiUrl = "http://your-api-url.com"; // <-- แก้ให้ตรงกับ API จริง

const { Option } = Select;

function RoomPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const [roomNumberFilter, setRoomNumberFilter] = useState<string>("");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

 const myId = Number(localStorage.getItem("id"));

  const getRooms = async () => {
    setLoading(true);
    try {
      const res = await GetAllRooms();
      if (res.status === 200) {
        setRooms(res.data);
        setFilteredRooms(res.data);
      } else {
        setRooms([]);
        setFilteredRooms([]);
        messageApi.open({
          type: "error",
          content: res.data.error || "เกิดข้อผิดพลาดในการดึงข้อมูล",
        });
      }
    } catch (error) {
      setRooms([]);
      setFilteredRooms([]);
      messageApi.open({
        type: "error",
        content: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoomTypes = async () => {
    try {
      const res = await GetAllRoomTypes();
      if (res.status === 200) {
        setRoomTypes(res.data);
      } else {
        setRoomTypes([]);
        messageApi.error("ไม่สามารถโหลดประเภทห้องได้");
      }
    } catch {
      setRoomTypes([]);
      messageApi.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("id")) { //สมมติบัญชีlogin
      localStorage.setItem("id", "5");
    }
    getRooms();
    getRoomTypes();
    fetchBookingStatus();
  }, []);

  const deleteRoom = async (roomId: number) => {
    setLoading(true);
    try {
      const res = await DeleteAllRoom(roomId);
      if (res.status === 200) {
        setRooms((prev) => prev.filter((r) => r.ID !== roomId));
        setFilteredRooms((prev) => prev.filter((r) => r.ID !== roomId));
        messageApi.success(`ลบห้องสำเร็จ`);
      } else {
        messageApi.error(`ลบห้องไม่สำเร็จ`);
      }
    } catch {
      messageApi.error(`ลบห้องไม่สำเร็จ`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (roomId: number, roomNumber: string) => {
    modal.confirm({
      title: "ยืนยันการลบ",
      content: `ลบข้อมูลห้องหมายเลข ${roomNumber} หรือไม่?`,
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: () => deleteRoom(roomId),
    });
  };

  const filterRooms = (roomNumber: string, roomType?: string) => {
    let result = rooms;

    if (roomNumber.trim()) {
      result = result.filter((r) =>
        r.room_number.includes(roomNumber.trim())
      );
    }

    if (roomType) {
      result = result.filter(
        (r) => r.RoomType?.RoomTypeName === roomType
      );
    }

    setFilteredRooms(result);
  };

  const handleSearch = () => {
    filterRooms(roomNumberFilter, roomTypeFilter);
  };

  // ฟังก์ชันสำหรับกด "จองห้อง"
  const handleBookRoom = async (roomID: number) => {
    const studentID = Number(localStorage.getItem("id"));
    if (!studentID) {
      messageApi.error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    try {
      const res = await BookRoom(roomID, studentID);
      if (res.status === 200) {
        messageApi.success("จองห้องสำเร็จ");
        getRooms();
        await fetchBookingStatus();  
      } else {
        messageApi.error("จองห้องไม่สำเร็จ: " + res.data?.error);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะจองห้อง:", error);
      messageApi.error("เกิดข้อผิดพลาดในการจองห้อง");
    }
  };

  const confirmBookRoom = (roomID: number) => {
    modal.confirm({
      title: "ยืนยันการจอง",
      content: "คุณต้องการจองห้องนี้หรือไม่?",
      okText: "จอง",
      cancelText: "ยกเลิก",
      onOk: () => handleBookRoom(roomID),
    });
  };

  // ฟังก์ชันสำหรับยกเลิกการจอง (แก้ไขให้ใช้ studentID และ roomID)
  const handleCancelBooking = async (roomID: number) => {
    const studentID = Number(localStorage.getItem("id"));
    if (!studentID) {
      messageApi.error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    setLoading(true);
    try {
      // สมมติ API ต้องส่ง studentID กับ roomID
      const res = await CancelBooking(roomID, studentID);
      if (res.status === 200) {
        messageApi.success("ยกเลิกการจองสำเร็จ");
        getRooms();
        await fetchBookingStatus();  
      } else {
        messageApi.error("ยกเลิกการจองไม่สำเร็จ");
      }
    } catch {
      messageApi.error("เกิดข้อผิดพลาดในการยกเลิกการจอง");
    } finally {
      setLoading(false);
    }
  };
  const [bookingStatus, setBookingStatus] = useState<{
  status: string;
  room?: string;
} | null>(null);

const fetchBookingStatus = async () => {
  const studentID = Number(localStorage.getItem("id"));
  if (!studentID) return;
  try {
    const res = await GetStudentBookingStatus(studentID);
    if (res.status === 200) {
      setBookingStatus(res.data);
    }
  } catch (error) {
    console.error("Error fetching booking status:", error);
  }
};


  const confirmCancelBooking = (roomID: number) => {
    modal.confirm({
      title: "ยืนยันการยกเลิกการจอง",
      content: "คุณต้องการยกเลิกการจองห้องนี้หรือไม่?",
      okText: "ยกเลิก",
      cancelText: "ไม่",
      onOk: () => handleCancelBooking(roomID),
    });
  };

  const columnsAdmin: ColumnsType<Room> = [
    {
      title: "เลขห้อง",
      dataIndex: "room_number",
      key: "room_number",
      align: "center",
    },
    {
      title: "ประเภท",
      key: "RoomTypeName",
      align: "center",
      render: (_, record) => record.RoomType?.RoomTypeName ?? "-",
    },
    {
      title: "สถานะ",
      dataIndex: "room_status",
      key: "room_status",
      align: "center",
      render: (status: string) => (
        <span
          style={{
            color: status === "ว่าง" || status === "ว่าง" ? "#52c41a" : "#f5222d",
            fontWeight: 600,
          }}
        >
          {status}
        </span>
      ),
    },
    {
      title: "ราคา (บาท)",
      key: "RentalPrice",
      align: "center",
      render: (_, record) =>
        record.RoomType?.RentalPrice
          ? `${record.RoomType.RentalPrice.toLocaleString()}`
          : "-",
    },
    {
      title: "แก้ไขล่าสุด",
      dataIndex: "LastUpdate",
      key: "LastUpdate",
      align: "center",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "ผู้ดูแล",
      key: "first_name",
      align: "center",
      render: (_, record) =>
        record.Admin
          ? `${record.Admin.first_name} ${record.Admin.last_name}`
          : "-",
    },
    {
      title: "แก้ไข",
      key: "edit",
      align: "center",
      render: (_, record) => (
        <Button onClick={() => navigate(`/Room/RoomEdit/${record.ID}`)}>
          แก้ไข
        </Button>
      ),
    },
    {
      title: "ลบ",
      key: "delete",
      align: "center",
      render: (_, record) => (
        <Button danger onClick={() => confirmDelete(record.ID!, record.room_number)}>
          ลบ
        </Button>
      ),
    },
  ];

  const columnsUser: ColumnsType<Room> = [
    {
      title: "เลขห้อง",
      dataIndex: "room_number",
      key: "room_number",
      align: "center",
    },
    {
      title: "ประเภท",
      key: "RoomTypeName",
      align: "center",
      render: (_, record) => record.RoomType?.RoomTypeName ?? "-",
    },
    {
  title: "สถานะ",
  dataIndex: "room_status",
  key: "room_status",
  align: "center",
  render: (_, record) => {
    // ถ้าผู้ใช้จองเอง ให้สถานะแสดงเป็น 'ไม่ว่าง'
    const isBookedByMe = record.StudentID === myId;
    const statusToShow = isBookedByMe ? "ไม่ว่าง" : record.room_status;

    return (
      <span
        style={{
          color:
            statusToShow === "ว่าง" || statusToShow === "ว่าง"
              ? "#52c41a"
              : "#f5222d",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {statusToShow}
      </span>
    );
  },
},    {
      title: "ราคา",
      key: "RentelPrice",
      align: "center",
      render: (_, record) => record.RoomType?.RentalPrice ?? "-",
    },
    {
      title: "ดำเนินการ",
      key: "action",
      align: "center",
      render: (_, record) => {
        const isBookedByMe = record.StudentID === myId;
        const isAvailable = record.room_status === "ว่าง" || record.room_status === "ว่าง";

        return (
          <Space>
            <Button
              type="link"
              onClick={() => navigate(`/Room/RoomDetail/${record.ID}`)}
            >
              ดูรายละเอียด
            </Button>

            {isBookedByMe ? (
              <Button danger onClick={() => confirmCancelBooking(record.ID!)}>
                ยกเลิกการจอง
              </Button>
            ) : isAvailable ? (
              <Button type="primary" onClick={() => confirmBookRoom(record.ID!)}>
                จอง
              </Button>
            ) : (
              <Button type="dashed" disabled>
                ไม่ว่าง
              </Button>
            )}
          </Space>
        );
      },
    },
      ];

      
  // กำหนด rule จาก localStorage หรือที่อื่น ๆ ตามระบบจริง
  const rule = localStorage.getItem("role") || "user"; // หรือ "admin" ทดสอบ

  return (
    <>
      {contextHolder}
      {modalContextHolder}
      {rule === "admin" ? (
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
                  style={{ width: 150 }}
                >
                  {roomTypes.map((rt) => (
                    <Option key={rt.ID} value={rt.RoomTypeName}>
                      {rt.RoomTypeName}
                    </Option>
                  ))}
                </Select>
                <Button onClick={handleSearch}>ค้นหา</Button>
                <Link to="/Room/createroom">
                  <Button type="primary" icon={<PlusOutlined />}>
                    เพิ่มห้อง
                  </Button>
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
              rowKey="ID"
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

            {/* ฟิลเตอร์ค้นหา */}
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
                  style={{ width: 150 }}
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
            {/* ✅ แสดงสถานะการจอง */}
            {bookingStatus && (
              <div style={{ marginBottom: 16, fontWeight: 600 }}>
                สถานะของคุณ:{" "}
                <span
                  style={{
                    color: bookingStatus.status === "ว่าง" ? "#52c41a" : "#f5222d",
                  }}
                >
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
              rowKey="ID"
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
