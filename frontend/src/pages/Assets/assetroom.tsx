import { useState, useEffect } from "react";
import {
  Space,
  Table,
  Button,
  Col,
  Row,
  Divider,
  message,
  Input,
  Select,
  Spin,
} from "antd";
import {
  SearchOutlined,
  HomeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, Link } from "react-router-dom";
import dayjs from "dayjs";
import "./AssetRoom.css";

import type { Room } from "../../interfaces/Room";
import type { RoomType } from "../../interfaces/RoomType";
import { GetAllRooms, GetAllRoomTypes } from "../../Service/https/index";

const { Option } = Select;

interface RoomData extends Room {
  key: string;
}

const AssetRoom = () => {
  const [dataSource, setDataSource] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [roomNumberFilter, setRoomNumberFilter] = useState<string>("");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomData[]>([]);

  const navigate = useNavigate();
  const role: string = localStorage.getItem("role") || "admin";
  const studentID = localStorage.getItem("studentID") || "1";

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await GetAllRooms();
      const rooms: Room[] = response.data ?? response;

      const formatted: RoomData[] = rooms.map((item: Room, index: number) => ({
        ...item,
        key: item.room_number + "-" + index,
      }));

      setDataSource(formatted);
      setFilteredRooms(formatted);
    } catch (error) {
      console.error("Fetch error:", error);
      messageApi.error("เกิดข้อผิดพลาดในการโหลดข้อมูลห้อง");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await GetAllRoomTypes();
      if (res.status === 200) {
        setRoomTypes(res.data);
      }
    } catch {
      messageApi.error("โหลดประเภทห้องไม่สำเร็จ");
    }
  };

  useEffect(() => {
    fetchData();
    fetchRoomTypes();
  }, []);

  const filterRooms = (roomNumber: string, roomType?: string) => {
    let result = dataSource;

    if (roomNumber.trim()) {
      result = result.filter((r) =>
        r.room_number?.includes(roomNumber.trim())
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

  const adminColumns: ColumnsType<RoomData> = [
    {
      title: "หมายเลขห้อง",
      dataIndex: "RoomNumber",
      key: "roomNumber",
      align: "center",
      render: (_, record) => (
        <Link to={`/Assets/room/${record.room_number}`}>
          {record.room_number}
        </Link>
      ),
    },
    {
      title: "ประเภทห้อง",
      key: "roomType",
      align: "center",
      render: (_, record) => record.RoomType?.RoomTypeName ?? "-",
    },
    {
      title: "แก้ไขล่าสุด",
      dataIndex: "UpdatedAt",
      key: "updatedAt",
      align: "center",
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
  ];

  // กรองเฉพาะห้องของผู้ใช้งาน
  const userData = dataSource.filter((item) => {
    const student = item.Student;
    return student ? Number(studentID) === student.ID : false;
  });

  return (
    <>
      {contextHolder}
      {role === "admin" ? (
        <>
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 16 }}
          >
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
              columns={adminColumns}
              dataSource={filteredRooms}
              rowKey="key"
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({
                onClick: () => {
                  if (record.room_number) {
                    navigate(`/Assets/room/${record.room_number}`);
                  }
                },
                style: { cursor: "pointer" },
              })}
            />
          )}
        </>
      ) : (
        <div className="asset-room-container">
          <h2 style={{ marginBottom: 24 }}>
            ทรัพย์สินของห้อง:{" "}
            <span style={{ color: "#1890ff" }}>
              {userData.length > 0 ? userData[0].room_number : "-"}
            </span>
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin />
            </div>
          ) : (
            userData.map((room) => (
              <div key={room.key} style={{ marginBottom: 32 }}>
                <Table
                  dataSource={
                    room.RoomAsset?.map((asset, index) => ({
                      key: `${room.room_number}-${index}`,
                      Name: asset.AssetType?.Name ?? "-",
                      Quantity: asset.Quantity ?? 0,
                      PenaltyFee: asset.AssetType?.PenaltyFee ?? 0,
                      CheckDate: asset.CheckDate
                        ? dayjs(asset.CheckDate).format("DD/MM/YYYY")
                        : "-",
                    })) || []
                  }
                  columns={[
                    {
                      title: "ชื่อทรัพย์สิน",
                      dataIndex: "Name",
                      key: "name",
                      align: "center",
                    },
                    {
                      title: "จำนวน",
                      dataIndex: "Quantity",
                      key: "quantity",
                      align: "center",
                    },
                    {
                      title: "ค่าปรับ (บาท)",
                      dataIndex: "PenaltyFee",
                      key: "penalty",
                      align: "center",
                      render: (fee: number) =>
                        fee > 0 ? `${fee.toLocaleString()} ` : "-",
                    },
                    {
                      title: "วันที่ตรวจสอบ",
                      dataIndex: "CheckDate",
                      key: "checkDate",
                      align: "center",
                    },
                  ]}
                  pagination={false}
                  bordered={false}
                  size="middle"
                  rowClassName={() => "asset-row"}
                />
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default AssetRoom;
