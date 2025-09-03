import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button, Card, Col, Form, Input, Row, Select, Space, Typography, message, Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import TextArea from "antd/es/input/TextArea";
import {
  GetAnnouncementById,
  ListAnnouncementTargets,
  ListAnnouncementTypes,
  UpdateAnnouncementById,
} from "../../../Service/https";

const { Title, Text } = Typography;
const required = (m: string) => ({ required: true, message: m });

// ใช้ที่เดียวกันทั้งไฟล์
const apiUrl = import.meta.env.VITE_API_KEY || "http://localhost:8000";

const EditAnnouncementPage: React.FC = () => {
  const { id } = useParams(); // /announcements/:id/edit
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [targets, setTargets] = useState<Array<{ id: number; name: string }>>([]);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const adminId = useMemo(() => {
    const n = Number(localStorage.getItem("id"));
    return Number.isFinite(n) ? n : undefined;
  }, []);

  // ดึงออบเจ็กต์แรกออกมาให้ได้แน่ ๆ
  const pickOne = (x: any) => {
    if (!x) return x;
    if (Array.isArray(x)) return x[0];
    if (x?.data) return Array.isArray(x.data) ? x.data[0] : x.data;
    if (x?.Data) return Array.isArray(x.Data) ? x.Data[0] : x.Data;
    return x;
  };

  // ---- load options + current announcement ----
  useEffect(() => {
    (async () => {
      try {
        const [tRes, gRes, aRes] = await Promise.all([
          ListAnnouncementTypes(),
          ListAnnouncementTargets(),
          GetAnnouncementById(String(id)),
        ]);

        const tRows = Array.isArray(tRes?.data) ? tRes.data : (tRes?.data?.data || []);
        const gRows = Array.isArray(gRes?.data) ? gRes.data : (gRes?.data?.data || []);
        setTypes(tRows.map((r: any) => ({ id: r?.ID ?? r?.id, name: r?.Name ?? r?.name })));
        setTargets(gRows.map((r: any) => ({ id: r?.ID ?? r?.id, name: r?.Name ?? r?.name })));

        const raw = pickOne(aRes?.data ?? aRes);
        if (!raw) throw new Error("ไม่พบประกาศที่ต้องการแก้ไข");

        // map field ที่อาจต่างชื่อกัน
        // เก็บและใช้ 'Full URL' เสมอเพื่อให้ <img src> แสดงได้แน่ ๆ
        const rawPic = (raw?.Picture ?? raw?.picture ?? "") as string;
        const fullPic = rawPic
          ? (rawPic.startsWith("http")
              ? rawPic
              : `${apiUrl}${rawPic}`) // ถ้าเป็น /uploads/... ให้เติม apiUrl
          : "";

        const current = {
          Title: raw?.Title ?? raw?.title ?? "",
          Content: raw?.Content ?? raw?.content ?? "",
          AnnouncementTypeID: raw?.AnnouncementTypeID ?? raw?.announcement_type_id,
          AnnouncementTargetID: raw?.AnnouncementTargetID ?? raw?.announcement_target_id ?? raw?.AnnouncementsTargetID,
          Picture: fullPic, // เก็บ full url ลงฟอร์ม
        };

        form.setFieldsValue(current);
        setUploadedUrl(fullPic || null); // พรีวิวใช้ full url
      } catch (e: any) {
        message.error(e?.response?.data?.error || e?.message || "โหลดข้อมูลประกาศไม่สำเร็จ");
      } finally {
        setInitialLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---- Upload config ----
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const okType = ["image/jpeg","image/jpg","image/png","image/webp","image/gif"].includes(file.type);
    if (!okType) { message.error("รองรับเฉพาะรูป .jpg .png .webp .gif"); return Upload.LIST_IGNORE; }
    if (file.size! / 1024 / 1024 > 5) { message.error("ขนาดรูปต้องไม่เกิน 5MB"); return Upload.LIST_IGNORE; }
    return true;
  };

  const uploadProps: UploadProps = {
    name: "file",
    action: `${apiUrl}/media/upload`,
    headers: { Authorization: `${tokenType} ${token}` },
    accept: ".jpg,.jpeg,.png,.webp,.gif",
    listType: "picture",
    maxCount: 1,
    beforeUpload,
    onChange(info) {
      if (info.file.status === "done") {
        let url = info.file.response?.url as string | undefined;
        // ทำให้เป็น Full URL เสมอสำหรับพรีวิวและการเก็บค่า
        if (url?.startsWith("/")) url = `${apiUrl}${url}`;
        if (url) {
          setUploadedUrl(url);              // พรีวิว
          form.setFieldValue("Picture", url); // ✅ เก็บ full url ลงฟอร์ม
          message.success("อัปโหลดรูปสำเร็จ");
        } else {
          message.error("อัปโหลดแล้วแต่ไม่ได้รับ URL");
        }
      } else if (info.file.status === "error") {
        message.error("อัปโหลดรูปไม่สำเร็จ");
      }
    },
  };

  const onFinish = async (v: any) => {
    setSaving(true);
    try {
      const payload = {
        Title: v.Title?.trim(),
        Content: v.Content?.trim(),
        Picture: v.Picture || null, // ส่ง full url ให้ backend
        AnnouncementTypeID: v.AnnouncementTypeID,
        AnnouncementTargetID: v.AnnouncementTargetID,
        ...(adminId ? { AdminID: adminId } : {}),
      };
      const res = await UpdateAnnouncementById(String(id), payload);
      if (res?.status === 200) {
        message.success("แก้ไขข่าวสารสำเร็จ");
        navigate("/Announcement"); // ✅ กลับเส้นทางที่ถูก
      } else {
        message.error(res?.data?.error || "แก้ไขข่าวสารไม่สำเร็จ");
      }
    } catch (e: any) {
      message.error(e?.response?.data?.error || "แก้ไขข่าวสารไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>แก้ไขข่าวสาร</Title>
          <Text type="secondary">ปรับหัวข้อ เนื้อหา ประเภท กลุ่มเป้าหมาย และรูปภาพ</Text>
        </Col>
      </Row>

      <Card loading={initialLoading}>
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item label="หัวข้อ" name="Title" rules={[required("กรุณากรอกหัวข้อ")]}>
            <Input maxLength={200} showCount placeholder="เช่น แจ้งปิดปรับปรุงระบบคืนนี้" />
          </Form.Item>

          <Form.Item label="เนื้อหา" name="Content" rules={[required("กรุณากรอกเนื้อหา")]}>
            <TextArea rows={5} maxLength={2000} showCount placeholder="รายละเอียดประกาศ" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="ประเภท" name="AnnouncementTypeID" rules={[required("เลือกประเภทประกาศ")]}>
                <Select placeholder="เลือกประเภท" options={types.map(t => ({ label: t.name, value: t.id }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="กลุ่มเป้าหมาย" name="AnnouncementTargetID" rules={[required("เลือกกลุ่มเป้าหมาย")]}>
                <Select placeholder="เลือกกลุ่มเป้าหมาย" options={targets.map(t => ({ label: t.name, value: t.id }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="อัปโหลดรูปภาพ" tooltip="รองรับ .jpg .png .webp .gif ไม่เกิน 5MB">
            <Upload {...uploadProps}><Button icon={<UploadOutlined />}>เลือกไฟล์</Button></Upload>
            {uploadedUrl && (
              <div style={{ marginTop: 12 }}>
                <img alt="preview" src={uploadedUrl} style={{ maxWidth: 360, borderRadius: 8 }} />
              </div>
            )}
          </Form.Item>

          {/* ซ่อนฟิลด์ Picture (เก็บ full url) */}
          <Form.Item name="Picture" hidden>
            <Input type="hidden" />
          </Form.Item>

          <Space>
            <Button onClick={() => navigate(-1)}>ยกเลิก</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              บันทึกการแก้ไข
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default EditAnnouncementPage;
