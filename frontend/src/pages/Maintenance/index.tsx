import { useEffect, useMemo, useState } from "react";
import { Button, Table, Tag, message, Space, Modal, Image, Select, Tooltip, } from "antd";
import { EyeOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { GetMaintenances, GetMyMaintenances, DeleteMaintenance, GetMaintenanceStatuses, UpdateMaintenanceStatus } from "../../Service/https";
import type { MaintenanceInterface } from "../../interfaces/Maintenance";
import type { MaintenanceStatusInterface } from "../../interfaces/MaintenanceStatus";

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000";

export default function MaintenancePage() {
  const [rows, setRows] = useState<MaintenanceInterface[]>([]);
  const [statuses, setStatuses] = useState<MaintenanceStatusInterface[]>([]);
  const [loading, setLoading] = useState(false);
  // preview modal
  const [openPreview, setOpenPreview] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewSrc, setPreviewSrc] = useState("");

  const [messageApi, contextHolder] = message.useMessage();
  const role = (localStorage.getItem("role") || "").toLowerCase(); // "student" | "admin"
  const myId = localStorage.getItem("id");

  const getOwnerId = (r: any) =>
    r?.StudentID ?? r?.student_id ?? r?.Student?.ID ?? r?.student?.id;

  const getStatusObj = (r: any) => ({
    id: r?.MaintenanceStatusID ?? r?.maintenance_status_id,
    name: r?.MaintenanceStatus?.StatusName ?? r?.maintenance_status?.status_name ?? "-",
  });

  const getRoomNumber = (r: any) => r?.Room?.RoomNumber ?? r?.room?.RoomNumber ;
  const getStudentName = (r: any) =>
    r?.Student?.First_Name ?? r?.student?.first_name ?? r?.Student?.first_name ?? "-";
  const getTitle = (r: any) => r?.Title ?? r?.title ?? "-";
  const getDate = (r: any) => r?.ReportDate ?? r?.report_date;
  const getImageUrl = (r: any) => r?.ImageURL ?? r?.image_url ?? "";

  const isOwner = (r: any) => myId && String(getOwnerId(r)) === String(myId);
  const canStudentEditDelete = (r: any) => {
    const sName = getStatusObj(r).name;
    return role === "student" && isOwner(r) && sName === "แจ้งซ่อม";
  };

  async function fetchAll() {
    try {
      setLoading(true);
      // student → myOnly toggle / admin → all
      const mRes =
        role === "admin"  ? await GetMaintenances() : await GetMyMaintenances();

      if (mRes?.status === 200) setRows(mRes.data);
      else messageApi.error(mRes?.data?.error || "โหลดรายการแจ้งซ่อมล้มเหลว");

      // โหลดสถานะให้ admin ใช้เลือก
      if (role === "admin") {
        const sRes = await GetMaintenanceStatuses();
        if (sRes?.status === 200) setStatuses(sRes.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const statusOptions = useMemo(
    () =>
      statuses.map((s) => ({
        value: s.ID!,
        label: s.StatusName ?? s.status_name!,
      })),
    [statuses]
  );

  const statusColor = (name: string) =>
    name === "เสร็จสิ้น" ? "green" : name === "กำลังดำเนินการ" ? "geekblue" : "gold";

  const openImagePreview = (row: any) => {
    const url = getImageUrl(row);
    if (!url) {
      messageApi.info("รายการนี้ไม่มีรูปภาพ");
      return;
    }
    setPreviewTitle(getTitle(row));
    setPreviewSrc(`${API_URL}${url}`);
    setOpenPreview(true);
  };

  const handleDelete = async (id: number) => {
  const res = await DeleteMaintenance(id);
  if (res?.status === 200) {
    messageApi.success("ลบสำเร็จ");
    fetchAll();
  } else {
    messageApi.error(res?.data?.error || `ลบไม่สำเร็จ (HTTP ${res?.status || "-"})`);
  }
};

  const handleUpdateStatus = async (row: any, newStatusId: number) => {
    const res = await UpdateMaintenanceStatus(row.ID!, { maintenance_status_id: newStatusId });
    if (res?.status === 200) {
      messageApi.success("อัปเดตสถานะสำเร็จ");
      fetchAll();
    } else {
      messageApi.error(res?.data?.error || "อัปเดตสถานะไม่สำเร็จ");
    }
  };

  const columns: any[] = [
    { title: "รหัส", dataIndex: "ID", width: 80 },
    {
      title: "หัวข้อ",
      render: (_: any, r: any) => (
        <Space direction="vertical" size={0}>
          <strong>{getTitle(r)}</strong>
          <span style={{ color: "#999" }}>
            {dayjs(getDate(r)).isValid() ? dayjs(getDate(r)).format("DD/MM/YYYY HH:mm") : "-"}
          </span>
        </Space>
      ),
    },
    {
      title: "ประเภทปัญหา",
      render: (_: any, r: any) => r?.ProblemType?.TypeName ?? r?.problem_type?.type_name ?? "-",
      width: 160,
    },
    {
      title: "รายละเอียด",
      render: (_: any, r: any) => (
        <div
          title={r?.Detail ?? r?.detail ?? "-"}
        >
          {r?.Detail ?? r?.detail ?? "-"}
        </div>
      ),
    },
    { title: "ห้อง", render: (_: any, r: any) => getRoomNumber(r), width: 90 },
    { title: "ผู้แจ้ง", render: (_: any, r: any) => getStudentName(r), width: 140 },
    {
      title: "สถานะ",
      width: 230,
      render: (_: any, r: any) => {
        const s = getStatusObj(r);
        if (role === "admin") {
          return (
            <Select
              style={{ width: 210 }}
              value={Number(s.id) || undefined}
              options={statusOptions}
              onChange={(v) => handleUpdateStatus(r, v)}
            />
          );
        }
        return <Tag color={statusColor(s.name)}>{s.name}</Tag>;
      },
    },
    {
      title: "รูปภาพ",
      width: 140,
      render: (_: any, r: any) => {
        const url = getImageUrl(r);
        if (!url) return "-";
        return (
          <Tooltip title="ดูรูป">
            <Button icon={<EyeOutlined />} onClick={() => openImagePreview(r)}>
              ดูรูป
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: "การจัดการ",
      width: 240,
      render: (_: any, r: any) => {
        const btns: JSX.Element[] = [];
        if (role === "admin") {
          btns.push(
            <Button
              key="del-a"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(r.ID!)}
            >
              ลบ
            </Button>
          );
        } else if (canStudentEditDelete(r)) {
          btns.push(
            <Button
              key="edit"
              icon={<EditOutlined />}
              onClick={() => (window.location.href = `/Maintenance/Edit/${r.ID}`)}
            >
              แก้ไข
            </Button>
          );
          btns.push(
            <Button
              key="del-s"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(r.ID!)}
            >
              ลบ
            </Button>
          );
        }
        return <Space>{btns}</Space>;
      },
    },
  ];

  return (
    <div>
      {contextHolder}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Space>
          <h2 style={{ margin: 0 }}>รายการแจ้งซ่อม</h2>
        </Space>
        <Space>
          {role === "student" && (
            <Link to="/Maintenance/Create">
              <Button type="primary">แจ้งซ่อมใหม่</Button>
            </Link>
          )}
        </Space>
      </div>

      <Table
        rowKey="ID"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 10 }}
      />

      {/* Image Preview Modal (ในหน้าเดิม ไม่เด้งแท็บ) */}
      <Modal
        open={openPreview}
        title={previewTitle || "รูปภาพแจ้งซ่อม"}
        footer={null}
        onCancel={() => setOpenPreview(false)}
        width={720}
      >
        {previewSrc ? (
          <Image src={previewSrc} width="100%" style={{ borderRadius: 8 }} preview={false} />
        ) : (
          <div style={{ textAlign: "center", color: "#999" }}>ไม่พบรูปภาพ</div>
        )}
      </Modal>
    </div>
  );
}
