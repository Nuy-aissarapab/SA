import { Button, Form, DatePicker, Card, Table, InputNumber, Checkbox, message, Row, Col } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import dayjs from "dayjs";
import type { BillItemInterface } from "../../../../interfaces/BillItem"; 
import type { ColumnsType } from "antd/es/table";
import { PreviewBillItems, CreateBill } from "../../../../Service/https/index";

interface CreateBillPayload {
  room_id: number;    
  due_date: string;
  items: BillItemInterface[];
}

function BillingCreate() {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [dueDate, setDueDate] = useState<dayjs.Dayjs | null>(null);
  const [previewItems, setPreviewItems] = useState<BillItemInterface[]>([]);

  // เลือกวันครบกำหนด
  const handleDateChange = async (date: dayjs.Dayjs | null) => {
    setDueDate(date);
    if (!date || !room_id) return;

    try {
      const res = await PreviewBillItems({
        room_id: Number(room_id),
        dueDate: date.format("YYYY-MM-DD"),
      });

      if (res.status === 200) {
        const itemsFromAPI: BillItemInterface[] = res.data.items || [];

        // map ค่าไฟ/ค่าน้ำ/ค่าหอให้ตรง frontend และกำหนด selected: true
        const mainItems = itemsFromAPI.map(i => {
          if (i.item_type === "Room") return { ...i, item_type: "ค่าหอ", selected: true };
          if (i.item_type === "Electricity") return { ...i, item_type: "ค่าไฟ", selected: true };
          if (i.item_type === "Water") return { ...i, item_type: "ค่าน้ำ", selected: true };
          return i;
        });

        // filter AssetType ให้เลือกได้
        const assetItems = mainItems
          .filter(i => i.item_type.startsWith("ค่าปรับทรัพย์สิน:") || i.item_type.startsWith("Asset:"))
          .map((i, idx) => ({ ...i, id: 1000 + idx, selected: false }));

        // รวม mainItems (ค่าหอ/ค่าไฟ/ค่าน้ำ) + assetItems (ให้ติ๊กเลือกได้)
        const previewItems = mainItems
          .filter(i => !i.item_type.startsWith("ค่าปรับทรัพย์สิน:") && !i.item_type.startsWith("Asset:"))
          .map((i, idx) => ({ ...i, id: idx + 1 }))
          .concat(assetItems);

        setPreviewItems(previewItems);
      } else {
        messageApi.error(res.data?.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      messageApi.error(err.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleAmountChange = (id: number, value: number) => {
    setPreviewItems(prev =>
      prev.map(item => item.id === id ? { ...item, amount: value } : item)
    );
  };

  const handleSelectChange = (id: number, selected: boolean) => {
    setPreviewItems(prev =>
      prev.map(item => item.id === id ? { ...item, selected } : item)
    );
  };

  // สร้างบิลจริง
  const handleSubmit = async () => {
    if (!dueDate) return messageApi.error("กรุณาเลือกวันครบกำหนด");

    const payload: CreateBillPayload = {
      room_id: Number(room_id),
      due_date: dueDate.startOf("day").toISOString(),
      items: previewItems.filter(i => i.selected === true), // main items และติ๊กเท่านั้น
    };

    try {
      const res = await CreateBill(payload);

      if (res.status === 200) {
        messageApi.success("สร้างบิลเรียบร้อยแล้ว");
        navigate(-1);
      } else {
        messageApi.error(res.data?.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      messageApi.error(err.message || "เกิดข้อผิดพลาด");
    }
  };

  const columns: ColumnsType<BillItemInterface> = [
    { title: "ประเภทรายการ", dataIndex: "item_type", key: "item_type" },
    { 
      title: "จำนวนเงิน", 
      dataIndex: "amount", 
      key: "amount", 
      render: (value, record) => (
        <InputNumber<number>
          min={0}
          value={record.amount}
          onChange={(v) => handleAmountChange(record.id!, v || 0)}
        />
      ),
    },
    {
      title: "เลือกค่าปรับ",
      key: "selected",
      render: (_, record) => (
        record.item_type.startsWith("ค่าปรับทรัพย์สิน:") || record.item_type.startsWith("Asset:") ? (
          <Checkbox
            checked={record.selected}
            onChange={e => handleSelectChange(record.id!, e.target.checked)}
          />
        ) : null
      ),
    },
  ];

  return (
    <Card title={`สร้างบิลใหม่ ห้อง ${room_id}`} className="shadow-lg rounded-2xl">
      {contextHolder}
      <Form layout="vertical">
        <Form.Item label="วันครบกำหนด (Due Date)">
          <DatePicker style={{ width: "100%" }} onChange={handleDateChange} />
        </Form.Item>

        {previewItems.length > 0 && (
          <>
            <h3>รายการบิลที่จะสร้าง</h3>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={previewItems}
              pagination={false}
            />
          </>
        )}

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col>
            <Button type="default" onClick={() => navigate(-1)}>ยกเลิก</Button>
          </Col>
          <Col>
            <Button type="primary" onClick={handleSubmit}>สร้างบิล</Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}

export default BillingCreate;
