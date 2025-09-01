// EvidenceGallery.tsx
import { Card, List, Image, Tag, Space, Typography, Empty } from "antd";
import { useEffect, useState } from "react";
import axios from "axios";
const { Text } = Typography;

type EvidenceItem = {
  ID: number;
  address: string;      // เช่น "/uploads/evidence_xxx.jpg" หรือ "uploads\xxx.jpg"
  date: string;
  note?: string;
  student_id: number;
  student_name?: string;
  student_code?: string;
  file_name?: string;
  mime_type?: string;
};

const EvidenceGallery = () => {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("id");

  // ✅ ตั้งค่า baseURL และแนบ token
  const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";
  const token = localStorage.getItem("token");
  const client = axios.create({
    baseURL: API,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  // ✅ แปลง path ให้ปลอดภัย + ต่อ URL เสมอ
  const normPath = (p?: string) => {
    if (!p) return "";
    const s = p.replace(/\\/g, "/").trim();              // Windows \ -> /
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    const withSlash = s.startsWith("/") ? s : `/${s}`;   // ให้มี / นำหน้า
    return `${API}${withSlash}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await client.get("/evidences", {
        params: role === "student" ? { studentId: userId } : {},
      });
      if (res?.status === 200) {
        // บาง backend คืน {items: [...]}; บางอันคืน array ตรง ๆ
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setItems(data || []);
      }
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, userId]);

  return (
    <Card title="หลักฐานการโอน">
      <List
        loading={loading}
        locale={{ emptyText: <Empty description="No data" /> }}
        grid={{ gutter: 16, column: 4 }}
        dataSource={items}
        renderItem={(it) => {
          const raw = normPath(it.address);
          const src = raw ? encodeURI(raw) : ""; // กันช่องว่าง/ภาษาไทย
          const isImage =
            (!!it.mime_type && it.mime_type.startsWith("image/")) ||
            /\.(png|jpe?g|gif|webp)$/i.test(src);
          const isPdf =
            it.mime_type === "application/pdf" || /\.pdf$/i.test(src);

          return (
            <List.Item key={it.ID}>
              <Card
                hoverable
                size="small"
                cover={
                  !src ? (
                    <div
                      style={{
                        height: 180,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#fafafa",
                      }}
                    >
                      <Text type="secondary">ไม่พบไฟล์</Text>
                    </div>
                  ) : isImage ? (
                    // ✅ คลิกรูปแล้วเปิดแท็บใหม่
                    <a href={src} target="_blank" rel="noreferrer">
                      <Image
                        src={src}
                        alt={it.file_name || ""}
                        height={180}
                        style={{ objectFit: "cover" }}
                        preview={false}
                      />
                    </a>
                  ) : isPdf ? (
                    <div
                      style={{
                        height: 180,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#fafafa",
                      }}
                    >
                      <a href={src} target="_blank" rel="noreferrer">
                        เปิดไฟล์ PDF
                      </a>
                    </div>
                  ) : (
                    <div
                      style={{
                        height: 180,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#fafafa",
                      }}
                    >
                      <Text type="secondary">ไม่รองรับการพรีวิวไฟล์นี้</Text>
                    </div>
                  )
                }
              >
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <Text strong>{it.file_name || "ไฟล์แนบ"}</Text>
                  <Text type="secondary">
                    อัปโหลดโดย: {it.student_name || `ID: ${it.student_id}`}
                    {it.student_code ? ` • รหัส: ${it.student_code}` : ""}
                  </Text>
                  <Tag>{it.date}</Tag>
                  {it.note ? <Text>{it.note}</Text> : null}

                  {/* ✅ แสดงลิงก์เสมอ */}
                  {src && (
                    <a href={src} target="_blank" rel="noreferrer">
                      เปิดไฟล์ในแท็บใหม่
                    </a>
                  )}
                </Space>
              </Card>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default EvidenceGallery;
