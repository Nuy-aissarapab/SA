import { useEffect, useMemo, useState } from "react";
import { Card, Form, DatePicker, InputNumber, Button, Select, message, Space } from "antd";
import dayjs from "dayjs";
import { GetContracts, RenewContract, GetStudents } from "../../../Service/https";
import type { ContractInterface } from "../../../interfaces/Contract";
import type { StudentInterface } from "../../../interfaces/Student";

const RequestContractRenewal = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [students, setStudents] = useState<StudentInterface[]>([]);
  const [contracts, setContracts] = useState<ContractInterface[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const role = localStorage.getItem("role");     // "student" | "admin"
  const userId = localStorage.getItem("id") || undefined;

  // ===== derived selected contract =====
  const selected = useMemo(
    () => contracts.find((c) => c.ID === selectedId),
    [contracts, selectedId]
  );

  // ===== admin: load students for dropdown filter =====
  useEffect(() => {
    if (role === "admin") {
      (async () => {
        try {
          const res = await GetStudents();
          if (res?.status === 200) setStudents(res.data);
          else messageApi.error(res?.data?.error || "โหลดรายชื่อนักศึกษาไม่สำเร็จ");
        } catch {
          messageApi.error("Network error while loading students");
        }
      })();
    }
  }, [role, messageApi]);

  // ===== fetch contracts (student: only own, admin: by selectedStudentId or all) =====
  const fetchContracts = async (studentId?: string) => {
    try {
      setLoading(true);
      const res = await GetContracts(studentId);
      if (res.status === 200) {
        setContracts(res.data);
        // clear selection if not in list
        if (selectedId && !res.data.some((c: ContractInterface) => c.ID === selectedId)) {
          setSelectedId(undefined);
        }
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

  // initial + whenever role/student filter changes
  useEffect(() => {
    if (role === "student") {
      setSelectedStudentId(userId);
      fetchContracts(userId);
    } else {
      fetchContracts(selectedStudentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, userId, selectedStudentId]);

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

    const body: any = {
      months: 3,
      start_date: startDate,
    };
    if (values.rate !== undefined && values.rate !== "") body.rate = Number(values.rate);

    try {
      setLoading(true);
      const res = await RenewContract(selectedId, body);
      if (res.status === 200) {
        messageApi.success("Contract renewed successfully!");
        form.resetFields();
        fetchContracts(role === "student" ? userId : selectedStudentId);
        setSelectedId(undefined);
      } else {
        messageApi.error(res?.data?.error || "Failed to renew contract");
      }
    } catch {
      messageApi.error("Network error while renewing");
    } finally {
      setLoading(false);
    }
  };

  const endValid = selected ? dayjs(selected.end_date).isValid() : false;

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
              <Select.Option key={s.StudentID} value={String(s.StudentID)}>
                {s.first_name} {s.last_name} (ID: {s.StudentID})
              </Select.Option>
            ))}
          </Select>
        </div>
      )}

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
              <DatePicker value={dayjs(selected.end_date).add(1, "day").add(3, "month")} disabled style={{ width: "100%" }} />
            </Form.Item>
          </>
        )}

        <Form.Item label="New Rate (optional)" name="rate">
          <InputNumber min={0} step={500} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} disabled={!selectedId || !endValid}>
              Renew 3 months
            </Button>
            <Button htmlType="reset" onClick={() => form.resetFields()}>
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default RequestContractRenewal;
