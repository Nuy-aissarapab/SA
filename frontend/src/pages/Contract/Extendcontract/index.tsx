import { useEffect, useMemo, useState } from "react";
import { Card, Form, DatePicker, InputNumber, Button, Select, message, Space, Modal, Table, Tag } from "antd";
import dayjs from "dayjs";
import type { ContractInterface } from "../../../interfaces/Contract";
import type { StudentInterface } from "../../../interfaces/Student";
import { useNavigate } from "react-router-dom";
import { GetContracts, RequestRenewContract, GetStudents } from "../../../Service/https";

// เพิ่ม type เสริมสำหรับฟิลด์ renewal + payment_status
type ContractWithRenewal = ContractInterface & {
  renewal_pending?: boolean;
  renewal_status?: string | null;
  renewal_start_date?: string | null;
  renewal_end_date?: string | null;
  renewal_months?: number | null;
  renewal_rate?: number | null;
  payment_status?: "pending" | "paid" | "failed" | string | null; // ★
};

const RequestContractRenewal = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const [students, setStudents] = useState<StudentInterface[]>([]);
  const [contracts, setContracts] = useState<ContractWithRenewal[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [hideForm, setHideForm] = useState<boolean>(false);

  const role = localStorage.getItem("role");     // "student" | "admin"
  const userId = localStorage.getItem("id") || undefined;

  const selected = useMemo(
    () => contracts.find((c) => c.ID === selectedId),
    [contracts, selectedId]
  );

  const fetchContracts = async (studentId?: string) => {
    try {
      setLoading(true);
      const res = await GetContracts(studentId);
      if (res.status === 200) {
        const data: ContractWithRenewal[] = res.data;
        setContracts(data);

        // ซ่อนฟอร์มเมื่อมีคำขอที่ยัง pending อยู่
        const hasPending = data.some((c) => c.renewal_status === "pending" || c.renewal_pending);
        setHideForm(hasPending);

        if (selectedId && !data.some((c) => c.ID === selectedId)) setSelectedId(undefined);
      } else {
        setContracts([]);
        messageApi.error(res?.data?.error || "Failed to load contracts");
      }
    } catch {
      setContracts([]);
      messageApi.error("Network error while loading contracts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "student") {
      setSelectedStudentId(userId);
      fetchContracts(userId);
    } else {
      fetchContracts(selectedStudentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, userId, selectedStudentId]);

  // โหลดรายชื่อนักศึกษา (โหมดแอดมิน)
  useEffect(() => {
    if (role !== "admin") return;
    (async () => {
      try {
        const res = await GetStudents();
        if (res.status === 200) setStudents(res.data);
      } catch {
        /* เงียบไว้พอ */
      }
    })();
  }, [role]);

  // เติม rate เดิมลงฟอร์มเมื่อเปลี่ยนสัญญา
  useEffect(() => {
    if (selected?.rate != null) form.setFieldsValue({ rate: selected.rate });
    else form.resetFields(["rate"]);
  }, [selected, form]);

  const onFinish = async (values: any) => {
    if (!selectedId || !selected) {
      messageApi.warning("Please select a contract first");
      return;
    }
    const end = dayjs(selected.end_date);
    if (!end.isValid()) {
      messageApi.error("This contract has invalid end date");
      return;
    }

    const startDate = end.add(1, "day").format("YYYY-MM-DD");

    // ★ เพิ่ม payment_status: "pending"
    const body: any = {
      months: 3,
      start_date: startDate,
      payment_status: "pending",
    };
    if (values.rate !== undefined && values.rate !== "") body.rate = Number(values.rate);

    try {
      setLoading(true);
      const res = await RequestRenewContract(selectedId, body);
      if (res.status === 200) {
        navigate("/Contract", { state: { flash: "renewal_submitted" } });
        form.resetFields();
        setSelectedId(undefined);
        return;
      } else {
        messageApi.error(res?.data?.error || "Failed to create renewal request");
      }
    } catch {
      messageApi.error("Network error while renewing");
    } finally {
      setLoading(false);
    }
  };

  const endValid = selected ? dayjs(selected.end_date).isValid() : false;

  // ===== table columns for status =====
  const statusText = (c: ContractWithRenewal) => {
    if (c.renewal_status === "approved") return "การต่อสัญญาเสร็จสิ้น";
    if (c.renewal_status === "pending" || c.renewal_pending) return "รออนุมัติกรุณาชำระเงิน";
    if (c.renewal_status === "rejected") return "คำขอถูกปฏิเสธ";
    return "-";
  };
  const statusColor = (c: ContractWithRenewal) => {
    if (c.renewal_status === "approved") return "green";
    if (c.renewal_status === "pending" || c.renewal_pending) return "gold";
    if (c.renewal_status === "rejected") return "red";
    return "default";
  };

  // ★ แสดงสถานะชำระเงิน
  const paymentText = (s?: string | null) =>
    s === "pending" ? "รอชำระเงิน" : s === "paid" ? "ชำระแล้ว" : s === "failed" ? "ชำระไม่สำเร็จ" : "-";
  const paymentColor = (s?: string | null) =>
    s === "pending" ? "gold" : s === "paid" ? "green" : s === "failed" ? "red" : "default";

  const statusColumns = [
    { title: "Contract ID", dataIndex: "ID" },
    {
      title: "ช่วงสัญญาปัจจุบัน",
      render: (_: any, r: ContractWithRenewal) =>
        `${dayjs(r.start_date).format("YYYY-MM-DD")} → ${dayjs(r.end_date).format("YYYY-MM-DD")}`,
    },
    {
      title: "ช่วงต่อสัญญา (ถ้ามี)",
      render: (_: any, r: ContractWithRenewal) =>
        r.renewal_start_date && r.renewal_end_date
          ? `${dayjs(r.renewal_start_date).format("YYYY-MM-DD")} → ${dayjs(r.renewal_end_date).format("YYYY-MM-DD")}`
          : "-",
    },
    {
      title: "สถานะต่อสัญญา",
      render: (_: any, r: ContractWithRenewal) => <Tag color={statusColor(r)}>{statusText(r)}</Tag>,
    },
    {
      title: "สถานะการชำระเงิน", // ★ เพิ่มคอลัมน์
      render: (_: any, r: ContractWithRenewal) => (
        <Tag color={paymentColor(r.payment_status)}>{paymentText(r.payment_status)}</Tag>
      ),
    },
  ];

  return (
    <Card title="Request Contract Renewal" style={{ maxWidth: 700, margin: "0 auto" }}>
      {contextHolder}

      {/* admin-only: filter by student */}
      {role === "admin" && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ marginRight: 8 }}>Filter by Student:</span>
          <Select
            allowClear
            placeholder="All students"
            style={{ minWidth: 260 }}
            value={selectedStudentId}
            onChange={(val) => setSelectedStudentId(val)}
          >
            {students.map((s) => (
              <Select.Option key={s.ID} value={String(s.ID)}>
                {s.first_name} {s.last_name} (ID: {s.ID})
              </Select.Option>
            ))}
          </Select>
        </div>
      )}

      {/* ซ่อนฟอร์มเมื่อมีคำขอที่ยัง pending */}
      {!hideForm && (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Select Contract" required>
            <Select
              placeholder="Select a contract"
              loading={loading}
              value={selectedId}
              onChange={(id) => setSelectedId(Number(id))}
            >
              {contracts.map((c) => (
                <Select.Option key={c.ID} value={c.ID}>
                  Contract #{c.ID} ({dayjs(c.start_date).format("YYYY-MM-DD")} → {dayjs(c.end_date).format("YYYY-MM-DD")})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {selected && endValid && (
            <>
              <Form.Item label="Current End Date">
                <DatePicker value={dayjs(selected.end_date)} disabled style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Renew Start (auto)">
                <DatePicker value={dayjs(selected.end_date).add(1, "day")} disabled style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Renew End (auto: +3 months)">
                <DatePicker
                  value={dayjs(selected.end_date).add(1, "day").add(3, "month")}
                  disabled
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </>
          )}

          <Form.Item label="New Rate (optional)" name="rate">
            <InputNumber min={0} step={500} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} disabled={!selectedId || !endValid}>
                ส่งคำขอต่อสัญญา (3 เดือน)
              </Button>
              <Button htmlType="reset" onClick={() => form.resetFields()}>
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}

      {/* ตารางสถานะ */}
      <Card size="small" title="สถานะต่อสัญญาของสัญญา" style={{ marginTop: 16 }}>
        <Table rowKey="ID" columns={statusColumns as any} dataSource={contracts} loading={loading} pagination={{ pageSize: 5 }} />
      </Card>
    </Card>
  );
};

export default RequestContractRenewal;
