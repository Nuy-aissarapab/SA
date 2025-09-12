import { Button, Form, Input, Card, Select, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { MeterTypeInterface } from "../../../../interfaces/MeterType";
import type { MeterInterface } from "../../../../interfaces/Meter";
import { GetMeterType, GetMeterByRoom, UpdateMeter } from "../../../../Service/https/index";

function MeterEdit() {
  const { id, meterId } = useParams<{ id: string; meterId: string }>(); // id ห้อง + id มิเตอร์
  const navigate = useNavigate();
  const [meterTypes, setMeterTypes] = useState<MeterTypeInterface[]>([]);
  const [meter, setMeter] = useState<MeterInterface | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [form] = Form.useForm();

  // โหลดประเภทมิเตอร์
  useEffect(() => {
    const fetchMeterTypes = async () => {
      try {
        const res = await GetMeterType();
        if (res.status === 200 && Array.isArray(res.data)) {
          setMeterTypes(res.data);
        } else {
          setMeterTypes([]);
          messageApi.error(res.data?.error || "ไม่สามารถดึงประเภทมิเตอร์ได้");
        }
      } catch (err: any) {
        messageApi.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    };
    fetchMeterTypes();
  }, []);

  // โหลดข้อมูลมิเตอร์
  useEffect(() => {
    const fetchMeter = async () => {
      if (!meterId) return;
      try {
        const res = await GetMeterByRoom(meterId);
        if (res.status === 200) {
          setMeter(res.data);
          form.setFieldsValue({
            meter_type_id: res.data.meter_type_id,
            new_value: res.data.new_value,
          });
        } else {
          messageApi.error(res.data?.error || "ไม่พบข้อมูลมิเตอร์");
        }
      } catch (err: any) {
        messageApi.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    };
    fetchMeter();
  }, [meterId, form]);

  const onFinish = async (values: any) => {
    if (!id || !meterId) {
      messageApi.error("ไม่พบรหัสห้องหรือมิเตอร์");
      return;
    }

    try {
      const payload = {
            room_id: Number(id),  // id ของห้อง จาก useParams()
            meter_type_id: Number(values.meter_type_id),
            new_value: Number(values.new_value),
                };
      const res = await UpdateMeter(meterId, payload);
      if (res.status === 200) {
        messageApi.success("แก้ไขเรียบร้อย");
        navigate(`/Meter/MeterDetail/${id}`);
      } else {
        messageApi.error(res.data?.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      messageApi.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <Card title={`แก้ไขมิเตอร์ ห้อง ${id}`} className="shadow-lg rounded-2xl">
      {contextHolder}
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item
          label="ประเภทมิเตอร์"
          name="meter_type_id"
          rules={[{ required: true, message: "เลือกประเภทมิเตอร์" }]}
        >
          <Select placeholder="เลือกประเภทมิเตอร์" notFoundContent="ไม่พบประเภทมิเตอร์">
            {meterTypes.map((mt: MeterTypeInterface) => (
              <Select.Option key={mt.id} value={mt.id}>
                {mt.meter_name ?? "ไม่ระบุ"}
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
            <Button type="default" onClick={() => navigate(-1)}>
              กลับ
            </Button>
            <Button type="primary" htmlType="submit">
              บันทึก
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default MeterEdit;
