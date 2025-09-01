import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  DatePicker,
  InputNumber,
  Button,
  Select,
  Space,
  Table,
  Popconfirm,
  message,
} from "antd";
import dayjs from "dayjs";
import {
  GetContracts,
  CreateContract,
  UpdateContractById,
  DeleteContractById,
  GetLatestEvidencesByStudents,        // ✅ เพิ่ม import นี้
} from "../../../Service/https";
import type { ContractInterface } from "../../../interfaces/Contract";

// ✨ รองรับฟิลด์หลักฐานในแถว
type ContractRow = ContractInterface & {
  evidence_data_url?: string;   // "data:image/png;base64,...."
  evidence_base64?: string;     // "AAAA...."
  evidence_mime?: string;       // "image/png" | "image/jpeg" | "application/pdf"
  evidence_file_url?: string;   // "http://localhost:8000/uploads/xxx.jpg"
};

const Managepayment = () => {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // helper: เปิด base64 ล้วน ๆ ในแท็บใหม่
  function openBase64InNewTab(base64: string, mime = "image/png") {
    const byteString = atob(base64);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  // ✅ โหลดสัญญา + ดึงสลิปล่าสุดต่อ student แล้ว merge เข้าแต่ละแถว
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await GetContracts();
      if (res?.status !== 200) {
        messageApi.error("โหลดข้อมูลสัญญาไม่สำเร็จ");
        setContracts([]);
        return;
      }

      let rows: ContractRow[] = res.data;

      // ดึง student ids ที่มีในตาราง
      const ids = Array.from(
        new Set(rows.map(r => r.Student_ID).filter((v): v is number => typeof v === "number"))
      );

      if (ids.length > 0) {
        const evRes = await GetLatestEvidencesByStudents(ids);
        if (evRes?.status === 200 && Array.isArray(evRes.data?.items)) {
          const evMap = new Map<number, { file_url?: string; data_url?: string; mime?: string }>();
          evRes.data.items.forEach((it: any) => {
            evMap.set(it.student_id, {
              file_url: it.file_url,
              data_url: it.data_url, // ถ้า backend ยังไม่ส่ง data_url มาก็จะเป็น undefined ซึ่งโอเค
              mime: it.mime,
            });
          });

          rows = rows.map(r => {
            const m = r.Student_ID ? evMap.get(r.Student_ID) : undefined;
            if (!m) return r;
            return {
              ...r,
              evidence_file_url: m.file_url,
              evidence_data_url: m.data_url,
              evidence_mime: m.mime,
            };
          });
        }
      }

      setContracts(rows);
    } catch (e) {
      messageApi.error("เกิดข้อผิดพลาดระหว่างโหลดข้อมูล");
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // สร้างสัญญา
  const handleCreate = async (values: any) => {
    const payload = {
      start_date: values.start_date.format("YYYY-MM-DD"),
      end_date: values.end_date.format("YYYY-MM-DD"),
      rate: values.rate,
      Student_ID: values.Student_ID,
    };

    const res = await CreateContract(payload);
    if (res?.status === 201) {
      messageApi.success("สร้างสัญญาสำเร็จ");
      fetchContracts();
      form.resetFields();
    } else {
      messageApi.error("ไม่สามารถสร้างสัญญาได้");
    }
  };

  // อัพเดตสัญญา
  const handleUpdate = async (values: any) => {
    if (!editingId) return;

    const payload = {
      start_date: values.start_date.format("YYYY-MM-DD"),
      end_date: values.end_date.format("YYYY-MM-DD"),
      rate: values.rate,
      Student_ID: values.Student_ID,
    };

    const res = await UpdateContractById(editingId.toString(), payload);
    if (res?.status === 200) {
      messageApi.success("อัพเดตสัญญาสำเร็จ");
      fetchContracts();
      form.resetFields();
      setEditingId(null);
    } else {
      messageApi.error("ไม่สามารถอัพเดตสัญญาได้");
    }
  };

  // ลบสัญญา
  const handleDelete = async (id: number) => {
    const res = await DeleteContractById(id.toString());
    if (res?.status === 200) {
      messageApi.success("ลบสัญญาสำเร็จ");
      fetchContracts();
    } else {
      messageApi.error("ไม่สามารถลบสัญญาได้");
    }
  };

  // กดแก้ไข => set ค่าเข้า form
  const handleEdit = (record: ContractRow) => {
    form.setFieldsValue({
      start_date: dayjs(record.start_date),
      end_date: dayjs(record.end_date),
      rate: record.rate,
      Student_ID: record.Student_ID,
    });
    setEditingId(record.ID!);
  };

  // คอลัมน์ตาราง (+ “สลิป”)
  const columns = [
    { title: "ContractID", dataIndex: "ContractID" },
    {
      title: "Start Date",
      dataIndex: "start_date",
      render: (date: string) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      render: (date: string) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    { title: "Rate", dataIndex: "rate" },
    {
      title: "Student",
      dataIndex: ["Student", "first_name"],
      render: (_: any, record: ContractRow) =>
        `${record.Student?.first_name ?? ""} ${record.Student?.last_name ?? ""}`,
    },
    {
      title: "สลิป",
      render: (_: any, r: ContractRow) => {
        if (r.evidence_data_url) {
          return (
            <a href={r.evidence_data_url} target="_blank" rel="noreferrer">
              เปิด (base64)
            </a>
          );
        }
        if (r.evidence_base64) {
          return (
            <a onClick={() => openBase64InNewTab(r.evidence_base64!, r.evidence_mime || "image/png")}>
              เปิด (base64)
            </a>
          );
        }
        if (r.evidence_file_url) {
          return (
            <a href={r.evidence_file_url} target="_blank" rel="noreferrer">
              เปิด (ไฟล์)
            </a>
          );
        }
        return "-";
      },
    },
    {
      title: "Action",
      render: (_: any, record: ContractRow) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            แก้ไข
          </Button>
          <Popconfirm title="ยืนยันการลบ?" onConfirm={() => handleDelete(record.ID!)}>
            <Button type="link" danger>
              ลบ
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="จัดการสัญญาเช่า">
      {contextHolder}
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
          <InputNumber placeholder="ค่าเช่า" />
        </Form.Item>
        <Form.Item name="Student_ID" rules={[{ required: true, message: "กรุณาเลือกผู้เช่า" }]}>
          <Select placeholder="เลือกผู้เช่า" style={{ width: 200 }}>
            {/* TODO: ดึงรายชื่อ Student มาจาก API */}
            <Select.Option value={1}>Student 1</Select.Option>
            <Select.Option value={2}>Student 2</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {editingId ? "อัพเดต" : "เพิ่ม"}
          </Button>
        </Form.Item>
        {editingId && (
          <Form.Item>
            <Button
              onClick={() => {
                form.resetFields();
                setEditingId(null);
              }}
            >
              ยกเลิก
            </Button>
          </Form.Item>
        )}
      </Form>

      <Table rowKey="ContractID" columns={columns as any} dataSource={contracts} loading={loading} />
    </Card>
  );
};

export default Managepayment;
