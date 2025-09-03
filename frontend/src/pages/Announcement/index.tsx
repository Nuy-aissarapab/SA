import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  List,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
  Popconfirm,
} from "antd";
import dayjs from "dayjs";

// เธอกำหนดให้คงบรรทัดนี้ไว้
import { DeleteAnnouncementById } from "../../Service/https";

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

type Role = "student" | "admin";
const roleFromStorage = () =>
  (localStorage.getItem("role") || "").toLowerCase() as Role;

// ===== Interfaces (frontend view models) =====
export type AnnouncementVM = {
  id: number;
  title: string;
  content: string;
  picture?: string | null;
  announcementTypeId?: number;
  announcementTargetId?: number;
  typeName?: string;
  targetName?: string;
  authorName?: string;
  updatedAt?: string; // ISO
};

export type Option = { id: number; name: string };

// ===== Utilities =====
const safeText = (s?: string | null) => (s ?? "").trim();

// Convert API row (gorm default casing) to VM
const toVM = (row: any): AnnouncementVM => ({
  id: row?.ID ?? row?.id,
  title: row?.Title ?? row?.title ?? "",
  content: row?.Content ?? row?.content ?? "",
  picture: row?.Picture ?? row?.picture ?? null,
  announcementTypeId:
    row?.AnnouncementTypeID ?? row?.announcement_type_id ?? row?.type_id,
  announcementTargetId:
    row?.AnnouncementTargetID ??
    row?.AnnouncementsTargetID ??
    row?.announcement_target_id ??
    row?.target_id,
  typeName:
    row?.AnnouncementType?.Name ??
    row?.announcement_type?.name ??
    row?.type_name,
  targetName:
    row?.AnnouncementsTarget?.Name ??
    row?.AnnouncementTarget?.Name ??
    row?.announcement_target?.name ??
    row?.target_name,
  authorName: row?.Admin?.First_Name
    ? `${row.Admin.First_Name} ${row.Admin.Last_Name ?? ""}`.trim()
    : row?.author_name,
  updatedAt: row?.UpdatedAt ?? row?.updated_at ?? row?.Updated_At,
});

