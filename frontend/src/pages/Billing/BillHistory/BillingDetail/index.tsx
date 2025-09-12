import { useParams, useNavigate } from "react-router-dom";
import { Table, Button, Row, Col, message, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState, useEffect } from "react";
import type { BillItemInterface } from "../../../../interfaces/BillItem";
import { GetBillItemsByBillId } from "../../../../Service/https/index"; 

function BillingDetail() {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const [billItems, setBillItems] = useState<BillItemInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const getBillItems = async () => {
    if (!billId) return;

    try {
      const res = await GetBillItemsByBillId(billId);

      if (res.status === 200) {
        setBillItems(res.data);
      } else {
        setBillItems([]);
        messageApi.error(res.data?.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      setBillItems([]);
      messageApi.error(err.message || "เกิดข้อผิดพลาด");
    }
  };

  useEffect(() => { 
    getBillItems(); 
  }, [billId]);

  const columns: ColumnsType<BillItemInterface> = [
    { 
      title: "ลำดับ", 
      key: "index",
      render: (_, __, index) => index + 1 // เริ่มที่ 1
    },
    { title: "ประเภทรายการ", dataIndex: "item_type", key: "item_type" },
    { 
      title: "จำนวนเงิน", 
      dataIndex: "amount", 
      key: "amount", 
      render: (_, record) => record.amount?.toFixed(2) || "-" 
    },
  ];

  return (
    <>
      {contextHolder}

      <Card style={{ margin: "16px", borderRadius: 12, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24, flexWrap: "wrap" }}>
          <Col>
            <Button type="default" onClick={() => navigate(-1)}>
              ย้อนกลับ
            </Button>
          </Col>
          <Col style={{ flexGrow: 1 }}>
            <h2 style={{ textAlign: "center", margin: "8px 0" }}>รายละเอียดบิล</h2>
          </Col>
          <Col>{/* ปล่อยว่างไว้ ไม่มีปุ่มอื่น */}</Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={billItems}
          pagination={false}
          bordered
          style={{ borderRadius: 8 }}
        />
      </Card>
    </>
  );
}

export default BillingDetail;
