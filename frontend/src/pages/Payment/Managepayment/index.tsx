// pages/admin/PaymentManage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Image,
  message,
  Typography,
  Dropdown,
} from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { PaymentInterface } from "../../../interfaces/Payment";
import type { StudentInterface } from "../../../interfaces/Student";
import {
  GetPayment,
  GetLatestEvidencesByStudents, // (bulk) ถ้ามี
  GetLatestEvidencesByStudent, // (single) fallback
  UpdatePaymentStatus,
  UpdatePaymentMethod,
  GetEvidencesByPaymentId,
  normalizeWebPath      // ใช้ enrich รายแถว
} from "../../../Service/https";
import { Link } from "react-router-dom";
import { evidenceToImgSrc } from "../../../Service/https";

const { Text } = Typography;

// สำหรับ evMap (ล่าสุดต่อ "นักศึกษา")
type EvidenceBriefForStudent = {
  student_id: number;
  evidence?:
    | {
        address?: string;
        url?: string;
        note?: string;
        date?: string;
        file_name?: string;
        mime_type?: string;
        // ชื่อคีย์สำรองจาก BE
        Address?: string;
        Note?: string;
        Date?: string;
        OriginalName?: string;
        original_name?: string;
      }
    | null;
};

// สำหรับ evidence ของ "แต่ละ payment" (ตารางหลัก)
type EvidenceItem = {
  ID?: number;
  address?: string;
  url?: string;
  file_url?: string;
  note?: string;
  date?: string;
  Date?: string;
  file_name?: string;
  OriginalName?: string;
  original_name?: string;
  mime_type?: string;
  student_id?: number;
  payment_id?: number;
  PaymentID?: number;
};

type PaymentWithEvidence = PaymentInterface & { evidence?: EvidenceItem | null };

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

// แสดง "-" หากว่าง/invalid/ปี < 2000
const fmtDate = (s?: string | null) => {
  if (!s) return "-";
  const d = dayjs(s);
  if (!d.isValid()) return "-";
  const y = d.year();
  if (y < 2000) return "-";
  return d.format("YYYY-MM-DD HH:mm");
};

// ----- helpers สำหรับใบเสร็จ (BillingID) -----
const getReceiptId = (r: any): number | undefined =>
  r?.BillingID ?? r?.billing_id ?? r?.Billing?.ID ?? r?.billing?.id;

const formatReceiptFromAny = (r: any) => {
  const id = getReceiptId(r);
  return id ? `B${String(id).padStart(6, "0")}` : "-";
};