// =====================
// Shared feed UI
// =====================
const AnnouncementFeed: React.FC<{ canCreate?: boolean }> = ({
  canCreate = false,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<AnnouncementVM[]>([]);
  const [filtered, setFiltered] = useState<AnnouncementVM[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [targets, setTargets] = useState<Option[]>([]);
  const [msgApi, ctx] = message.useMessage();
  const [deletingId, setDeletingId] = useState<number | null>(null); // <-- เพิ่ม

  const refresh = async () => {
    try {
      setLoading(true);
      const [annRes, typeRes, targetRes] = await Promise.all([
        GetAnnouncements(),
        ListAnnouncementTypes(),
        ListAnnouncementTargets(),
      ]);

      const rows = Array.isArray(annRes?.data)
        ? annRes.data
        : annRes?.data?.data || [];

      // 🟡 จัดเรียงใหม่ล่าสุดขึ้นก่อน (ใช้ UpdatedAt หรือ CreatedAt ก็ได้)
      rows.sort(
        (a: any, b: any) =>
          new Date(
            b.UpdatedAt || b.updated_at || b.CreatedAt || b.created_at
          ).getTime() -
          new Date(
            a.UpdatedAt || a.updated_at || a.CreatedAt || a.created_at
          ).getTime()
      );

      const vms = rows.map(toVM);
      setList(vms);
      setFiltered(vms);

      const typeRows = Array.isArray(typeRes?.data)
        ? typeRes.data
        : typeRes?.data?.data || [];
      setTypes(
        typeRows.map((r: any) => ({
          id: r?.ID ?? r?.id,
          name: r?.Name ?? r?.name,
        }))
      );

      const targetRows = Array.isArray(targetRes?.data)
        ? targetRes.data
        : targetRes?.data?.data || [];
      setTargets(
        targetRows.map((r: any) => ({
          id: r?.ID ?? r?.id,
          name: r?.Name ?? r?.name,
        }))
      );
    } catch (e: any) {
      console.error(e);
      msgApi.error(e?.response?.data?.error || "โหลดข่าวสารล้มเหลว");
      setList([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (value: string) => {
    const kw = value.trim().toLowerCase();
    if (!kw) {
      setFiltered(list);
      return;
    }
    setFiltered(
      list.filter(
        (a) =>
          safeText(a.title).toLowerCase().includes(kw) ||
          safeText(a.content).toLowerCase().includes(kw)
      )
    );
  };

  const typeNameOf = (vm: AnnouncementVM) =>
    vm.typeName ||
    types.find((t) => t.id === vm.announcementTypeId)?.name ||
    "-";
  const targetNameOf = (vm: AnnouncementVM) =>
    vm.targetName ||
    targets.find((t) => t.id === vm.announcementTargetId)?.name ||
    "-";

  // --- handler ลบ ---
  const handleDelete = async (id: number, title?: string) => {
    try {
      setDeletingId(id);
      const res = await DeleteAnnouncementById(id);
      if (res?.status === 200) {
        msgApi.success(
          res?.data?.message || `ลบข่าวสาร"${title || ""}" สำเร็จ`
        );
        setList((prev) => prev.filter((x) => x.id !== id));
        setFiltered((prev) => prev.filter((x) => x.id !== id));
      } else {
        msgApi.error(res?.data?.error || "ลบข่าวสารไม่สำเร็จ");
      }
    } catch (e: any) {
      msgApi.error(e?.response?.data?.error || "ลบข่าวสารไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  };

  const header = (
    <Row align="middle" justify="space-between" gutter={[8, 8]}>
      <Col>
        <Title level={3} style={{ margin: 0 }}>
          ข่าวสารหอพัก
        </Title>
      </Col>
      <Col>
        <Space>
          <Search
            placeholder="ค้นหาด้วยชื่อหรือเนื้อหา"
            allowClear
            onSearch={onSearch}
            style={{ width: 260 }}
          />
          {canCreate && (
            <Button
              type="primary"
              onClick={() => navigate("/announcements/create")}
            >
              เพิ่มข่าวสาร
            </Button>
          )}
        </Space>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: 16 }}>
      {ctx}
      {header}
      <div style={{ height: 12 }} />

      {loading ? (
        <>
          {[...Array(3)].map((_, i) => (
            <Card key={i} style={{ marginBottom: 12 }}>
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </Card>
          ))}
        </>
      ) : (
        <List
          dataSource={filtered}
          locale={{ emptyText: <Empty description="ไม่พบข่าวสาร" /> }}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <Card style={{ width: "100%" }} bodyStyle={{ padding: 16 }}>
                <Row gutter={[16, 16]}>
                  {item.picture ? (
                    <Col xs={24} sm={8} md={6} lg={5}>
                      <img
                        src={item.picture}
                        alt={item.title}
                        style={{
                          width: "100%",
                          borderRadius: 8,
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://via.placeholder.com/600x300?text=No+Image";
                        }}
                      />
                    </Col>
                  ) : null}
                  <Col flex="auto">
                    <Space
                      direction="vertical"
                      size={4}
                      style={{ width: "100%" }}
                    >
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Title level={4} style={{ margin: 0 }}>
                            {item.title || "(ไม่มีหัวข้อ)"}
                          </Title>
                        </Col>

                        {/* ...เดิม... */}
                        {canCreate && (
                          <Col>
                            <Space>
                              <Button
                                onClick={() =>
                                  navigate(`/announcements/${item.id}/edit`)
                                }
                              >
                                แก้ไข
                              </Button>

                              <Popconfirm
                                title="ลบข่าวสาร"
                                description={`ต้องการลบ "${item.title}" ใช่ไหม?`}
                                okText="ลบ"
                                cancelText="ยกเลิก"
                                okButtonProps={{
                                  danger: true,
                                  loading: deletingId === item.id,
                                }}
                                onConfirm={() =>
                                  handleDelete(item.id, item.title)
                                }
                              >
                                <Button danger loading={deletingId === item.id}>
                                  ลบ
                                </Button>
                              </Popconfirm>
                            </Space>
                          </Col>
                        )}
                      </Row>

                      <Space wrap>
                        <Tag>{typeNameOf(item)}</Tag>
                        <Tag color="blue">{targetNameOf(item)}</Tag>
                        {item.authorName && (
                          <Tag color="default">โดย {item.authorName}</Tag>
                        )}
                        {item.updatedAt && (
                          <Tag color="default">
                            {dayjs(item.updatedAt).isValid()
                              ? dayjs(item.updatedAt).format("DD/MM/YYYY HH:mm")
                              : ""}
                          </Tag>
                        )}
                      </Space>
                      <Paragraph style={{ marginTop: 4 }}>
                        {safeText(item.content) || "-"}
                      </Paragraph>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

// =====================
// Entry: choose per role
// =====================
const AnnouncementsPage: React.FC = () => {
  const role = roleFromStorage();
  const canCreate = role === "admin"; // นักศึกษาดูได้เหมือนกันแต่ไม่มีปุ่มเพิ่ม
  return <AnnouncementFeed canCreate={canCreate} />;
};

export default AnnouncementsPage;

// ==========================================
// src/Service/https/announcements.ts (service)
// ==========================================

import axios from "axios";

const apiUrl = import.meta.env.VITE_API_KEY || "http://localhost:8000";
const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");

const requestOptions = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  },
};

export async function GetAnnouncements() {
  return await axios
    .get(`${apiUrl}/announcements`, requestOptions)
    .then((res) => res)
    .catch((e) => e?.response);
}

export async function GetAnnouncementById(id: string | number) {
  return await axios
    .get(`${apiUrl}/announcements/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e?.response);
}

export interface CreateAnnouncementRequest {
  Title: string;
  Content: string;
  Picture?: string | null; // ส่งเป็น URL/base64 ตามที่ backend รองรับ
  AnnouncementTargetID: number;
  AnnouncementTypeID: number;
  AdminID?: number; // ถ้า backend ดึงจาก token ก็ไม่ต้องส่ง
}

export async function CreateAnnouncement(data: CreateAnnouncementRequest) {
  return await axios
    .post(`${apiUrl}/announcements`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e?.response);
}

export async function ListAnnouncementTypes() {
  return await axios
    .get(`${apiUrl}/announcement-types`, requestOptions)
    .then((res) => res)
    .catch((e) => e?.response);
}

export async function ListAnnouncementTargets() {
  return await axios
    .get(`${apiUrl}/announcement-targets`, requestOptions)
    .then((res) => res)
    .catch((e) => e?.response);
}
