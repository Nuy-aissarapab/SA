import { Button, Form, Input, Card, Select, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { CreateMeter, GetMeterType } from "../../../../Service/https/index";
import { useEffect, useState } from "react";
import type { MeterTypeInterface } from "../../../../interfaces/MeterType";
import type { CreateMeterPayload } from "../../../../interfaces/Meter";

function MeterCreate() {
  const { id } = useParams<{ id: string }>(); // room_id จาก URL
  const navigate = useNavigate();
  const [meterTypes, setMeterTypes] = useState<MeterTypeInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchMeterTypes = async () => {
      try {
        const res = await GetMeterType();
        console.log("MeterTypes from backend:", res.data); // debug
        if (res.status === 200 && Array.isArray(res.data)) {
          setMeterTypes(res.data);
        } else {
          setMeterTypes([]);
          messageApi.error(res.data?.error || "ไม่สามารถดึงประเภทมิเตอร์ได้");
        }
      } catch (err: any) {
        console.error(err);
        messageApi.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    };
    fetchMeterTypes();
  }, []);

  const onFinish = async (values: any) => {
    if (!id) {
      messageApi.error("ไม่พบรหัสห้อง");
      return;
    }

    const payload: CreateMeterPayload = {
      room_id: Number(id),
      meter_type_id: Number(values.meter_type_id),
      new_value: Number(values.new_value),
    };

    try {
      const res = await CreateMeter(payload);
      if (res.status === 200) {
        messageApi.success("บันทึกเรียบร้อย");
        navigate(`/Meter/MeterDetail/${id}`);
      } else {
        messageApi.error(res.data?.error || "เกิดข้อผิดพลาด");
      }
    } catch (error: any) {
      messageApi.error(error.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <Card title={`บันทึกมิเตอร์ ห้อง ${id}`} className="shadow-lg rounded-2xl">
      {contextHolder}
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="ประเภทมิเตอร์"
          name="meter_type_id"
          rules={[{ required: true, message: "เลือกประเภทมิเตอร์" }]}
        >
          <Select placeholder="เลือกประเภทมิเตอร์" notFoundContent="ไม่พบประเภทมิเตอร์">
            {meterTypes.map((mt: MeterTypeInterface) => (
               <Select.Option key={mt.id} value={mt.id}>
              
                {mt.meter_name ?? "ไม่ระบุ"} {/* fallback text */}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="ค่าใหม่"
          name="new_value"
          rules={[{ required: true, message: "กรอกค่าใหม่" }]}
        >
          <Input placeholder="กรอกค่าใหม่" type="number" />
        </Form.Item>

        <Form.Item>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button type="default" onClick={() => navigate(-1)}>กลับ</Button>
            <Button type="primary" htmlType="submit">บันทึก</Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default MeterCreate;
