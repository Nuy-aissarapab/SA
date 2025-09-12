import { Table, Button, Space, message, Popconfirm, Row, Col, Card } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { BillInterface } from "../../../interfaces/Bill";
import { GetBillByRoom, DeleteBill } from "../../../Service/https/index";

function BillHistory() {
  const { room_id } = useParams(); 
  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage();
  const [bills, setBills] = useState<BillInterface[]>([]);
  const [roomNumber, setRoomNumber] = useState<string>("");

  const getBills = async () => {
    if (!room_id) return;

    try {
      const res = await GetBillByRoom(room_id);
      if (res.status === 200) {
        setBills(res.data);
        if (res.data.length > 0 && res.data[0].Room?.room_number) {
          setRoomNumber(res.data[0].Room.room_number);
        }
      } else {
        setBills([]);
        messageApi.open({
          type: "error",
          content: res.data?.error || "เกิดข้อผิดพลาด",
        });
      }
    } catch (error: any) {
      setBills([]);
      messageApi.error(error?.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  useEffect(() => {
    getBills();
  }, [room_id]);

  const handleDelete = async (billId: number) => {
    try {
      const res = await DeleteBill(billId.toString());
      if (res.status === 200) {
        messageApi.success("ลบเรียบร้อย");
        getBills(); 
      } else {
        messageApi.error(res.data?.error || "เกิดข้อผิดพลาด");
      }
    } catch (error: any) {
      messageApi.error(error?.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  const columns: ColumnsType<BillInterface> = [
    { 
      title: "ลำดับ", 
      key: "index",
      render: (_, __, index) => index + 1
    },
    {
      title: "เดือน",
      key: "Billing_date",
      render: (_, record) =>
        record.Billing_date ? dayjs(record.Billing_date).format("MMMM YYYY") : "-",
    },
    {
      title: "จำนวนเงินรวม",
      key: "total_amount",
      render: (_, record) =>
        record.amount_due !== undefined ? record.amount_due.toFixed(2) : "-",
    },
    {
      title: "วันครบกำหนด",
      key: "due_date",
      render: (_, record) =>
        record.due_date ? dayjs(record.due_date).format("DD/MM/YYYY") : "-",
    },
    {
      title: "สถานะ",
      key: "status",
      render: (_, record) => record.status || "-",
    },
    {
      title: "การจัดการ",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() =>
              navigate(`/Billing/BillHistory/${room_id}/BillingDetail/${record.id}`)
            }
          >
            แก้ไข / ดูรายละเอียด
          </Button>

          {localStorage.getItem("role") === "admin" && (
            <Popconfirm
              title="คุณแน่ใจว่าต้องการลบหรือไม่?"
              onConfirm={() => handleDelete(record.id!)}
              okText="ใช่"
              cancelText="ยกเลิก"
            >
              <Button type="link" danger>
                ลบ
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <Card style={{ margin: "16px", borderRadius: 12, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        
        {/* หัวข้อ + ปุ่มการชำระเงินสำหรับ student */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            {localStorage.getItem("role") === "admin" && (
              <Button type="default" onClick={() => navigate(-1)}>
                ย้อนกลับ
              </Button>
            )}
          </Col>
          <Col style={{ flexGrow: 1, textAlign: "center" }}>
            <h2 style={{ margin: 0 }}>ประวัติบิล ห้อง {roomNumber || room_id}</h2>
          </Col>
          <Col>
            <Space>
              {localStorage.getItem("role") === "admin" && (
                <Button
                  type="primary"
                  onClick={() => navigate(`/Billing/BillHistory/${room_id}/BillingCreate`)}
                >
                  สร้างบิลใหม่
                </Button>
              )}

              {/* ปุ่มการชำระเงินสำหรับ student */}
              {localStorage.getItem("role") === "student" && (
                <Link to="/Billing/Payment">
                  <Button type="primary" icon={<PlusOutlined />}>
                    การชำระเงิน
                  </Button>
                </Link>
              )}
            </Space>
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={bills}
          pagination={{ pageSize: 10 }}
          bordered
          style={{ background: "#fff", borderRadius: 8 }}
        />
      </Card>
    </>
  );
}

export default BillHistory;
