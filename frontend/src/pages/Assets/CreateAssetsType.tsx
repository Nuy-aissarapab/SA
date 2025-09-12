import { useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  message,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { CreateAssetType } from "../../Service/https/index";

function CreateAssetTypeForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  // ฟังก์ชัน Submit → แค่สร้างใหม่
  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const payload = {
        Name: values.name,
        Type: values.type,
        PenaltyFee: Number(values.penalty_fee),
        Date: new Date().toISOString(),
      };

      const res = await CreateAssetType(payload);

      if (res?.status === 201) {
        messageApi.success("เพิ่มประเภททรัพย์สินสำเร็จ");
        navigate("/Assets/assetroom");
      } else {
        messageApi.error("เกิดข้อผิดพลาด: " + (res?.data?.error || "ไม่ทราบสาเหตุ"));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "ไม่สามารถเพิ่มประเภททรัพย์สินได้";
      messageApi.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Row justify="start">
        <Col>
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/Assets/assetroom")}
            style={{ marginBottom: 16, borderRadius: 6 }}
          >
            ย้อนกลับ
          </Button>
        </Col>
      </Row>

      <Row justify="center">
        <Col span={16}>
          <h2>➕ เพิ่มประเภททรัพย์สินใหม่</h2>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            {/* ชื่อทรัพย์สิน */}
            <Form.Item
              label="ชื่อทรัพย์สิน"
              name="name"
              rules={[{ required: true, message: "กรุณากรอกชื่อทรัพย์สิน" }]}
            >
              <Input placeholder="เช่น เตียง, โต๊ะ, Wi-Fi" />
            </Form.Item>

            {/* ประเภท */}
            <Form.Item
              label="หมวดหมู่ / ประเภท"
              name="type"
              rules={[{ required: true, message: "กรุณากรอกหมวดหมู่" }]}
            >
              <Input placeholder="เช่น เฟอร์นิเจอร์, สิ่งอำนวยความสะดวก" />
            </Form.Item>

            {/* ค่าปรับ */}
            <Form.Item
              label="ค่าปรับ (บาท)"
              name="penalty_fee"
              rules={[{ required: true, message: "กรุณากรอกค่าปรับ" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item>
              <Row justify="space-between">
                <Col>
                  <Button onClick={() => navigate("/Assets/assetroom")}>
                    ยกเลิก
                  </Button>
                </Col>
                <Col>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    ✅ บันทึกข้อมูล
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </>
  );
}

export default CreateAssetTypeForm;