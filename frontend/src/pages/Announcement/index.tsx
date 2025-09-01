import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  List,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Upload,
  message,
  Empty,
  Tooltip,
  Typography,
} from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

// ===== mock service (เปลี่ยนเป็นของโปรเจกต์จริง) =====
import {
  GetAnnouncements, // GET /announcements?category=&target=&q=&page=
  CreateAnnouncement, // POST /announcements
} from "../../Service/https";

type Role = "student" | "admin";
const roleFromStorage = () =>
  (localStorage.getItem("role") || "").toLowerCase() as Role;

type Announcement = {
  id: number;
  title: string;
  content: string;
  image_url?: string | null;
  category: "ทั่วไป" | "การเงิน" | "หอพัก" | "กิจกรรม" | "ด่วน";
  target: "นักศึกษาทั้งหมด" | "ปี1" | "ปี2" | "ปี3" | "ปี4" | "ศิษย์เก่า";
  author_name: string;
  updated_at: string; // ISO
};

const CATEGORY_OPTIONS = [
  "ทั่วไป",
  "การเงิน",
  "หอพัก",
  "กิจกรรม",
  "ด่วน",
] as const;
const TARGET_OPTIONS = [
  "นักศึกษาทั้งหมด",
  "ปี1",
  "ปี2",
  "ปี3",
  "ปี4",
  "ศิษย์เก่า",
] as const;

const { Text, Paragraph } = Typography;

