import { useState, useEffect } from "react";
import { Table, Button, Space, Row, Col, Divider, message, Card } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { GetRoomByMeter } from "../../Service/https/index";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { RoomMeterInterface } from "../../interfaces/Room";

function MeterList() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [rooms, setRooms] = useState<RoomMeterInterface[]>([]);

  const getRooms = async () => {
    try {
      const res = await GetRoomByMeter();
      if (res.status === 200) {
        setRooms(res.data);
      } else {
        setRooms([]);
        messageApi.open({ type: "error", content: res.data?.error || "เกิดข้อผิดพลาด" });
      }
    } catch (err: any) {
      setRooms([]);
      messageApi.open({ type: "error", content: err.message || "เกิดข้อผิดพลาด" });
    }
  };

  useEffect(() => {
    getRooms();
  }, []);

  const columns: ColumnsType<RoomMeterInterface> = [
    { title: "เลขห้อง", dataIndex: "RoomNumber", key: "RoomNumber" },
    {
      title: "ชื่อ-นามสกุล",
      key: "full_name",
      render: (_, record) => {
        const student = record.Student;
        if (!student) return "-";
        return `${student.first_name || "-"} ${student.last_name || ""}`;
      },
    },
    {
      title: "วันบันทึกล่าสุด",
      key: "record_date",
      render: (_, record) => {
        const meterRecords = record.MeterRecords;
        if (!meterRecords || meterRecords.length === 0) return "-";
        const latest = meterRecords[meterRecords.length - 1];
        return dayjs(latest.record_date).format("DD/MM/YYYY");
      },
    },
    {
      title: "จัดการ",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => navigate(`/Meter/MeterDetail/${record.ID}`)}
        >
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h2 style={{ margin: 0 }}>รายการห้อง</h2>
        </Col>
        <Col>
          <Space>
            <Link to="/Meter/Create">
              <Button type="primary" icon={<PlusOutlined />}>
                เพิ่มมิเตอร์
              </Button>
            </Link>
          </Space>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 2px 8px #f0f1f2" }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rooms}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </>
  );
}

export default MeterList;
