import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Divider, Form, Input, Button, Space, message, Typography } from "antd";
import { authAPI } from "../../../Service/https";

const { Title } = Typography;

const CreateStudentPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const signupRes = await authAPI.studentSignup({
        Email: values.email?.trim(),
        Password: values.password, // อย่า trim password
      });

      if (signupRes?.status === 409) {
        message.error("อีเมลนี้มีบัญชีอยู่แล้ว");
        setSaving(false);
        return;
      }
      if (!signupRes || (signupRes.status !== 200 && signupRes.status !== 201)) {
        message.error(signupRes?.data?.error || "สมัครบัญชีไม่สำเร็จ");
        setSaving(false);
        return;
      }

      message.success("สร้างบัญชีนักศึกษาเรียบร้อย");
      navigate("/Student", { replace: true });
    } catch (e) {
      console.error(e);
      message.error("เกิดข้อผิดพลาดระหว่างสมัครบัญชี");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      style={{ maxWidth: 520, margin: "0 auto" }}
      headStyle={{ padding: "12px 16px" }}
      title={<Title level={3} style={{ margin: 0, color: "#000000ff" }}>เพิ่มนักศึกษา (Email + Password)</Title>}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Divider orientation="left" style={{ marginTop: 0 }}>ข้อมูลเข้าระบบ</Divider>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "กรอก Email" },
            { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
          ]}
        >
          <Input placeholder="student@example.com" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "กรอกรหัสผ่าน" },
            { min: 6, message: "อย่างน้อย 6 ตัวอักษร" },
          ]}
        >
          <Input.Password placeholder="อย่างน้อย 6 ตัวอักษร" />
        </Form.Item>

        <Divider />
        <Space>
          <Button onClick={() => navigate("/Student")}>ยกเลิก</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            สร้างนักศึกษา
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default CreateStudentPage;
