import { useEffect, useState } from "react";
import {
  Card, Form, DatePicker, InputNumber, Button, Select,
  Space, Table, Popconfirm, message, Tag, Image, Modal, Typography
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

import type { ContractInterface } from "../../../interfaces/Contract";
import type { StudentInterface } from "../../../interfaces/Student";
import {
  GetContracts,
  CreateContract,
  UpdateContractById,
  DeleteContractById,
  GetStudents,
  GetLatestEvidencesByStudent,
  GetRooms
} from "../../../Service/https";
import { evidenceToImgSrc } from "../../../Service/https";
import type { LatestEvidenceResp } from "../../../interfaces/LatestEvidenceResp";

// ===== types =====
type ContractWithRenewal = ContractInterface & {
  renewal_pending?: boolean | null;
  renewal_status?: string | null;
  renewal_start_date?: string | null;
  renewal_end_date?: string | null;
  renewal_months?: number | null;
  renewal_rate?: number | null;
  Student_ID?: number;
  Room_ID?: number;
  Room?: { ID?: number; room_number?: string | number; RoomNumber?: string | number } | null;
};
type ContractRow = ContractWithRenewal;

const Managecontracts = () => {//contracts ตัวเรียกแสดง setContracts ตัวจัดการ
  const [contracts, setContracts] = useState<ContractRow[]>([]); 
  const [students, setStudents] = useState<StudentInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Viewer รูปล่าสุด
  const [eviOpen, setEviOpen] = useState(false);
  const [eviLoading, setEviLoading] = useState(false);
  const [eviData, setEviData] = useState<LatestEvidenceResp | null>(null);
  const [latestMap, setLatestMap] = useState<Record<number, LatestEvidenceResp | null>>({});

  const role = localStorage.getItem("role");   // "student" | "admin"
  const userId = localStorage.getItem("id");

  // ===== helpers =====
  const rSafeDate = (v?: string) => (v ? dayjs(v) : undefined); //แปลงสตริงเป็น dayjs
  const isRealDate = (s?: string | null) => !!s && dayjs(s).isValid() && dayjs(s).year() >= 1900;//เช็คว่าวันที่ถูกต้องและปี ≥ 1900

  type RenewalStatus = "pending" | "approved" | "rejected" | undefined; 
  const getRenewalStatus = (r: ContractWithRenewal): RenewalStatus => //คืนสถานะต่อสัญญาแบบย่อ
    (r.renewal_status as RenewalStatus) ?? (r.renewal_pending ? "pending" as RenewalStatus : undefined);  
  const nextRenewalStatus = (s: RenewalStatus): Exclude<RenewalStatus, undefined> => {
    if (s === undefined) return "pending";
    if (s === "pending") return "approved";
    if (s === "approved") return "rejected";
    return "pending";
  };

  const shouldUseRenewal = (r: ContractRow) => // มีการกดต่อสัญญาแล้วหรือยัง (ใช้เพื่อเลือกช่วงวันที่แสดง)
    (r.renewal_status === "pending" || r.renewal_status === "approved" || r.renewal_pending === true) &&
    isRealDate(r.renewal_start_date) &&
    isRealDate(r.renewal_end_date);

  const getDisplayStart = (r: ContractRow) =>
    shouldUseRenewal(r) ? r.renewal_start_date! : r.start_date;

  const getDisplayEnd = (r: ContractRow) =>
    shouldUseRenewal(r) ? r.renewal_end_date! : r.end_date;

  const mapRenewalStatus = (status?: string | null, pendingFlag?: boolean | null) => {
    const s = status ?? (pendingFlag ? "pending" : undefined);
    switch (s) {
      case "approved": return "การต่อสัญญาเสร็จสิ้น";
      case "pending":  return "รออนุมัติกรุณาชำระเงิน";
      case "rejected": return "ยังไม่ต่อสัญญา";
      default:         return "-";
    }
  };
  const colorRenewalStatus = (status?: string | null, pendingFlag?: boolean | null) => {
    const s = status ?? (pendingFlag ? "pending" : undefined);
    return s === "approved" ? "green"
         : s === "pending"  ? "gold"
         : s === "rejected" ? "red"
         : "default";
  };

  // ===== NEW: เตือนใกล้หมดอายุ (≤ 14 วัน) และยังไม่ต่อ =====
  const EXPIRY_THRESHOLD_DAYS = 14;

  const daysLeft = (s?: string | null) =>
    isRealDate(s) ? dayjs(s!).diff(dayjs(), "day") : Infinity;

  const isExpiringSoon = (r: ContractRow) => {
    const st = r.renewal_status ?? (r.renewal_pending ? "pending" : undefined);
    if (st === "approved" || st === "pending") return false;
    const dl = daysLeft(getDisplayEnd(r));
    return dl >= 0 && dl <= EXPIRY_THRESHOLD_DAYS;
  };

  const openEvidence = async (studentId?: number) => {
    if (!studentId) {
      messageApi.warning("ไม่พบ StudentID ของรายการนี้");
      return;
    }
    setEviOpen(true);
    setEviLoading(true);
    try {
      const res = await GetLatestEvidencesByStudent(Number(studentId));
      if (res?.status === 200) setEviData(res.data as LatestEvidenceResp);
      else {
        setEviData(null);
        messageApi.error(res?.data?.error || "ดึงรูปล่าสุดไม่สำเร็จ");
      }
    } catch {
      setEviData(null);
      messageApi.error("เครือข่ายมีปัญหา ระหว่างโหลดรูป");
    } finally {
      setEviLoading(false);
    }
  };

  // ===== local DTO types =====
  type ContractCreatePayload = {
    start_date: string;
    end_date: string;
    rate: number;
    StudentID: number;
    Room_ID?: number;     
  };
  type ContractUpdatePayload = Partial<ContractCreatePayload> & {
    renewal_status?: "pending" | "approved" | "rejected" | string;
    renewal_pending?: boolean;
  };

  // ===== เปลี่ยนสถานะต่อสัญญา =====
  const handleChangeRenewalStatus = async (
    record: ContractWithRenewal,
    value: "pending" | "approved" | "rejected"
  ) => {
    const payload: ContractUpdatePayload = {
      renewal_status: value,
      renewal_pending: value === "pending",
    };
    const res = await UpdateContractById(String(record.ID), payload as any);
    if (res?.status === 200) {
      messageApi.success("อัปเดตสถานะสำเร็จ");
      await fetchContracts();
    } else {
      messageApi.error(res?.data?.error || "อัปเดตสถานะไม่สำเร็จ");
    }
  };

  // ===== ดึงข้อมูลสัญญา + หลักฐานล่าสุด =====
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await GetContracts(role === "student" ? (userId ?? undefined) : undefined);
      if (res?.status === 200) {
        const items = res.data as ContractRow[];
        setContracts(items);

        const pairs = await Promise.all(
          items.map(async (c) => {
            const sid = c.ID ?? c.Student?.ID ?? (c as any).Student_ID;
            if (!sid) return [0, null] as [number, LatestEvidenceResp | null];
            try {
              const evRes = await GetLatestEvidencesByStudent(Number(sid));
              return [Number(sid), evRes?.status === 200 ? (evRes.data as LatestEvidenceResp) : null] as const;
            } catch {
              return [Number(sid), null] as const;
            }
          })
        );

        const map: Record<number, LatestEvidenceResp | null> = {};
        for (const [sid, ev] of pairs) {
          if (sid) map[sid] = ev;
        }
        setLatestMap(map);
      } else {
        messageApi.error(res?.data?.error || "โหลดข้อมูลสัญญาไม่สำเร็จ");
      }
    } catch {
      messageApi.error("เครือข่ายมีปัญหา ระหว่างโหลดสัญญา");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== "admin") return;
    (async () => {
      try {
        setLoadingRooms(true);
        const res = await GetRooms();
        if (res?.status === 200) setRooms(res.data);
        else messageApi.error(res?.data?.error || "โหลดรายการห้องไม่สำเร็จ");
      } catch {
        messageApi.error("เครือข่ายมีปัญหา ระหว่างโหลดรายการห้อง");
      } finally {
        setLoadingRooms(false);
      }
    })();
  }, [role]);

  useEffect(() => { fetchContracts(); }, [role, userId]);

  // โหลดรายชื่อนักศึกษา (เฉพาะ admin)
  useEffect(() => {
    if (role !== "admin") return;
    (async () => {
      try {
        setLoadingStudents(true);
        const res = await GetStudents();
        if (res?.status === 200) setStudents(res.data);
        else messageApi.error(res?.data?.error || "โหลดรายชื่อนักศึกษาไม่สำเร็จ");
      } catch {
        messageApi.error("เครือข่ายมีปัญหา ระหว่างโหลดรายชื่อนักศึกษา");
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, [role]);

  const handleCreate = async (values: any) => {
    const payload: ContractCreatePayload = {
      start_date: values.start_date?.format("YYYY-MM-DD"),
      end_date: values.end_date?.format("YYYY-MM-DD"),
      rate: Number(values.rate),
      StudentID: Number(values.StudentID),
      Room_ID: values.Room_ID != null ? Number(values.Room_ID) : undefined,
    };
    const res = await CreateContract(payload as unknown as ContractInterface);
    if (res?.status === 200 || res?.status === 201) {
      messageApi.success("สร้างสัญญาสำเร็จ");
      await fetchContracts();
      form.resetFields();
    } else {
      messageApi.error(res?.data?.error || "ไม่สามารถสร้างสัญญาได้");
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editingId) return;
    const payload: ContractUpdatePayload = {
      start_date: values.start_date?.format("YYYY-MM-DD"),
      end_date: values.end_date?.format("YYYY-MM-DD"),
      rate: values.rate != null ? Number(values.rate) : undefined,
      StudentID: values.StudentID != null ? Number(values.StudentID) : undefined,
      Room_ID: values.Room_ID != null ? Number(values.Room_ID) : undefined,
    };
    const res = await UpdateContractById(String(editingId), payload as unknown as ContractInterface);
    if (res?.status === 200) {
      messageApi.success("อัปเดตสัญญาสำเร็จ");
      await fetchContracts();
      form.resetFields();
      setEditingId(null);
    } else {
      messageApi.error(res?.data?.error || "ไม่สามารถอัปเดตสัญญาได้");
    }
  };

  const handleDelete = async (id: number) => {
    const res = await DeleteContractById(String(id));
    if (res?.status === 200) {
      messageApi.success("ลบสัญญาสำเร็จ");
      await fetchContracts();
    } else {
      messageApi.error(res?.data?.error || "ไม่สามารถลบสัญญาได้");
    }
  };

  // ===== columns =====
  const columns: ColumnsType<ContractRow> = [
    { title: "Student ID", dataIndex: "StudentID", key: "StudentID" },
    { title: "Contract ID", dataIndex: "ID", key: "ID" },

    {
      title: "วันที่เริ่ม",
      key: "start",
      render: (_: any, r) =>
        isRealDate(getDisplayStart(r)) ? dayjs(getDisplayStart(r)).format("YYYY-MM-DD") : "-",
    },
    {
      title: "วันที่สิ้นสุด",
      key: "end",
      render: (_: any, r) =>
        isRealDate(getDisplayEnd(r)) ? dayjs(getDisplayEnd(r)).format("YYYY-MM-DD") : "-",
    },

    { title: "ค่าเช่า", dataIndex: "rate", key: "rate" },

    // แสดงเลขห้อง
    {
      title: "ห้อง",
      key: "room",
      render: (_: any, r) => {
        const roomNo =
          r.Room?.room_number ??
          r.Room?.RoomNumber ??
          (r as any).Room_Number ??
          r.Room_ID ??
          "-";
        return String(roomNo ?? "-");
      },
    },

    {
      title: "ผู้เช่า",
      key: "student",
      render: (_: any, r) =>
        `${r.Student?.first_name ?? ""} ${r.Student?.last_name ?? ""}`.trim() || "-",
    },

    {
      title: "หลักฐานการชำระเงิน",
      key: "latest_evidence_main",
      render: (_: any, r) => {
        const sid = r.StudentID ?? r.Student?.ID ?? (r as any).Student_ID;
        const hasEvidence = !!(sid && latestMap[sid]?.evidence);
        return hasEvidence ? (
          <Button size="small" onClick={() => openEvidence(Number(sid))}>
            ดูรูป
          </Button>
        ) : (
          <span style={{ color: "#aaa" }}>ไม่มีรูป</span>
        );
      },
    },

    // ใช้แจ้งเตือนใกล้หมดอายุ (≤14 วัน) ถ้ายังไม่ได้ต่อ
    {
      title: "สถานะต่อสัญญา",
      key: "renewal_status",
      render: (_: unknown, r: ContractRow) => {
        const soon  = isExpiringSoon(r);
        const text  = soon ? "ยังไม่ต่อสัญญา" : mapRenewalStatus(r.renewal_status, r.renewal_pending);
        const color = soon ? "red" : colorRenewalStatus(r.renewal_status, r.renewal_pending);

        const handleClick = () => {
          const current = getRenewalStatus(r);
          const next = nextRenewalStatus(current);
          handleChangeRenewalStatus(r, next);
        };

        return (
          <a onClick={handleClick} style={{ cursor: "pointer" }}>
            <Tag color={color}>{text}</Tag>
          </a>
        );
      },
    },

    role !== "student"
      ? {
          title: "Action",
          key: "action",
          render: (_: any, record: ContractRow) => (
            <Space>
              <Button
                type="link"
                onClick={() => {
                  setEditingId(record.ID!);

                  const studentValue =
                    (record as any).StudentID ??
                    record.Student?.ID ??
                    (record as any).Student_ID;

                  const roomId =
                    (record as any).Room_ID ??
                    (record as any).RoomID ??
                    record.Room?.ID;

                  form.setFieldsValue({
                    start_date: rSafeDate(getDisplayStart(record)),
                    end_date: rSafeDate(getDisplayEnd(record)),
                    rate: record.rate,
                    StudentID: studentValue ? Number(studentValue) : undefined,
                    Room_ID: roomId ? Number(roomId) : undefined,
                  });
                }}
              >
                แก้ไข
              </Button>
              <Popconfirm title="ยืนยันการลบ?" onConfirm={() => handleDelete(record.ID!)}>
                <Button type="link" danger>
                  ลบ
                </Button>
              </Popconfirm>
            </Space>
          ),
        }
      : (null as any),
  ].filter(Boolean) as ColumnsType<ContractRow>;

  const renewalColumns: ColumnsType<ContractRow> = [
    { title: "Contract ID", dataIndex: "ID", key: "ID" },
    {
      title: "ผู้เช่า",
      key: "student",
      render: (_: any, r) =>
        `${r.Student?.first_name ?? ""} ${r.Student?.last_name ?? ""}`.trim() || "-",
    },
    {
      title: "Current End",
      dataIndex: "end_date",
      key: "current_end",
      render: (d: string) => (d ? dayjs(d).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "สถานะต่อสัญญา",
      key: "renewal_status",
      render: (_: unknown, r: ContractRow) => {
        const soon  = isExpiringSoon(r);
        const text  = soon ? "ยังไม่ต่อสัญญา" : mapRenewalStatus(r.renewal_status, r.renewal_pending);
        const color = soon ? "red" : colorRenewalStatus(r.renewal_status, r.renewal_pending);

        const handleClick = () => {
          const current = getRenewalStatus(r);
          const next = nextRenewalStatus(current);
          handleChangeRenewalStatus(r, next);
        };

        return (
          <a onClick={handleClick} style={{ cursor: "pointer" }}>
            <Tag color={color}>{text}</Tag>
          </a>
        );
      },
    },
    {
      title: "หลักฐานการชำระเงิน",
      key: "latest_evidence",
      render: (_: any, r) => {
        const sid = r.ID ?? r.Student?.ID ?? (r as any).Student_ID;
        return (
          <Button size="small" onClick={() => openEvidence(Number(sid))}>
            ดูรูป
          </Button>
        );
      },
    },
  ];

  const pendingContracts = contracts.filter(
    (c) => (c.renewal_status ?? (c.renewal_pending ? "pending" : undefined)) === "pending"
  );

  return (
    <Card
      title="จัดการสัญญาเช่า"
      extra={
        role === "admin" && (
          <Space>
            <Link to="/Contract/Extendcontract/EvidenceGallery">
              <Button
                style={{
                  backgroundColor: "#253543",
                  borderRadius: 30,
                  color: "#FFFFFF",
                  height: 40,
                  padding: "0 24px",
                  fontSize: 16,
                  minWidth: 140,
                }}
              >
                หลักฐานการชำระเงินทั้งหมด
              </Button>
            </Link>
          </Space>
        )
      }
    >
      {contextHolder}

      {/* ฟอร์มเฉพาะแอดมิน */}
      {role !== "student" && (
        <Form
          form={form}
          layout="inline"
          onFinish={handleCreate}
          style={{ marginBottom: 20 }}
        >
          <Form.Item name="start_date" rules={[{ required: true, message: "กรุณาเลือกวันเริ่ม" }]}>
            <DatePicker placeholder="วันเริ่ม" />
          </Form.Item>

          <Form.Item name="end_date" rules={[{ required: true, message: "กรุณาเลือกวันสิ้นสุด" }]}>
            <DatePicker placeholder="วันสิ้นสุด" />
          </Form.Item>

          <Form.Item name="rate" rules={[{ required: true, message: "กรุณากรอกค่าเช่า" }]}>
            <InputNumber placeholder="ค่าเช่า" style={{ width: 140 }} />
          </Form.Item>

          {/* ✅ ช่องกรอกเลขห้อง */}
          <Form.Item
            name="Room_ID"
            rules={[{ required: true, message: "กรุณาเลือกห้อง" }]}
          >
            <Select
              placeholder="เลือกห้อง"
              style={{ width: 160 }}
              showSearch
              loading={loadingRooms}
              optionFilterProp="label"
              options={rooms.map((r) => {
                const id = (r as any).ID ?? (r as any).Room_ID;
                const label = `ห้อง ${r.room_number ?? r.RoomNumber ?? id}`;
                return { value: Number(id), label };
              })}
            />
          </Form.Item>

          <Form.Item
            name="StudentID"
            rules={[{ required: true, message: "กรุณาเลือกผู้เช่า" }]}
          >
            <Select
              placeholder="เลือกผู้เช่า"
              style={{ width: 220 }}
              showSearch
              loading={loadingStudents}
              optionFilterProp="label"
              options={students.map((s) => {
                const id = (s as any).ID ?? (s as any).StudentID;
                const label = `${s.first_name ?? ""} ${s.last_name ?? ""} (ID: ${id})`.trim();
                return { value: Number(id), label };
              })}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">เพิ่ม</Button>
              <Button
                onClick={async () => {
                  const values = await form.validateFields();
                  await handleUpdate(values);
                }}
                disabled={!editingId}
              >
                อัปเดต
              </Button>

              {editingId && (
                <Button
                  onClick={() => {
                    form.resetFields();
                    setEditingId(null);
                  }}
                >
                  ยกเลิก
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      )}

      {/* ตารางสัญญาปกติ */}
      <Table
        rowKey="ID"
        columns={columns}
        dataSource={contracts}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* ตารางคำขอต่อสัญญารออนุมัติ */}
      {role === "admin" && (
        <Card title="คำขอต่อสัญญารออนุมัติ" style={{ marginTop: 20 }}>
          <Table
            rowKey="ID"
            columns={renewalColumns}
            dataSource={pendingContracts}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      {/* Modal แสดงรูปล่าสุด */}
      <Modal
        title={
          <Space>
            <Typography.Text strong>รูปล่าสุดของผู้ใช้</Typography.Text>
            {eviData?.student_id ? (
              <Typography.Text type="secondary">#{eviData.student_id}</Typography.Text>
            ) : null}
          </Space>
        }
        open={eviOpen}
        onCancel={() => setEviOpen(false)}
        footer={null}
        width={720}
      >
        {eviLoading ? (
          <div style={{ textAlign: "center", padding: 24 }}>กำลังโหลด...</div>
        ) : !eviData?.evidence ? (
          <Typography.Text type="secondary">ไม่พบรูปล่าสุด</Typography.Text>
        ) : (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Image
              src={evidenceToImgSrc(eviData.evidence)}
              alt={eviData.evidence.file_name}
            />
            <Typography.Text type="secondary">
              {eviData.evidence.file_name} · {eviData.evidence.date} · {eviData.evidence.mime_type}
            </Typography.Text>
            {eviData.evidence.note ? (
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {eviData.evidence.note}
              </Typography.Paragraph>
            ) : null}
            {eviData.evidence.url ? (
              <Button type="link" href={eviData.evidence.url} target="_blank" rel="noopener">
                เปิดรูปแบบเต็ม
              </Button>
            ) : null}
          </Space>
        )}
      </Modal>
    </Card>
  );
};

export default Managecontracts;
