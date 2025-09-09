import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, InputNumber, Button, Spin, message, DatePicker } from "antd";
import dayjs from "dayjs";
import { GetRoomAssetById, UpdateRoomAsset } from "../../Service/https/index";
import type { RoomAsset } from "../../interfaces/RoomAsset";

const RoomAssetEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await GetRoomAssetById(Number(id));
      const data: RoomAsset = res.data ?? res;

      form.setFieldsValue({
        AssetName: data.AssetType?.Name,
        Quantity: data.Quantity,
        Condition: data.Condition,
        Status: data.Status,
        CheckDate: data.CheckDate ? dayjs(data.CheckDate) : null,
      });
    } catch (err) {
      message.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

 const onFinish = async (values: any) => {
  if (!id) return;
  setLoading(true);
  try {
    const payload = {
      Quantity: values.Quantity,
      Condition: values.Condition,
      Status: values.Status,
      CheckDate: values.CheckDate ? values.CheckDate.toISOString() : null,
    };

    const res = await UpdateRoomAsset(Number(id), payload);
    if (res.status === 200) {
      message.success("แก้ไขข้อมูลสำเร็จ");
      navigate(-1);
    } else {
      message.error("แก้ไขไม่สำเร็จ");
    }
  } catch (err) {
    message.error("เกิดข้อผิดพลาดในการบันทึก");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, [id]);

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <h2>แก้ไขข้อมูลทรัพย์สิน</h2>

      {loading ? (
        <Spin />
      ) : (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="ชื่อทรัพย์สิน" name="AssetName">
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="จำนวน"
            name="Quantity"
            rules={[{ required: true, message: "กรุณากรอกจำนวน" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="สภาพ" name="Condition">
            <Input />
          </Form.Item>

          <Form.Item label="สถานะ" name="Status">
            <Input />
          </Form.Item>

          <Form.Item label="วันที่ตรวจสอบ" name="CheckDate">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              บันทึกการแก้ไข
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate(-1)}>
              ยกเลิก
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>
  );
};

export default RoomAssetEdit;
