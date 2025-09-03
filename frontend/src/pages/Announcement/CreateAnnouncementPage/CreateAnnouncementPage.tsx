// src/pages/announcements/CreateAnnouncementPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
  message,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import TextArea from "antd/es/input/TextArea";
import {
  CreateAnnouncement,
  ListAnnouncementTargets,
  ListAnnouncementTypes,
} from "../../../Service/https";

const { Title, Text } = Typography;
const required = (m: string) => ({ required: true, message: m });

const CreateAnnouncementPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [targets, setTargets] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const adminId = useMemo(() => {
    const n = Number(localStorage.getItem("id"));
    return Number.isFinite(n) ? n : undefined;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [tRes, gRes] = await Promise.all([
          ListAnnouncementTypes(),
          ListAnnouncementTargets(),
        ]);
        const tRows = Array.isArray(tRes?.data)
          ? tRes.data
          : tRes?.data?.data || [];
        const gRows = Array.isArray(gRes?.data)
          ? gRes.data
          : gRes?.data?.data || [];
        setTypes(
          tRows.map((r: any) => ({
            id: r?.ID ?? r?.id,
            name: r?.Name ?? r?.name,
          }))
        );
        setTargets(
          gRows.map((r: any) => ({
            id: r?.ID ?? r?.id,
            name: r?.Name ?? r?.name,
          }))
        );
      } catch (e: any) {
        message.error(
          e?.response?.data?.error || "โหลดประเภท/กลุ่มเป้าหมายล้มเหลว"
        );
      }
    })();
  }, []);

  const apiUrl = import.meta.env.VITE_API_KEY || "http://localhost:8000";
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const okType = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ].includes(file.type);
    if (!okType) {
      message.error("รองรับเฉพาะรูป .jpg .png .webp .gif");
      return Upload.LIST_IGNORE;
    }
    if (file.size! / 1024 / 1024 > 5) {
      message.error("ขนาดรูปต้องไม่เกิน 5MB");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const uploadProps: UploadProps = {
    name: "file",
    action: `${apiUrl}/media/upload`,
    headers: { Authorization: `${tokenType} ${token}` }, // ถ้า endpoint ไม่ได้ล็อก ก็ลบทิ้งได้
    accept: ".jpg,.jpeg,.png,.webp,.gif",
    listType: "picture",
    maxCount: 1,
    beforeUpload,
    onChange(info) {
      if (info.file.status === "done") {
        const url = info.file.response?.url;
        if (url) {
          setUploadedUrl(url);
          form.setFieldValue("Picture", url); // ส่งไปกับ payload
          message.success("อัปโหลดรูปสำเร็จ");
        } else message.error("อัปโหลดแล้วแต่ไม่ได้รับ URL");
      } else if (info.file.status === "error") {
        message.error("อัปโหลดรูปไม่สำเร็จ");
      }
    },
  };
  const handleRemoveImage = () => {
    setUploadedUrl(null); // เอาพรีวิวออก
    form.setFieldValue("Picture", null); // ส่งเป็น null เพื่อเคลียร์รูปใน DB
    message.success("ลบรูปออกจากประกาศแล้ว (ยังไม่บันทึก)");
  };

  const onFinish = async (v: any) => {
    setSaving(true);
    try {
      const payload = {
        Title: v.Title?.trim(),
        Content: v.Content?.trim(),
        Picture: v.Picture || null,
        AnnouncementTypeID: v.AnnouncementTypeID,
        AnnouncementTargetID: v.AnnouncementTargetID,
        ...(adminId ? { AdminID: adminId } : {}),
      };
      const res = await CreateAnnouncement(payload);
      if (res?.status === 201 || res?.status === 200) {
        message.success("บันทึกข่าวสารสำเร็จ");
        navigate("/Announcement");
      } else {
        message.error(res?.data?.error || "บันทึกข่าวสารไม่สำเร็จ");
      }
    } catch (e: any) {
      message.error(e?.response?.data?.error || "บันทึกข่าวสารไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            เพิ่มข่าวสาร
          </Title>
          <Text type="secondary">
            กรอกหัวข้อ เนื้อหา เลือกประเภท/กลุ่มเป้าหมาย และอัปโหลดรูป
          </Text>
        </Col>
      </Row>

      <Card>
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          initialValues={{ Title: "", Content: "", Picture: "" }}
        >
          <Form.Item
            label="หัวข้อ"
            name="Title"
            rules={[required("กรุณากรอกหัวข้อ")]}
          >
            <Input
              maxLength={200}
              showCount
              placeholder="เช่น แจ้งปิดปรับปรุงระบบคืนนี้"
            />
          </Form.Item>

          <Form.Item
            label="เนื้อหา"
            name="Content"
            rules={[required("กรุณากรอกเนื้อหา")]}
          >
            <TextArea
              rows={5}
              maxLength={2000}
              showCount
              placeholder="รายละเอียดประกาศ"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="ประเภท"
                name="AnnouncementTypeID"
                rules={[required("เลือกประเภทประกาศ")]}
              >
                <Select
                  placeholder="เลือกประเภท"
                  options={types.map((t) => ({ label: t.name, value: t.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="กลุ่มเป้าหมาย"
                name="AnnouncementTargetID"
                rules={[required("เลือกกลุ่มเป้าหมาย")]}
              >
                <Select
                  placeholder="เลือกกลุ่มเป้าหมาย"
                  options={targets.map((t) => ({ label: t.name, value: t.id }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="อัปโหลดรูปภาพ"
            tooltip="รองรับ .jpg .png .webp .gif ไม่เกิน 5MB"
          >
            <Space align="start">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>เลือกไฟล์</Button>
              </Upload>

              {/* ปุ่มลบรูป */}
              <Button
                danger
                onClick={handleRemoveImage}
                disabled={!uploadedUrl}
              >
                ลบรูป
              </Button>
            </Space>
            {uploadedUrl && (
              <div style={{ marginTop: 12 }}>
                <img
                  alt="preview"
                  src={uploadedUrl}
                  style={{ maxWidth: 360, borderRadius: 8 }}
                />
              </div>
            )}
          </Form.Item>

          {/* ช่องเก็บ URL ของรูปที่อัปโหลด (ซ่อน) */}
          <Form.Item
            name="Picture"
            hidden
            rules={[{ required: true, message: "กรุณาอัปโหลดรูปภาพ" }]}
          >
            <Input type="hidden" />
          </Form.Item>

          <Space>
            <Button onClick={() => navigate(-1)}>ยกเลิก</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              บันทึก
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};
export default CreateAnnouncementPage;
