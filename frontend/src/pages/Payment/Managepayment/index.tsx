// pages/admin/PaymentManage.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, Table, Tag, Button, Space, Modal, Image, message, Typography, Dropdown } from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { PaymentInterface } from "../../../interfaces/Payment";
import type { StudentInterface } from "../../../interfaces/Student";
import { GetPayment,GetLatestEvidencesByStudents, UpdatePaymentStatus, UpdatePaymentMethod } from "../../../Service/https/index";

import { Link } from "react-router-dom";

const { Text } = Typography;

type EvidenceBrief = {
  student_id: number;
  evidence?:
    | {
        Address?: string;
        address?: string;
        Note?: string;
        note?: string;
        Date?: string;
        date?: string;
        OriginalName?: string;
        original_name?: string;
      }
    | null;
};

const statusOptions = [
  { label: "ชำระเงินเสร็จสิ้น", value: "paid" },
  { label: "คงเหลือชำระ", value: "remaining" },
  { label: "ค้างชำระ", value: "pending" },
] as const;

const pick = <T,>(...vals: Array<T | undefined | null>) =>
  vals.find((v) => v !== undefined && v !== null) as T | undefined;

const getStatusLabel = (val?: string | null) => {
  if (!val) return "-";
  const v = (val || "").toLowerCase();
  const found = statusOptions.find((opt) => opt.value === v);
  return found ? found.label : "-";
};

const getStatusColor = (val?: string | null) => {
  if (!val) return "default";
  const v = (val || "").toLowerCase();
  if (v === "paid") return "green";
  if (v === "remaining") return "blue";
  if (v === "pending") return "gold";
  return "default";
};

const fmtDate = (s?: string) => (s ? dayjs(s).format("YYYY-MM-DD HH:mm") : "-");

// ----- helpers สำหรับใบเสร็จ (BillingID) -----
const getReceiptId = (r: any): number | undefined =>
  r?.BillingID ?? r?.billing_id ?? r?.Billing?.ID ?? r?.billing?.id;

const formatReceiptFromAny = (r: any) => {
  const id = getReceiptId(r);
  return id ? `B${String(id).padStart(6, "0")}` : "-";
};