export default function PaymentManage() {
  const [list, setList] = useState<PaymentWithEvidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);
  const [slipSrc, setSlipSrc] = useState<string | undefined>(undefined);
  const [slipCaption, setSlipCaption] = useState<string | undefined>(undefined);
  const [messageApi, contextHolder] = message.useMessage();
  const [updatingId, setUpdatingId] = useState<number | null>(null); // เปลี่ยนสถานะ
  const [methodUpdatingId, setMethodUpdatingId] = useState<number | null>(null); // เปลี่ยน method

  // map: StudentID -> Latest Evidence payload (ใช้กับแกลเลอรีรวมเท่านั้น)
  const [evMap, setEvMap] = useState<
    Record<number, EvidenceBriefForStudent["evidence"]>
  >({});

  const getStudentFullName = (s?: StudentInterface) =>
    s ? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() : "";

  // field resolvers
  const getStatusValue = (r: any): string => {
    const v: string = r?.Payment_Status ?? r?.payment_status ?? "";
    return (v || "").toLowerCase();
  };

  const getAmountValue = (row: PaymentWithEvidence) =>
    pick<number>(row.Amount as any, (row as any).amount);

  const getPayDateValue = (row: PaymentWithEvidence) =>
    pick<string>(
      row.Payment_Date as any,
      (row as any).payment_date,
      (row as any).Payment_Date
    );

  // enrich: เติม evidence ของ "แต่ละ payment"
  const enrichWithEvidence = async (
    payments: PaymentInterface[]
  ): Promise<PaymentWithEvidence[]> => {
    return await Promise.all(
      payments.map(async (p) => {
        if (!p?.ID) return { ...(p as PaymentWithEvidence), evidence: null };
        try {
          const evRes = await GetEvidencesByPaymentId(p.ID);
          const latest: EvidenceItem | null =
            evRes?.status === 200 && Array.isArray(evRes.data)
              ? evRes.data[0] || null
              : null;
          return { ...(p as PaymentWithEvidence), evidence: latest };
        } catch {
          return { ...(p as PaymentWithEvidence), evidence: null };
        }
      })
    );
  };

  // fetch data + normalize คีย์ให้ตรง แล้ว enrich evidence ต่อแถว
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
          Payment_Status: pick<string | null>(
            r.Payment_Status,
            r.payment_status
          ) as any,
          Amount: pick<number>(r.Amount, r.amount),
          Payment_Date: pick<string>(r.Payment_Date, r.payment_date),
          Method: pick<string>(r.Method, r.method),
          PayerName: pick<string>(r.PayerName, r.payer_name),
          ReceiptNumber:
            r.ReceiptNumber ??
            r.receipt_number ??
            (billingID ? `B${String(billingID).padStart(6, "0")}` : undefined),

          StudentID:
            pick<number>(r.StudentID, r.student_id) ??
            student?.StudentID ??
            student?.id,
          BillingID: billingID,

          Student: student,
          Billing: billing,
          Receiver: receiver,
        } as any;
      });

      // ✅ เติม evidence ของ "แต่ละ payment"
      const enriched = await enrichWithEvidence(normalized);
      setList(enriched);
    } else {
      messageApi.error(res?.data?.error || "โหลดรายการชำระเงินล้มเหลว");
    }
  };

  // รวบรวม StudentID ทั้งหมดในตาราง (ไว้โหลด evMap สำหรับแกลเลอรีรวม)
  const studentIdList = useMemo(() => {
    const ids = new Set<number>();
    list.forEach((p: any) => {
      if (p.StudentID) ids.add(Number(p.StudentID));
      const sidFromObj =
        p?.Student?.StudentID ?? p?.student?.StudentID ?? p?.student?.id;
      if (sidFromObj) ids.add(Number(sidFromObj));
    });
    return Array.from(ids);
  }, [list]);

  // โหลด evMap แบบ bulk ก่อน ถ้า API ไม่มี/ล้มเหลว → fallback แบบเดี่ยว
  const fetchLatestEvidences = async (sids: number[]) => {
    if (sids.length === 0) {
      setEvMap({});
      return;
    }

    try {
      const bulk = await GetLatestEvidencesByStudents(sids);
      if (bulk?.status === 200 && Array.isArray(bulk.data)) {
        const map: Record<number, EvidenceBriefForStudent["evidence"]> = {};
        for (const row of bulk.data as EvidenceBriefForStudent[]) {
          const sid = Number(row.student_id);
          map[sid] = row.evidence ?? null;
        }
        setEvMap(map);
        return;
      }
    } catch {
      // noop
    }

    const results = await Promise.all(
      sids.map(async (sid) => {
        try {
          const r = await GetLatestEvidencesByStudent(sid);
          if (r?.status === 200) {
            const payload = r.data as EvidenceBriefForStudent;
            return [sid, payload?.evidence ?? null] as const;
          }
        } catch {}
        return [sid, null] as const;
      })
    );
    const map: Record<number, EvidenceBriefForStudent["evidence"]> = {};
    for (const [sid, ev] of results) map[sid] = ev;
    setEvMap(map);
  };

  // โหลดตารางครั้งแรก
  useEffect(() => {
    fetchPayments();
  }, []);

  // พอได้รายชื่อ StudentIDs แล้ว ค่อยโหลด evMap (ใช้กับแกลเลอรีรวมเท่านั้น)
  useEffect(() => {
    fetchLatestEvidences(studentIdList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentIdList.join(",")]);

  // เปิดรูปจาก evidence ของ "นักศึกษา" (ใช้กับแกลเลอรีรวม)
  const openSlipFromStudent = (stuId?: number) => {
    if (!stuId) return;
    const ev = evMap[stuId];
    if (!ev) return messageApi.warning("ยังไม่มีหลักฐานอัปโหลด");

    const src = evidenceToImgSrc({
      url: (ev as any).url,
      address: ev.address ?? (ev as any).Address,
      mime_type: ev.mime_type as any,
    });

    if (!src) return messageApi.warning("ไม่พบไฟล์หลักฐาน");

    setSlipSrc(src);
    const caption = [
      ev?.file_name ?? (ev as any)?.OriginalName ?? (ev as any)?.original_name,
      fmtDate(ev?.date ?? (ev as any)?.Date),
      ev?.mime_type,
      ev?.note ?? (ev as any)?.Note,
    ]
      .filter(Boolean)
      .join(" · ");
    setSlipCaption(caption || undefined);
    setSlipOpen(true);
  };

  // เปิดรูปจาก evidence ของ "แถวนั้น (payment นั้นๆ)" — ใช้ในตาราง
  const openSlipFromEvidence = (ev?: any) => {
    if (!ev) return messageApi.warning("ยังไม่มีหลักฐานอัปโหลด");
  
    const src =
      ev?.file_url ||
      ev?.url ||
      normalizeWebPath(ev?.address || ev?.Address);
  
    if (!src) return messageApi.warning("ไม่พบไฟล์หลักฐาน");
  
    setSlipSrc(src);
    const caption = [
      ev?.file_name ?? ev?.OriginalName ?? ev?.original_name,
      fmtDate(ev?.date ?? ev?.Date),
      ev?.mime_type,
      ev?.note ?? ev?.Note,
    ].filter(Boolean).join(" · ");
    setSlipCaption(caption || undefined);
    setSlipOpen(true);
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
    if (v === "cash") return "เงินสด";
    return "-";
  };

  const getMethodColor = (val?: string | null) => {
    const v = (val || "").toLowerCase();
    if (v === "bank") return "blue";
    if (v === "qr") return "purple";
    if (v === "cash") return "volcano";
    return "default";
  };

  const setStatus = async (
    row: PaymentWithEvidence,
    status: "paid" | "pending" | "remaining" | null
  ) => {
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
        messageApi.error(
          res?.data?.error || `อัปเดตสถานะไม่สำเร็จ (HTTP ${res?.status ?? "-"})`
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleStatus = (row: PaymentWithEvidence) => {
    const cur = getStatusValue(row);
    const next: "paid" | "pending" = cur === "paid" ? "pending" : "paid";
    setStatus(row, next);
  };

  // คอลัมน์วันที่หลักฐาน (ใช้เฉพาะ evidence ของแถวนั้น)
  const evidenceDateCol: ColumnsType<PaymentWithEvidence>[number] = {
    title: "วันที่หลักฐาน",
    key: "evidence_date",
    render: (_: any, row: PaymentWithEvidence) => {
      const ev = row?.evidence;
      if (!ev) return "-";

      // กันเคสผูกผิด payment: ถ้า id ไม่ตรงให้แสดง "-"
      const pid = ev.payment_id ?? ev.PaymentID;
      if (pid && row.ID && Number(pid) !== Number(row.ID)) return "-";

      const rawDate = ev.date ?? ev.Date ?? null;
      return fmtDate(rawDate);
    },
  };

  // อัปเดต method ของแถวนั้นๆ แล้วรีโหลดตาราง
  const setMethod = async (
    row: PaymentWithEvidence,
    method: Exclude<PaymentMethod, "">
  ) => {
    if (!row?.ID) return;
    try {
      setMethodUpdatingId(Number(row.ID));
      const res = await UpdatePaymentMethod(row.ID, method);
      if (res?.status === 200) {
        messageApi.success(`ตั้งช่องทางเป็น ${getMethodLabel(method)} แล้ว`);
        await fetchPayments();
      } else {
        messageApi.error(
          res?.data?.error || `อัปเดตช่องทางไม่สำเร็จ (HTTP ${res?.status ?? "-"})`
        );
      }
    } finally {
      setMethodUpdatingId(null);
    }
  };

  const columns: ColumnsType<PaymentWithEvidence> = [
    { title: "Payment ID", dataIndex: "ID" },
    { title: "Student ID", dataIndex: "StudentID" },
    { title: "ชื่อ", dataIndex: ["student", "first_name"], key: "first_name" },
    { title: "นามสกุล", dataIndex: ["student", "last_name"], key: "last_name" },

    {
      title: "เลขที่ใบเสร็จ",
      key: "receipt",
      render: (_: any, r) => formatReceiptFromAny(r),
    },

    {
      title: "จำนวนเงิน (฿)",
      key: "amount",
      render: (_: any, r) => getAmountValue(r) ?? "-",
    },

    evidenceDateCol,

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
            <a
              onClick={(e) => e.preventDefault()}
              style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
            >
              <Tag color={getStatusColor(v)}>
                {isLoading ? "กำลังอัปเดต..." : `${getStatusLabel(v)} ▾`}
              </Tag>
            </a>
          </Dropdown>
        );
      },
    },

    // เปลี่ยนช่องทางด้วย Dropdown ต่อแถว
    {
      title: "ช่องทาง",
      key: "method",
      render: (_: any, r) => {
        const m = getMethodValue(r);
        const isLoading = methodUpdatingId === r.ID;

        const items = [
          { key: "bank", label: "โอนผ่านธนาคาร", onClick: () => setMethod(r, "bank") },
          { key: "qr", label: "QR พร้อมเพย์", onClick: () => setMethod(r, "qr") },
          { key: "cash", label: "เงินสด", onClick: () => setMethod(r, "cash") },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <a
              onClick={(e) => e.preventDefault()}
              style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
            >
              <Tag color={getMethodColor(m)}>
                {isLoading ? "กำลังอัปเดต..." : `${getMethodLabel(m)} ▾`}
              </Tag>
            </a>
          </Dropdown>
        );
      },
    },

    { title: "ผู้ชำระ", dataIndex: "PayerName", key: "payer" },

    {
      title: "ผู้รับเงิน",
      key: "receiver",
      render: (_: any, r: PaymentWithEvidence) => {
        const rx: any = (r as any).Receiver ?? (r as any).receiver;
        const name = `${rx?.first_name ?? ""} ${rx?.last_name ?? ""}`.trim();
        return name || "-";
      },
    },

    // ปุ่มเปิด Modal “ดูรูป” — ใช้ evidence ของแถวนั้นเท่านั้น
    {
      title: "ดูรูป",
      key: "open",
      width: 100,
      render: (_: any, r: PaymentWithEvidence) => {
        const ev = r?.evidence;
        const has = !!(
          ev &&
          (ev.address || (ev as any).Address || (ev as any).url || ev.file_url)
        );
        return has ? (
          <Button size="small" onClick={() => openSlipFromEvidence(ev)}>
            ดูรูป
          </Button>
        ) : (
          <span style={{ color: "#aaa" }}>ไม่มีรูป</span>
        );
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

      <Table
        rowKey="ID"
        columns={columns}
        dataSource={list}
        loading={loading}
        scroll={{ x: 1200 }}
      />

      {/* แกลเลอรีภาพรวม (ล่าสุดของแต่ละนักศึกษา) */}
      <Card title="หลักฐานล่าสุดของผู้เช่า" style={{ marginTop: 20 }}>
        <Image.PreviewGroup>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            }}
          >
            {Object.entries(evMap)
              .filter(([, v]) => !!v)
              .map(([sid, ev]) => {
                const src = evidenceToImgSrc({
                  url: (ev as any)?.url,
                  address: ev?.address ?? (ev as any)?.Address,
                  mime_type: ev?.mime_type as any,
                });
                const caption = [
                  ev?.file_name ??
                    (ev as any)?.OriginalName ??
                    (ev as any)?.original_name,
                  fmtDate(ev?.date ?? (ev as any)?.Date),
                  ev?.mime_type,
                  ev?.note ?? (ev as any)?.Note,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div key={sid} style={{ display: "flex", flexDirection: "column" }}>
                    {src ? (
                      <Image
                        src={src}
                        height={120}
                        style={{ objectFit: "cover", borderRadius: 8 }}
                        onClick={() => openSlipFromStudent(Number(sid))}
                      />
                    ) : (
                      <div
                        style={{
                          height: 120,
                          borderRadius: 8,
                          background: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#aaa",
                        }}
                      >
                        ไม่มีรูป
                      </div>
                    )}
                    <Text type="secondary" style={{ marginTop: 6 }}>
                      SID #{sid}
                    </Text>
                    {caption ? (
                      <Typography.Paragraph
                        style={{ marginTop: 2, marginBottom: 0 }}
                        ellipsis={{ rows: 2 }}
                      >
                        {caption}
                      </Typography.Paragraph>
                    ) : null}
                  </div>
                );
              })}
          </div>
        </Image.PreviewGroup>
        {Object.values(evMap).every((v) => !v) && (
          <Text type="secondary">ยังไม่มีหลักฐานล่าสุด</Text>
        )}
      </Card>

      {/* Modal แสดงรูป */}
      <Modal
        open={slipOpen}
        onCancel={() => setSlipOpen(false)}
        footer={null}
        width={560}
        title="หลักฐานการโอน"
      >
        {slipSrc ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Image src={slipSrc} alt="evidence" style={{ width: "100%" }} />
            {slipCaption ? <Text type="secondary">{slipCaption}</Text> : null}
          </Space>
        ) : (
          <Text type="secondary">ไม่พบไฟล์</Text>
        )}
      </Modal>
    </Card>
  );
}
