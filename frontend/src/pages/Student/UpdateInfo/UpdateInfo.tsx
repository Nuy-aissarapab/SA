import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker, Button, Card, message, Space } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";

import { GetUsersById, UpdateUsersById } from "../../../Service/https";
import type { StudentInterface } from "../../../interfaces/Student";

type FormShape = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birthday?: Dayjs;
  address?: string;
};

const StudentEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { state } = useLocation() as { state?: Partial<StudentInterface> };
  const [form] = Form.useForm<FormShape>();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // เติมด้วย state ก่อน (instant UX)
  useEffect(() => {
    if (state) {
      form.setFieldsValue({
        first_name: state.first_name ?? "",
        last_name: state.last_name ?? "",
        email: state.email ?? "",
        phone: state.phone ?? "",
        birthday: state.birthday ? dayjs(state.birthday) : undefined,
        address: state.address ?? "",
      });
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ดึงข้อมูลจริงด้วย id เพื่อ sync ให้ชัวร์
  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      try {
        const res = await GetUsersById(id);
        const data: StudentInterface = res?.data;
        form.setFieldsValue({
          first_name: data?.first_name ?? "",
          last_name: data?.last_name ?? "",
          email: data?.email ?? "",
          phone: data?.phone ?? "",
          birthday: data?.birthday ? dayjs(data.birthday) : undefined,
          address: data?.address ?? "",
        });
      } catch (e) {
        message.error("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, form]);

  const onFinish = async (values: FormShape) => {
    if (!id) return;
    setSaving(true);
    try {
      // แปลงวันเกิดกลับเป็น string/ISO ตามที่ backend ต้องการ
      const payload: Partial<StudentInterface> = {
        first_name: values.first_name?.trim(),
        last_name: values.last_name?.trim(),
        email: values.email?.trim(),
        phone: values.phone?.trim(),
        birthday: values.birthday ? values.birthday.toISOString() : undefined,
        address: values.address,
      };

      const res = await UpdateUsersById(id, payload);
      if (res?.status === 200) {
        message.success(res?.data?.message || "บันทึกสำเร็จ");
        nav(-1); // กลับหน้าก่อนหน้า (ตาราง)
      } else {
        message.error(res?.data?.error || "บันทึกไม่สำเร็จ");
      }
    } catch (e) {
      message.error("เกิดข้อผิดพลาดขณะบันทึก");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title={`แก้ไขข้อมูลผู้ใช้ #${id || "-"}`} loading={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        <Form.Item label="ชื่อจริง" name="first_name" rules={[{ required: true, message: "กรอกชื่อจริง" }]}>
          <Input placeholder="เช่น จิรายุ" />
        </Form.Item>
        <Form.Item label="นามสกุล" name="last_name" rules={[{ required: true, message: "กรอกนามสกุล" }]}>
          <Input placeholder="เช่น ใจดี" />
        </Form.Item>
        <Form.Item label="อีเมล" name="email" rules={[{ required: true, type: "email", message: "อีเมลไม่ถูกต้อง" }]}>
          <Input placeholder="example@mail.com" />
        </Form.Item>

        <Form.Item label="หมายเลขโทรศัพท์" name="phone">
          <Input placeholder="0812345678" />
        </Form.Item>

        <Form.Item label="วัน/เดือน/ปีเกิด" name="birthday">
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="ที่อยู่" name="address">
          <TextArea rows={3} placeholder="บ้านเลขที่/ถนน/ตำบล/อำเภอ/จังหวัด/รหัสไปรษณีย์" />
        </Form.Item>

        <Space>
          <Button onClick={() => nav(-1)}>ยกเลิก</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            บันทึก
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default StudentEdit;
