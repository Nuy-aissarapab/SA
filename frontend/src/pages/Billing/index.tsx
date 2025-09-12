import { useState, useEffect } from "react";
import { Table, Button, Space, Row, Col, Divider, message, Card, Tag } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, Link } from "react-router-dom";
import type { RoomMeterInterface } from "../../interfaces/Room";
import type { BillInterface } from "../../interfaces/Bill";
import { GetRoomByBill } from "../../Service/https/index";
import dayjs from "dayjs";

function BillList() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [rooms, setRooms] = useState<RoomMeterInterface[]>([]);

  const getRooms = async () => {
    try {
      const res = await GetRoomByBill();
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

  // ฟังก์ชันหา bill ล่าสุด
  const getLatestBill = (bills?: BillInterface[]) => {
    if (!bills || bills.length === 0) return null;
    return bills.reduce((prev, curr) =>
      new Date(prev.Billing_date!).getTime() > new Date(curr.Billing_date!).getTime()
        ? prev
        : curr
    );
  };

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
      title: "เดือน",
      key: "Billing_date",
      render: (_, record) => {
        const latestBill = getLatestBill(record.Bills);
        return latestBill?.Billing_date ? dayjs(latestBill.Billing_date).format("MM/YYYY") : "-";
      },
    },
    {
      title: "รวม",
      key: "amount_due",
      render: (_, record) => {
        const latestBill = getLatestBill(record.Bills);
        return latestBill?.amount_due ? `${latestBill.amount_due.toLocaleString()} บาท` : "-";
      },
    },
    {
      title: "วันครบกำหนด",
      key: "due_date",
      render: (_, record) => {
        const latestBill = getLatestBill(record.Bills);
        return latestBill?.due_date ? dayjs(latestBill.due_date).format("DD/MM/YYYY") : "-";
      },
    },
    {
      title: "สถานะ",
      key: "status",
      render: (_, record) => {
        const latestBill = getLatestBill(record.Bills);
        const status = latestBill?.status;
        if (!status) return "-";
        return (
          <Tag color={status === "paid" ? "green" : status === "pending" ? "orange" : "red"}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "จัดการ",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => navigate(`/Billing/BillHistory/${record.ID}`)}
        >
          แก้ไข
        </Button>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h2 style={{ margin: 0 }}>บิลและใบแจ้งหนี้</h2>
        </Col>
        <Col>
          <Space>
            <Link to="/Billing/Payment">
              <Button type="primary" icon={<PlusOutlined />}>
                การชำระเงิน
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

export default BillList;
