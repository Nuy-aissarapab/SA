import { useEffect, useState } from "react";
import {
  Card, Form, DatePicker, InputNumber, Button, Select,
  Space, Table, Popconfirm, message, Tag
} from "antd";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { GetContracts, CreateContract, UpdateContractById, DeleteContractById, GetStudents } from "../../../Service/https";
import type { ContractInterface } from "../../../interfaces/Contract";
import type { StudentInterface } from "../../../interfaces/Student";

// เสริม type ฟิลด์ renewal
type ContractWithRenewal = ContractInterface & {
  renewal_pending?: boolean;
  renewal_status?: string | null;
  renewal_start_date?: string | null;
  renewal_end_date?: string | null;
  renewal_months?: number | null;
  renewal_rate?: number | null;
  Student_ID?: number;
};

const Managecontracts = () => {
  const [contracts, setContracts] = useState<ContractWithRenewal[]>([]);
  const [students, setStudents] = useState<StudentInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loadingStudents, setLoadingStudents] = useState(false);

  const role = localStorage.getItem("role");   // "student" | "admin"
  const userId = localStorage.getItem("id");

  // ===== helpers =====
  const rSafeDate = (v?: string) => (v ? dayjs(v) : undefined);
  const getRenewalStatus = (r: ContractWithRenewal) =>
    r.renewal_status ?? (r.renewal_pending ? "pending" : undefined);

  const toggleRenewalStatus = async (record: ContractWithRenewal) => {
    const current = getRenewalStatus(record);
    const next: "pending" | "approved" = current === "approved" ? "pending" : "approved";
    const payload: ContractUpdatePayload = {
      renewal_status: next,
      renewal_pending: next === "pending",
    };
    const res = await UpdateContractById(String(record.ID), payload as any);
    if (res?.status === 200) {
      messageApi.success("อัปเดตสถานะสำเร็จ");
      await fetchContracts();
    } else {
      messageApi.error(res?.data?.error || "อัปดตสถานะไม่สำเร็จ");
    }
  };

  const pendingContracts = contracts.filter(
    (c) => (c.renewal_status ?? (c.renewal_pending ? "pending" : undefined)) === "pending"
  );

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await GetContracts(role === "student" ? (userId ?? undefined) : undefined);
      if (res?.status === 200) setContracts(res.data);
      else messageApi.error(res?.data?.error || "โหลดข้อมูลสัญญาไม่สำเร็จ");
    } catch {
      messageApi.error("เครือข่ายมีปัญหา ระหว่างโหลดสัญญา");
    } finally {
      setLoading(false);
    }
  };

  // โหลดสัญญาตามบทบาท
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

  // ===== local DTO types (ใช้เฉพาะไฟล์นี้) =====
  type ContractCreatePayload = {
    start_date: string;
    end_date: string;
    rate: number;
    StudentID: number;
  };
  type ContractUpdatePayload = Partial<ContractCreatePayload> & {
    renewal_status?: string;
    renewal_pending?: boolean;
  };

  // ===== handlers: CRUD สัญญาปกติ =====
  const handleCreate = async (values: any) => {
    const payload: ContractCreatePayload = {
      start_date: values.start_date?.format("YYYY-MM-DD"),
      end_date: values.end_date?.format("YYYY-MM-DD"),
      rate: Number(values.rate),
      StudentID: Number(values.StudentID),
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

  // ====== คอลัมน์ตารางหลัก ======
  const columns = [
    { title: "Contract ID", dataIndex: "ID" },
    { title: "Start Date", dataIndex: "start_date", render: (d: string) => (d ? dayjs(d).format("YYYY-MM-DD") : "-") },
    { title: "End Date", dataIndex: "end_date", render: (d: string) => (d ? dayjs(d).format("YYYY-MM-DD") : "-") },
    { title: "Rate", dataIndex: "rate" },
    {
      title: "Student",
      render: (_: any, r: ContractWithRenewal) =>
        `${r.Student?.first_name ?? ""} ${r.Student?.last_name ?? ""}`.trim(),
    },
    {
      title: "สถานะต่อสัญญา",
      render: (_: any, r: ContractWithRenewal) => {
        const status = getRenewalStatus(r);
        const text =
          status === "approved" ? "การต่อสัญญาเสร็จสิ้น" :
          status === "pending"  ? "รออนุมัติกรุณาชำระเงิน" :
          "-";
        const color =
          status === "approved" ? "green" :
          status === "pending"  ? "gold"  :
          "default";

        const handleClick = () => {
          if (!status) {
            // ถ้ายังไม่มีสถานะ → เริ่มเป็น pending
            handleChangeRenewalStatus(r, "pending");
          } else {
            // มีสถานะแล้ว → toggle ไปอีกฝั่ง
            toggleRenewalStatus(r);
          }
        };

        return (
          <a onClick={handleClick} style={{ cursor: "pointer" }}>
            <Tag color={color}>{text}</Tag>
          </a>
        );
      }
    },
    // ซ่อน Action สำหรับ student
    role !== "student" && {
      title: "Action",
      render: (_: any, record: ContractWithRenewal) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              const studentValue =
                (record as any).Student_ID ??
                (record as any).StudentID ??
                record.Student?.StudentID ??
                record.Student?.StudentID;

              form.setFieldsValue({
                start_date: rSafeDate(record.start_date),
                end_date: rSafeDate(record.end_date),
                rate: record.rate,
                StudentID: studentValue ? Number(studentValue) : undefined,
              });
              setEditingId(record.ID!);
            }}
          >
            แก้ไข
          </Button>
          <Popconfirm title="ยืนยันการลบ?" onConfirm={() => handleDelete(record.ID!)}>
            <Button type="link" danger>ลบ</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(Boolean) as any;

  // ===== เปลี่ยนสถานะต่อสัญญา (เรียกใช้จากหลายที่ได้) =====
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

  // ===== คอลัมน์ตารางคำขอต่อสัญญา (pending) =====
  const renewalColumns: any[] = [
    { title: "Contract ID", dataIndex: "ID" },
    {
      title: "Student",
      render: (_: any, r: ContractWithRenewal) =>
        `${r.Student?.first_name ?? ""} ${r.Student?.last_name ?? ""}`.trim(),
    },
    {
      title: "Current End",
      dataIndex: "end_date",
      render: (d: string) => (d ? dayjs(d).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "สถานะ",
      render: (_: any, r: ContractWithRenewal) => {
        const status = getRenewalStatus(r);
        const next = status === "approved" ? "pending" : "approved";
        const text =
          status === "approved" ? "การต่อสัญญาเสร็จสิ้น" :
          status === "pending"  ? "รออนุมัติกรุณาชำระเงิน" :
          "-";
        const color =
          status === "approved" ? "green" :
          status === "pending"  ? "gold"  :
          "default";

        return (
          <a onClick={() => handleChangeRenewalStatus(r, next as "pending" | "approved")}>
            <Tag color={color}>{text}</Tag>
          </a>
        );
      }
    },
  ];

  return (
    <Card
      title="จัดการสัญญาเช่า"
      // ✅ ปุ่มเฉพาะ Admin (มุมขวาบนของ Card)
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
                หลักฐานการโอน
              </Button>
            </Link>
          </Space>
        )
      }
    >
      {contextHolder}

      {/* ฟอร์มแสดงเฉพาะแอดมิน */}
      {role !== "student" && (
        <Form
          form={form}
          layout="inline"
          onFinish={editingId ? handleUpdate : handleCreate}
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
                const id = (s as any).StudentID ?? (s as any).ID; // รองรับทั้ง 2 แบบ
                const label = `${s.first_name ?? ""} ${s.last_name ?? ""} (ID: ${id})`.trim();
                return { value: Number(id), label };
              })}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingId ? "อัปเดต" : "เพิ่ม"}
            </Button>
          </Form.Item>

          {editingId && (
            <Form.Item>
              <Button onClick={() => { form.resetFields(); setEditingId(null); }}>
                ยกเลิก
              </Button>
            </Form.Item>
          )}
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
    </Card>
  );
};

export default Managecontracts;