export default function PaymentManage() {
  const [list, setList] = useState<PaymentInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);
  const [slipSrc, setSlipSrc] = useState<string | undefined>(undefined);
  const [messageApi, contextHolder] = message.useMessage();
  const [updatingId, setUpdatingId] = useState<number | null>(null);           // สำหรับเปลี่ยนสถานะ paid/pending/remaining
  const [methodUpdatingId, setMethodUpdatingId] = useState<number | null>(null); // ★ NEW: สำหรับเปลี่ยน method
  const [evMap, setEvMap] = useState<Record<number, EvidenceBrief["evidence"]>>({});

  const getStudentFullName = (s?: StudentInterface) =>
    s ? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() : "";

  // field resolvers
  const getStatusValue = (r: any): string => {
    const v: string = r?.Payment_Status ?? r?.payment_status ?? "";
    return (v || "").toLowerCase();
  };

  const renderStatus = (_: any, r: any) => {
    const v = getStatusValue(r);
    if (v === "paid") return "ชำระเงินเสร็จสิ้น";
    if (v === "pending") return "ค้างชำระ";
    if (v === "remaining") return "คงเหลือชำระ";
    return "-";
  };

  const getAmountValue = (row: PaymentInterface) => pick<number>(row.Amount as any, (row as any).amount);

  const getPayDateValue = (row: PaymentInterface) =>
    pick<string>(row.Payment_Date as any, (row as any).payment_date, (row as any).Payment_Date);

  // fetch data + normalize คีย์ให้ตรง
  const fetchPayments = async () => {
    setLoading(true);
    const res = await GetPayment();
    setLoading(false);
    if (res?.status === 200) {
      const raw = res.data as any[];
      const normalized: PaymentInterface[] = raw.map((r) => {
        const student = r.Student ?? r.student ?? undefined;
        const receiver = r.Receiver ?? r.receiver ?? undefined;
        const billing = r.Billing ?? r.billing ?? undefined;
        const billingID = getReceiptId(r);

        return {
          ...r,
          Payment_Status: pick<string | null>(r.Payment_Status, r.payment_status) as any,
          Amount: pick<number>(r.Amount, r.amount),
          Payment_Date: pick<string>(r.Payment_Date, r.payment_date),
          Method: pick<string>(r.Method, r.method),                                   // ← อ่าน method ไม่ว่าจะตัวเล็ก/ใหญ่
          PayerName: pick<string>(r.PayerName, r.payer_name),
          ReceiptNumber:
            r.ReceiptNumber ?? r.receipt_number ?? (billingID ? `B${String(billingID).padStart(6, "0")}` : undefined),

          StudentID: pick<number>(r.StudentID, r.student_id) ?? student?.StudentID ?? student?.id,
          BillingID: billingID,

          Student: student,
          Billing: billing,
          Receiver: receiver,

          student,
          billing,
          receiver,
        } as any;
      });
      setList(normalized);
    } else {
      messageApi.error(res?.data?.error || "โหลดรายการชำระเงินล้มเหลว");
    }
  };

  const studentIdList = useMemo(() => {
    const ids = new Set<number>();
    list.forEach((p: any) => {
      if (p.StudentID) ids.add(p.StudentID);
      const sidFromObj = p?.Student?.StudentID ?? p?.student?.StudentID ?? p?.student?.id;
      if (sidFromObj) ids.add(Number(sidFromObj));
    });
    return Array.from(ids);
  }, [list]);

  const fetchLatestEvidences = async () => {
    if (studentIdList.length === 0) return;
    const res = await GetLatestEvidencesByStudents(studentIdList);
    if (res?.status === 200 && Array.isArray(res.data)) {
      const map: Record<number, EvidenceBrief["evidence"]> = {};
      (res.data as EvidenceBrief[]).forEach((x) => {
        if (typeof x?.student_id === "number") map[x.student_id] = x?.evidence ?? null;
      });
      setEvMap(map);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);
  useEffect(() => {
    fetchLatestEvidences(); // eslint-disable-next-line
  }, [studentIdList.join(",")]);

  const openSlip = (stuId?: number) => {
    if (!stuId) return;
    const ev = evMap[stuId];
    if (!ev) return messageApi.warning("ยังไม่มีหลักฐานอัปโหลด");
    const addr = ev.Address || ev.address;
    if (!addr) return messageApi.warning("ไม่พบไฟล์หลักฐาน");
    setSlipSrc(addr);
    setSlipOpen(true);
  };

  const setStatus = async (row: PaymentInterface, status: "paid" | "pending" | "remaining" | null) => {
    if (!row.ID) return;
    try {
      setUpdatingId(Number(row.ID));
      const res = await UpdatePaymentStatus(row.ID, status);
      if (res?.status === 200) {
        messageApi.success(
          status === "paid"
            ? "ตั้งค่าสถานะเป็น ชำระเงินเสร็จสิ้น แล้ว"
            : status === "remaining"
            ? "ตั้งค่าสถานะเป็น คงเหลือชำระ แล้ว"
            : status === "pending"
            ? "ตั้งค่าสถานะเป็น ค้างชำระ แล้ว"
            : "ล้างสถานะแล้ว"
        );
        await fetchPayments();
      } else {
        messageApi.error(res?.data?.error || `อัปเดตสถานะไม่สำเร็จ (HTTP ${res?.status ?? "-"})`);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleStatus = (row: PaymentInterface) => {
    const cur = getStatusValue(row);
    const next: "paid" | "pending" = cur === "paid" ? "pending" : "paid";
    setStatus(row, next);
  };

  // ----- helpers ช่องทางชำระเงิน (method) -----
  type PaymentMethod = "bank" | "qr" | "cash" | "";

  const getMethodValue = (r: any): PaymentMethod => {
    const v = (r?.Method ?? r?.method ?? "") as string;
    return (v || "").toLowerCase() as PaymentMethod;
  };

  const getMethodLabel = (val?: string | null) => {
    const v = (val || "").toLowerCase();
    if (v === "bank") return "โอนผ่านธนาคาร";
    if (v === "qr") return "QR พร้อมเพย์";
    return "-";
  };

  const getMethodColor = (val?: string | null) => {
    const v = (val || "").toLowerCase();
    if (v === "bank") return "blue";
    if (v === "qr") return "purple";
  
    return "default";
  };

  // ★ NEW: อัปเดต method ของแถวนั้นๆ แล้วรีโหลดตาราง
  const setMethod = async (row: PaymentInterface, method: Exclude<PaymentMethod, "">) => {
    if (!row?.ID) return;
    try {
      setMethodUpdatingId(Number(row.ID));
      const res = await UpdatePaymentMethod(row.ID, method);
      if (res?.status === 200) {
        messageApi.success(`ตั้งช่องทางเป็น ${getMethodLabel(method)} แล้ว`);
        await fetchPayments();
      } else {
        messageApi.error(res?.data?.error || `อัปเดตช่องทางไม่สำเร็จ (HTTP ${res?.status ?? "-"})`);
      }
    } finally {
      setMethodUpdatingId(null);
    }
  };

  const columns: ColumnsType<PaymentInterface> = [
    { title: "Payment ID", dataIndex: "ID" },
    { title: "Student ID", dataIndex: "StudentID" },
    { title: "ชื่อ", dataIndex: ["student", "first_name"], key: "first_name" },
    { title: "นามสกุล", dataIndex: ["student", "last_name"], key: "last_name" },

    {
      title: "เลขที่ใบเสร็จ",
      key: "receipt",
      render: (_: any, r) => formatReceiptFromAny(r),
    },

    { title: "จำนวนเงิน (฿)", key: "amount", render: (_: any, r) => getAmountValue(r) ?? "-" },
    { title: "วันที่ชำระ", key: "payment_date", render: (_: any, r) => fmtDate(getPayDateValue(r)) },

    {
      title: "สถานะการชำระเงิน",
      key: "payment_status",
      render: (_: any, r) => {
        const v = (r?.Payment_Status as any ?? "").toLowerCase();
        const isLoading = updatingId === r.ID;

        const items = [
          { key: "paid", label: "ชำระเงินเสร็จสิ้น", onClick: () => setStatus(r, "paid") },
          { key: "remaining", label: "คงเหลือชำระ", onClick: () => setStatus(r, "remaining") },
          { key: "pending", label: "ค้างชำระ", onClick: () => setStatus(r, "pending") },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <a onClick={(e) => e.preventDefault()} style={{ cursor: isLoading ? "not-allowed" : "pointer" }}>
              <Tag color={getStatusColor(v)}>{isLoading ? "กำลังอัปเดต..." : `${getStatusLabel(v)} ▾`}</Tag>
            </a>
          </Dropdown>
        );
      },
    },

    // ★ NEW: เปลี่ยนช่องทางด้วย Dropdown ต่อแถว
    {
      title: "ช่องทาง",
      key: "method",
      render: (_: any, r) => {
        const m = getMethodValue(r);
        const isLoading = methodUpdatingId === r.ID;

        const items = [
          { key: "bank", label: "โอนผ่านธนาคาร", onClick: () => setMethod(r, "bank") },
          { key: "qr", label: "QR พร้อมเพย์", onClick: () => setMethod(r, "qr") },
          { key: "-", label: "-", onClick: () => setMethod(r, "cash") },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <a onClick={(e) => e.preventDefault()} style={{ cursor: isLoading ? "not-allowed" : "pointer" }}>
              <Tag color={getMethodColor(m)}>{isLoading ? "กำลังอัปเดต..." : `${getMethodLabel(m)} ▾`}</Tag>
            </a>
          </Dropdown>
        );
      },
    },

    { title: "ผู้ชำระ", dataIndex: "PayerName", key: "payer" },

    {
      title: "ผู้รับเงิน",
      key: "receiver",
      render: (_: any, r: PaymentInterface) => {
        const rx: any = (r as any).Receiver ?? (r as any).receiver;
        const name = `${rx?.first_name ?? ""} ${rx?.last_name ?? ""}`.trim();
        return name || "-";
      },
    },
  ];

  return (
    <Card
      title="จัดการการชำระเงิน"
      bordered
      extra={
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
      }
    >
      {contextHolder}

      <Table rowKey="ID" columns={columns} dataSource={list} loading={loading} scroll={{ x: 1200 }} />

      <Modal open={slipOpen} onCancel={() => setSlipOpen(false)} footer={null} width={420} title="หลักฐานการโอน">
        {slipSrc ? <Image src={slipSrc} alt="evidence" style={{ width: "100%" }} /> : <Text type="secondary">ไม่พบไฟล์</Text>}
      </Modal>
    </Card>
  );
}
