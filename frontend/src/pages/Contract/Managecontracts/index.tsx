import { useEffect, useState } from "react";
import {
  Card, Form, DatePicker, InputNumber, Button, Select,
  Space, Table, Popconfirm, message
} from "antd";
import dayjs from "dayjs";
import { GetContracts, CreateContract, UpdateContractById, DeleteContractById, GetStudents } from "../../../Service/https";
import type { ContractInterface } from "../../../interfaces/Contract";
import type { StudentInterface } from "../../../interfaces/Student";

const Managecontracts = () => {
  const [contracts, setContracts] = useState<ContractInterface[]>([]);
  const [students, setStudents] = useState<StudentInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const role = localStorage.getItem("role");   // "student" | "admin"
  const userId = localStorage.getItem("id");   // string

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
        const res = await GetStudents();
        if (res?.status === 200) setStudents(res.data);
        else messageApi.error(res?.data?.error || "โหลดรายชื่อนักศึกษาไม่สำเร็จ");
      } catch {
        messageApi.error("เครือข่ายมีปัญหา ระหว่างโหลดรายชื่อนักศึกษา");
      }
    })();
  }, [role]);

  // ====== คอลัมน์ตาราง ======
  const columns = [
    { title: "Contract ID", dataIndex: "ID" },
    { title: "Start Date", dataIndex: "start_date", render: (d: string) => (d ? dayjs(d).format("YYYY-MM-DD") : "-") },
    { title: "End Date", dataIndex: "end_date", render: (d: string) => (d ? dayjs(d).format("YYYY-MM-DD") : "-") },
    { title: "Rate", dataIndex: "rate" },
    {
      title: "Student",
      render: (_: any, r: ContractInterface) =>
        `${r.Student?.first_name ?? ""} ${r.Student?.last_name ?? ""}`.trim(),
    },
    // ซ่อน Action สำหรับ student
    role !== "student" && {
      title: "Action",
      render: (_: any, record: ContractInterface) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              form.setFieldsValue({
                start_date: rSafeDate(record.start_date),
                end_date: rSafeDate(record.end_date),
                rate: record.rate,
                // ใช้ StudentID (FK) เป็น value ของ Select
                StudentID: record.Student_ID,
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

// ===== helpers =====
const rSafeDate = (v?: string) => (v ? dayjs(v) : undefined);

// ===== local DTO types (ใช้เฉพาะไฟล์นี้) =====
type ContractCreatePayload = {
  start_date: string;
  end_date: string;
  rate: number;
  StudentID: number;
};
type ContractUpdatePayload = Partial<ContractCreatePayload>;

// ===== handlers =====
const handleCreate = async (values: any) => {
  // สร้าง payload ที่เป็น string YYYY-MM-DD ให้ backend
  const payload: ContractCreatePayload = {
    start_date: values.start_date?.format("YYYY-MM-DD"),
    end_date: values.end_date?.format("YYYY-MM-DD"),
    rate: Number(values.rate),
    StudentID: Number(values.StudentID),
  };

  // Service ยังรับ ContractInterface -> แคสต์ตอนส่ง
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

  const res = await UpdateContractById(
    String(editingId),
    payload as unknown as ContractInterface
  );

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

  return (
    <Card title="จัดการสัญญาเช่า">
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

          <Form.Item name="StudentID" rules={[{ required: true, message: "กรุณาเลือกผู้เช่า" }]}>
            <Select placeholder="เลือกผู้เช่า" style={{ width: 220 }} loading={students.length === 0}>
              {students.map((s) => (
                <Select.Option key={s.StudentID} value={s.StudentID}>
                  {s.first_name} {s.last_name} (ID: {s.StudentID})
                </Select.Option>
              ))}
            </Select>
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

      <Table
        rowKey="ID"
        columns={columns}
        dataSource={contracts}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default Managecontracts;
