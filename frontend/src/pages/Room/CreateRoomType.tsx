import { useState } from "react";
import { Button, Col, Form, Input, InputNumber, Row, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { CreateRoomType } from "../../Service/https/index";

function CreateRoomTypeForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        RoomTypeName: values.name,
        RentalPrice: Number(values.price),
      };
      const res = await CreateRoomType(payload);
      if (res?.status === 201) {
        messageApi.success("เพิ่มประเภทห้องสำเร็จ");
        navigate("/Room"); // กลับไปหน้า Room
      } else {
        messageApi.error("เกิดข้อผิดพลาด: " + (res?.data?.error || "ไม่ทราบสาเหตุ"));
      }
    } catch (err: any) {
      messageApi.error("ไม่สามารถเพิ่มประเภทห้องได้");
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
            onClick={() => navigate("/Room")}
            style={{ marginBottom: 16, borderRadius: 6 }}
          >
            ย้อนกลับ
          </Button>
        </Col>
      </Row>

      <Row justify="center">
        <Col span={16}>
          <h2>➕ เพิ่มประเภทห้องใหม่</h2>
          <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item
              label="ชื่อประเภทห้อง"
              name="name"
              rules={[{ required: true, message: "กรุณากรอกชื่อประเภทห้อง" }]}
            >
              <Input placeholder="เช่น ห้องพัดลม, ห้องแอร์" />
            </Form.Item>

            <Form.Item
              label="ราคาเช่า (บาท)"
              name="price"
              rules={[{ required: true, message: "กรุณากรอกราคาเช่า" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item>
              <Row justify="space-between">
                <Col>
                  <Button onClick={() => navigate("/Room")}>ยกเลิก</Button>
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

export default CreateRoomTypeForm;