// ====== ฟอร์มลงประกาศ (Modal) ======
const CreateAnnouncementModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // รูปแบบ payload — ปรับตาม backend เธอ
      const payload = new FormData();
      payload.append("title", values.title);
      payload.append("content", values.content);
      payload.append("category", values.category);
      payload.append("target", values.target);
      payload.append("publish_at", values.publish_at?.toISOString() ?? "");
      if (file) payload.append("image", file);

      const res = await CreateAnnouncement(payload);
      if (res?.status === 201 || res?.status === 200) {
        message.success("ลงประกาศสำเร็จ");
        form.resetFields();
        setFile(null);
        onSuccess();
        onClose();
      } else {
        message.error(res?.data?.error || "ลงประกาศไม่สำเร็จ");
      }
    } catch (e) {
      // validation หรือข้อผิดพลาดอื่น
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="ลงประกาศ"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="ลงประกาศ"
      confirmLoading={submitting}
      width={720}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="หัวข้อ"
          name="title"
          rules={[{ required: true, message: "กรอกหัวข้อ" }]}
        >
          <Input placeholder="เช่น นักศึกษาค้างชำระค่าหอพัก" />
        </Form.Item>

        <Form.Item
          label="หมวดหมู่"
          name="category"
          rules={[{ required: true }]}
        >
          <Select
            options={CATEGORY_OPTIONS.map((v) => ({ value: v, label: v }))}
            placeholder="เลือกหมวดหมู่"
          />
        </Form.Item>

        <Form.Item
          label="กลุ่มเป้าหมาย"
          name="target"
          initialValue="นักศึกษาทั้งหมด"
          rules={[{ required: true }]}
        >
          <Select
            options={TARGET_OPTIONS.map((v) => ({ value: v, label: v }))}
          />
        </Form.Item>

        <Form.Item label="วันเวลาเผยแพร่ (ออปชัน)" name="publish_at">
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="เนื้อหา"
          name="content"
          rules={[{ required: true, message: "กรอกเนื้อหา" }]}
        >
          <Input.TextArea rows={6} placeholder="รายละเอียดประกาศ..." />
        </Form.Item>

        <Form.Item label="รูปแนบ (ออปชัน)">
          <Upload
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            onRemove={() => setFile(null)}
            maxCount={1}
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>อัปโหลดรูป</Button>
          </Upload>
          <Text type="secondary">
            * ถ้าไม่แนบ จะใช้พื้นที่รูปสีเทาเหมือนต้นแบบ
          </Text>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ====== หน้าหลักประกาศ ======
const AnnouncementPage: React.FC = () => {
  const role = roleFromStorage();

  // ตัวกรอง
  const [category, setCategory] = useState<string | undefined>();
  const [target, setTarget] = useState<string | undefined>();
  const [q, setQ] = useState<string>("");

  // ข้อมูลประกาศ
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);

  const fetchData = async (reset = false) => {
    try {
      setLoading(true);
      const pageNum = reset ? 1 : page;
      const res = await GetAnnouncements({
        category: category || "",
        target: target || "",
        q,
        page: pageNum,
        limit: 10,
      });

      const list: Announcement[] = res?.data?.items ?? [];
      const total: number = res?.data?.total ?? list.length;

      setItems(reset ? list : [...items, ...list]);
      setHasMore(pageNum * 10 < total);
      setPage(pageNum + 1);
    } catch (e) {
      message.error("โหลดประกาศไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // โหลดรอบแรก
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เปลี่ยนตัวกรอง => รีโหลด
  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, target]);

  const headerBar = useMemo(
    () => (
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 12 }}>
        <Col flex="auto">
          <Card style={{ borderRadius: 16, background: "#f6f7f8" }}>
            <Space wrap>
              <Select
                allowClear
                placeholder="ประเภท"
                style={{ minWidth: 160 }}
                value={category}
                onChange={setCategory}
                options={CATEGORY_OPTIONS.map((v) => ({ value: v, label: v }))}
              />
              <Select
                allowClear
                placeholder="กลุ่มเป้าหมาย"
                style={{ minWidth: 180 }}
                value={target}
                onChange={setTarget}
                options={TARGET_OPTIONS.map((v) => ({ value: v, label: v }))}
              />
              <Input.Search
                placeholder="ค้นหาข่าวสาร"
                allowClear
                onSearch={(val) => {
                  setQ(val);
                  fetchData(true);
                }}
                style={{ minWidth: 220 }}
              />
            </Space>
          </Card>
        </Col>

        {role === "admin" && (
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              style={{
                borderRadius: 12,
                paddingInline: 20,
                background: "#24323B",
              }}
              onClick={() => setOpenCreate(true)}
            >
              ลงประกาศ
            </Button>
          </Col>
        )}
      </Row>
    ),
    [category, target, q, role]
  );

  return (
    <div style={{ padding: 16 }}>
      {/* หัวข้อใหญ่ด้านบน (ตามต้นแบบ) */}
      <Card
        style={{ marginBottom: 12, borderRadius: 16, background: "#f1f2f3" }}
      >
        <Tag
          style={{
            paddingInline: 12,
            paddingBlock: 6,
            borderRadius: 18,
            fontWeight: 600,
          }}
        >
          นักศึกษาค้างชำระค่าหอพัก
        </Tag>
      </Card>

      {headerBar}

      {/* รายการข่าว */}
      <List
        dataSource={items}
        loading={loading}
        locale={{ emptyText: <Empty description="ยังไม่มีประกาศ" /> }}
        renderItem={(it) => (
          <Card
            key={it.id}
            style={{
              borderRadius: 18,
              marginBottom: 14,
              background: "#f6f7f8",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <Row gutter={[16, 16]}>
              {/* พื้นที่รูปตามต้นแบบ */}
              <Col xs={24} md={10}>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "4 / 3",
                    borderRadius: 24,
                    background: "#ddd",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {it.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.image_url}
                      alt={it.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#888",
                        fontStyle: "italic",
                      }}
                    >
                      {/* // รูปที่ว่างไว้ */}
                      // รูปที่ว่างไว้
                    </div>
                  )}
                </div>
              </Col>

              {/* ส่วนเนื้อหาข่าว */}
              <Col xs={24} md={14}>
                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                  <div>
                    <Tag color="blue" style={{ borderRadius: 16 }}>
                      {it.category}
                    </Tag>
                    <Tag style={{ borderRadius: 16 }}>{it.target}</Tag>
                  </div>

                  <Text strong style={{ fontSize: 18 }}>
                    {it.title}
                  </Text>
                  <Paragraph
                    ellipsis={{ rows: 4, expandable: true, symbol: "อ่านต่อ" }}
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      padding: 12,
                      margin: 0,
                    }}
                  >
                    {it.content}
                  </Paragraph>

                  <Space style={{ opacity: 0.85 }}>
                    <Text type="secondary">นาย {it.author_name}</Text>
                    <Text type="secondary">•</Text>
                    <Tooltip
                      title={dayjs(it.updated_at).format("DD/MM/YYYY HH:mm:ss")}
                    >
                      <Text type="secondary">
                        Last Update -{" "}
                        {dayjs(it.updated_at).format("DD/MM/YYYY HH:mm")}
                      </Text>
                    </Tooltip>
                  </Space>
                </Space>
              </Col>
            </Row>
          </Card>
        )}
      />

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Button onClick={() => fetchData()} loading={loading}>
            โหลดเพิ่ม
          </Button>
        </div>
      )}

      {/* Modal ลงประกาศสำหรับ Admin */}
      {role === "admin" && (
        <CreateAnnouncementModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onSuccess={() => fetchData(true)}
        />
      )}
    </div>
  );
};

export default AnnouncementPage;
