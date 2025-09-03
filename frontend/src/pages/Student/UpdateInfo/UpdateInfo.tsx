import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Card,
  Divider,
  message,
  Spin,
  Space,
} from "antd";
import dayjs, { Dayjs } from "dayjs";

import { GetStudentById, UpdateStudentById, Update } from "../../../Service/https";
import type { StudentInterface } from "../../../interfaces/Student";

const roleFromStorage = () =>
  (localStorage.getItem("role") || "").toLowerCase() as "admin" | "student" | "";
const myId = () => localStorage.getItem("id") || "";

const { TextArea } = Input;

const UpdateInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const navigate = useNavigate();
  const role = roleFromStorage();

  const [form] = Form.useForm();
  const [formPwd] = Form.useForm();              // ✅ ฟอร์มสำหรับเปลี่ยนรหัสผ่าน
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false); // ✅ สถานะโหลดปุ่มรหัสผ่าน
  const [user, setUser] = useState<StudentInterface | null>(null);

  // ห้าม student แก้ของคนอื่น
  useEffect(() => {
    if (role === "student" && myId() !== String(id)) {
      message.error("คุณไม่มีสิทธิ์แก้ไขข้อมูลของผู้อื่น");
      navigate(-1);
    }
  }, [role, id, navigate]);

  useEffect(() => {
    const fetchUser = async () => {
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
    if (!Number.isNaN(numericId)) fetchUser();
  }, [numericId, form, navigate]);

  const onFinish = async (values: any) => {
    // ✅ ห้ามส่ง ID / Room_ID / password
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

  // ✅ เปลี่ยนรหัสผ่าน
  const onChangePassword = async (vals: any) => {
    // นักศึกษา: ต้องใส่ทั้ง old+new, แอดมิน: เอาเฉพาะ new
    const body: any =
      role === "student"
        ? { old_password: vals.current_password, new_password: vals.new_password }
        : { new_password: vals.new_password };

    if (role !== "student" && myId() === String(id)) {
      // ถ้าเป็น admin ที่บังเอิญแก้ของตัวเอง และระบบอยากให้บังคับรหัสเดิมด้วย ก็สลับตรรกะนี้ได้
    }

    setPwSaving(true);
    try {
      // ใช้ helper Update ที่อ่าน token สด ๆ
      const res = await Update(`/student/${numericId}/password`, body, true);
      // สมมติ backend ตอบ 200 เมื่อสำเร็จ
      if (res?.status === 200) {
        message.success("เปลี่ยนรหัสผ่านเรียบร้อย");
        formPwd.resetFields();
      } else if (res?.status === 400 || res?.status === 401 || res?.status === 403) {
        message.error(res?.data?.error || "รหัสผ่านเดิมไม่ถูกต้อง หรือคุณไม่มีสิทธิ์ทำรายการนี้");
      } else {
        message.error(res?.data?.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      }
    } catch (e) {
      console.error(e);
      message.error("เกิดข้อผิดพลาดระหว่างเปลี่ยนรหัสผ่าน");
    } finally {
      setPwSaving(false);
    }
  };

  const disabledStyle: React.CSSProperties = { background: "#f5f5f5" };

  if (loading) return <Spin style={{ margin: 24 }} />;

  return (
    <Card
      title="แก้ไขข้อมูลส่วนตัว"
      headStyle={{ fontSize: "20px", fontWeight: "bold", color: "#000000ff" }}
      style={{ maxWidth: 900, margin: "0 auto" }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* ข้อมูลระบบ (ห้ามแก้) */}
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold", color: "#000000ff" }}>
          ข้อมูลระบบ
        </Divider>
        <Form.Item label="ID" name="ID">
          <Input disabled style={disabledStyle} />
        </Form.Item>

        {/* บัญชี */}
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold", color: "#000000ff" }}>
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
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold", color: "#000000ff" }}>
          ข้อมูลทั่วไป
        </Divider>
        <Form.Item label="ชื่อจริง" name="first_name" rules={[{ required: true, message: "กรอกชื่อจริง" }]}>
          <Input />
        </Form.Item>
        <Form.Item label="นามสกุล" name="last_name" rules={[{ required: true, message: "กรอกนามสกุล" }]}>
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
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold", color: "#000000ff" }}>
          ข้อมูลผู้ปกครอง
        </Divider>
        <Form.Item label="ชื่อผู้ปกครอง" name="parent_name">
          <Input />
        </Form.Item>
        <Form.Item label="เบอร์ผู้ปกครอง" name="parent_phone">
          <Input />
        </Form.Item>

        {/* ที่อยู่ */}
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold", color: "#000000ff" }}>
          ที่อยู่
        </Divider>
        <Form.Item label="ที่อยู่" name="address">
          <TextArea rows={4} placeholder="บ้านเลขที่, ถนน, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์" />
        </Form.Item>

        {/* ที่พัก/ห้อง (ห้ามแก้) */}
        <Divider orientation="left" style={{ fontSize: 18, fontWeight: "bold", color: "#000000ff" }}>
          ข้อมูลที่พัก/ห้อง (แก้ไขไม่ได้)
        </Divider>
        <Form.Item label="Room_ID" name="Room_ID">
          <Input disabled style={disabledStyle} />
        </Form.Item>
        <Form.Item label="รายละเอียดห้อง">
          <Input disabled style={disabledStyle} value={user?.room_id ? "มีข้อมูลห้อง" : "-"} />
        </Form.Item>

        <Divider />
        <Space>
          <Button onClick={() => navigate(-1)}>ยกเลิก</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            บันทึกการเปลี่ยนแปลง
          </Button>
        </Space>
      </Form>

      {/* ✅ ส่วนเปลี่ยนรหัสผ่าน */}
      <Divider style={{ margin: "28px 0" }} />
      <Card
        type="inner"
        title="เปลี่ยนรหัสผ่าน"
        headStyle={{ fontWeight: 600 }}
        style={{ maxWidth: 900, margin: "16px auto 0" }}
      >
        <Form
          form={formPwd}
          layout="vertical"
          onFinish={onChangePassword}
          initialValues={{ current_password: "", new_password: "", confirm_password: "" }}
        >
          {role === "student" ? (
            <>
              <Form.Item
                label="รหัสผ่านปัจจุบัน"
                name="current_password"
                rules={[{ required: true, message: "กรอกรหัสผ่านปัจจุบัน" }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                label="รหัสผ่านใหม่"
                name="new_password"
                rules={[
                  { required: true, message: "กรอกรหัสผ่านใหม่" },
                  { min: 6, message: "อย่างน้อย 6 ตัวอักษร" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("current_password") !== value) return Promise.resolve();
                      return Promise.reject(new Error("รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม"));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
            </>
          ) : (
            <>
              {/* admin ไม่ต้องใส่รหัสเดิม */}
              <Form.Item
                label="รหัสผ่านใหม่"
                name="new_password"
                rules={[{ required: true, message: "กรอกรหัสผ่านใหม่" }, { min: 6, message: "อย่างน้อย 6 ตัวอักษร" }]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}

          <Form.Item
            label="ยืนยันรหัสผ่านใหม่"
            name="confirm_password"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "กรุณายืนยันรหัสผ่านใหม่" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) return Promise.resolve();
                  return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

        <Space>
          <Button onClick={() => formPwd.resetFields()}>ล้างฟอร์ม</Button>
          <Button type="primary" htmlType="submit" loading={pwSaving}>
            อัปเดตรหัสผ่าน
          </Button>
        </Space>
        </Form>
      </Card>
    </Card>
  );
};

export default UpdateInfo;
