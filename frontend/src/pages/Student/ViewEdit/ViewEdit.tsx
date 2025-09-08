import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Divider, Form, Input, DatePicker, Button, Space, Spin, message, Typography } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { GetStudentById, UpdateStudentById } from "../../../Service/https";
import type { StudentInterface } from "../../../interfaces/Student";

const { Title } = Typography;
const { TextArea } = Input;

const roleFromStorage = () =>
  (localStorage.getItem("role") || "").toLowerCase() as "admin" | "student" | "";

const ViewEditStudent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const navigate = useNavigate();
  const role = roleFromStorage();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<StudentInterface | null>(null);

  // จำกัดเฉพาะแอดมินเข้าหน้านี้ (กันพลาด)
  useEffect(() => {
    if (role !== "admin") {
      message.error("อนุญาตเฉพาะผู้ดูแลระบบ");
      navigate(-1);
    }
  }, [role, navigate]);

  useEffect(() => {
    const fetchOne = async () => {
      try {
        setLoading(true);
        const res = await GetStudentById(numericId);
        if (res?.status === 200) {
          const data: StudentInterface = res.data;
          setUser(data);
          form.setFieldsValue({
            ID: data.ID,
            username: data.username,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            parent_name: data.parent_name,
            parent_phone: data.parent_phone,
            birthday: data.birthday ? dayjs(data.birthday) : undefined,
            major: data.major,
            address: data.address,
            Room_ID: data.room_id,
          });
        } else {
          message.error(res?.data?.error || "โหลดข้อมูลไม่สำเร็จ");
          navigate(-1);
        }
      } catch (e) {
        console.error(e);
        message.error("โหลดข้อมูลไม่สำเร็จ");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    if (!Number.isNaN(numericId)) fetchOne();
  }, [numericId, form, navigate]);

  const onFinish = async (values: any) => {
    // เหมือนหน้าของนักศึกษา: แก้ได้ทุกอย่าง ยกเว้น ID / Room_ID / Room / password
    const payload: Partial<StudentInterface> = {
      username: values.username?.trim(),
      email: values.email?.trim(),
      first_name: values.first_name?.trim(),
      last_name: values.last_name?.trim(),
      phone: values.phone?.trim(),
      parent_name: values.parent_name?.trim(),
      parent_phone: values.parent_phone?.trim(),
      birthday: values.birthday ? (values.birthday as Dayjs).toISOString() : undefined,
      major: values.major?.trim(),
      address: values.address ?? "",
    };

    setSaving(true);
    try {
      const res = await UpdateStudentById(numericId, payload as StudentInterface);
      if (res?.status === 200) {
        message.success("บันทึกเรียบร้อย");
        navigate(-1);
      } else {
        message.error(res?.data?.error || "บันทึกไม่สำเร็จ");
      }
    } catch (e) {
      console.error(e);
      message.error("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const disabledStyle: React.CSSProperties = { background: "#f5f5f5" };

  if (loading) return <Spin style={{ margin: 24 }} />;

  return (
    <Card
      style={{ maxWidth: 920, margin: "0 auto" }}
      headStyle={{ padding: "12px 16px" }}
      title={<Title level={3} style={{ margin: 0, color: "#1890ff" }}>ข้อมูลนักศึกษา</Title>}
      extra={<Button onClick={() => navigate(-1)}>ย้อนกลับ</Button>}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* ระบบ */}
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold" }}>
          ข้อมูลระบบ
        </Divider>
        <Form.Item label="ID" name="ID">
          <Input disabled style={disabledStyle} />
        </Form.Item>

        {/* บัญชี */}
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold" }}>
          ข้อมูลบัญชี
        </Divider>
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: "กรอก Username" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "กรอก Email" },
            { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
          ]}
        >
          <Input />
        </Form.Item>

        {/* ทั่วไป */}
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold" }}>
          ข้อมูลทั่วไป
        </Divider>
        <Form.Item
          label="ชื่อจริง"
          name="first_name"
          rules={[{ required: true, message: "กรอกชื่อจริง" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="นามสกุล"
          name="last_name"
          rules={[{ required: true, message: "กรอกนามสกุล" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="วัน/เดือน/ปีเกิด" name="birthday">
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="สาขา (Major)" name="major">
          <Input />
        </Form.Item>
        <Form.Item label="หมายเลขโทรศัพท์" name="phone">
          <Input />
        </Form.Item>

        {/* ผู้ปกครอง */}
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold" }}>
          ข้อมูลผู้ปกครอง
        </Divider>
        <Form.Item label="ชื่อผู้ปกครอง" name="parent_name">
          <Input />
        </Form.Item>
        <Form.Item label="เบอร์ผู้ปกครอง" name="parent_phone">
          <Input />
        </Form.Item>

        {/* ที่อยู่ */}
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold" }}>
          ที่อยู่
        </Divider>
        <Form.Item label="ที่อยู่" name="address">
          <TextArea rows={4} placeholder="บ้านเลขที่, ถนน, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์" />
        </Form.Item>

        {/* ที่พัก/ห้อง (ห้ามแก้) */}
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold" }}>
          ข้อมูลที่พัก/ห้อง (แก้ไขไม่ได้)
        </Divider>
        <Form.Item label="Room_ID" name="Room_ID">
          <Input disabled style={disabledStyle} />
        </Form.Item>
        <Form.Item label="รายละเอียดห้อง">
          <Input disabled style={disabledStyle} value={user?.room ? "มีข้อมูลห้อง" : "-"} />
        </Form.Item>

        <Divider />
        <Space>
          <Button onClick={() => navigate(-1)}>ยกเลิก</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            บันทึกการเปลี่ยนแปลง
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default ViewEditStudent;
