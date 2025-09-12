import { useState, useEffect } from "react";
import { Space, Table, Button, Col, Row, Divider, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import {
  GetPayment,
  GetStudents,
  GetEvidencesByPaymentId,
  GetContracts, // ★ ดึงสัญญามา join
} from "../../Service/https/index";

import type { PaymentInterface } from "../../interfaces/Payment";
import type { StudentInterface } from "../../interfaces/Student";
import type { ContractInterface } from "../../interfaces/Contract"; // ★ ใช้ type สัญญา

function Payment() {
  const navigate = useNavigate();

  type EvidenceBrief = {
    ID: number;
    address?: string;
    file_url?: string;
    note?: string;
    date?: string;
    student_id?: number;
    payment_id?: number;
    file_name?: string;
  };

  // ★ แถวที่ใช้ในตาราง: ผสาน evidence + renewal_status (จากสัญญา)
  type PaymentRow = PaymentInterface & {
    evidence?: EvidenceBrief | null;
    renewal_status?: "approved" | "pending" | "rejected" | string | null;
  };

  const [payment, setPayment] = useState<PaymentRow[]>([]);
  const [student, setStudent] = useState<StudentInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const role = localStorage.getItem("role"); // "student" | "admin"

  // บลิสต์ PaymentInterface[] แล้วเติม field evidence (ตัวล่าสุด) ให้แต่ละ payment
  const enrichWithEvidence = async (
    list: PaymentInterface[]
  ): Promise<PaymentRow[]> => {
    return await Promise.all(
      list.map(async (p) => {
        try {
          const evRes = await GetEvidencesByPaymentId(p.ID!);
          const latest: EvidenceBrief | null =
            evRes?.status === 200 && Array.isArray(evRes.data)
              ? evRes.data[0]
              : null;
          return { ...(p as PaymentRow), evidence: latest };
        } catch {
          return { ...(p as PaymentRow), evidence: null };
        }
      })
    );
  };

  const pickLatestContract = (
    arr: ContractInterface[]
  ): ContractInterface | undefined => {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    const valid = [...arr].sort((a, b) => {
      const ad = dayjs(a.end_date);
      const bd = dayjs(b.end_date);
      if (ad.isValid() && bd.isValid()) {
        if (ad.isBefore(bd)) return 1;
        if (ad.isAfter(bd)) return -1;
        return 0;
      }
      return (b.ID || 0) - (a.ID || 0);
    });
    return valid[0];
  };

  // ผสาน renewal_status จาก contracts -> payments
  const mergeRenewalStatus = (
    payments: PaymentRow[],
    contracts: ContractInterface[]
  ): PaymentRow[] => {
    // สร้าง map ต่อ StudentID -> สัญญาล่าสุด
    const map = new Map<number, ContractInterface>();
    const byStudent = new Map<number, ContractInterface[]>();

    for (const c of contracts) {
      const sid = Number((c as any).StudentID ?? c.ID ?? c.Student?.ID);
      if (!sid) continue;
      if (!byStudent.has(sid)) byStudent.set(sid, []);
      byStudent.get(sid)!.push(c);
    }
    for (const [sid, arr] of byStudent.entries()) {
      const latest = pickLatestContract(arr);
      if (latest) map.set(sid, latest);
    }

    // เติม field renewal_status ลงในแถว payment
    return payments.map((p) => {
      const sid = Number((p as any).student_id ?? p.ID ?? p.student?.ID);
      const latest = sid ? map.get(sid) : undefined;
      return {
        ...p,
        renewal_status:
          latest?.renewal_status ?? (latest as any)?.renewal_pending
            ? "pending"
            : p.renewal_status ?? null,
      };
    });
  };

  // ---------- fetchers ----------
  const getPaymentStudent = async () => {
    const id = localStorage.getItem("id");
    const res = await GetPayment(id ?? undefined);
    if (res.status === 200) {
      const list: PaymentInterface[] = res.data;
      const withEv = await enrichWithEvidence(list);

      // ดึงสัญญาของนักศึกษาคนนี้มารวม
      const cRes = await GetContracts(id ?? undefined);
      const contracts: ContractInterface[] =
        cRes?.status === 200 ? cRes.data : [];

      setPayment(mergeRenewalStatus(withEv, contracts));
    } else {
      setPayment([]);
      messageApi.error(res.data?.error || "โหลดข้อมูลไม่สำเร็จ");
    }
  };

  const getPaymentAdmin = async () => {
    const res = await GetPayment();
    if (res.status === 200) {
      const list: PaymentInterface[] = res.data;
      const withEv = await enrichWithEvidence(list);

      // ดึงสัญญาทั้งหมดครั้งเดียว แล้ว join ตาม StudentID
      const cRes = await GetContracts();
      const contracts: ContractInterface[] =
        cRes?.status === 200 ? cRes.data : [];

      setPayment(mergeRenewalStatus(withEv, contracts));
    } else {
      setPayment([]);
      messageApi.open({
        type: "error",
        content: res.data?.error || "โหลดข้อมูลไม่สำเร็จ",
      });
    }
  };

  const getStudents = async () => {
    let res = await GetStudents();
    if (res.status === 200) {
      setStudent(res.data);
    } else {
      setStudent([]);
      messageApi.open({
        type: "error",
        content: res.data?.error || "โหลดรายชื่อนักศึกษาไม่สำเร็จ",
      });
    }
  };

  useEffect(() => {
    getStudents();
    if (role === "student") getPaymentStudent();
    if (role === "admin") getPaymentAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // ---------- columns ----------
  const evidenceDateCol = {
    title: "วันที่หลักฐาน",
    key: "evidence_date",
    render: (_: any, row: any) =>
      row?.evidence?.date
        ? dayjs(row.evidence.date).format("YYYY-MM-DD HH:mm")
        : "-",
  };

  const formatBaht = (n?: number) =>
    typeof n === "number"
      ? new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(n)
      : "-";

  const adminColumns: ColumnsType<PaymentRow> = [
    {
      title: "Student ID",
      dataIndex: ["student", "ID"],
      key: "ID",
    },
    {
      title: "ชื่อ",
      dataIndex: ["student", "first_name"],
      key: "first_name",
    },
    {
      title: "นามสกุล",
      dataIndex: ["student", "last_name"],
      key: "last_name",
    },
    evidenceDateCol,
    {
      title: "จำนวนเงิน (฿)",
      dataIndex: "amount_due",
      key: "amount_due",
      align: "right",
      render: (v: number | undefined) => formatBaht(v),
    },

    // ★ แสดงจาก renewal_status ก่อน ถ้าไม่มีค่อย fallback payment_status
    {
      title: "สถานะการชำระเงิน",
      key: "payment_status_view",
      render: (_: any, r: PaymentRow) => {
        switch (r.payment_status) {
          case "remaining":
            return "คงเหลือชำระ";
          case "paid":
            return "ชำระเงินเรียบร้อย";
          case "pending":
            return "มียอดค้างชำระ";
          default: {
            const v = (r as any).renewal_status ?? r.renewal_status;
            if (v === "remaining") return "คงเหลือชำระ";
            if (v === "paid") return "ชำระเงินเรียบร้อย";
            if (v === "pending") return "มียอดค้างชำระ";
            return "-";
          }
        }
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <Row>
        <Col span={24}>
          <h2
            style={{
              fontSize: "27px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            กรุณาชำระเงินและแนบหลักฐานการโอน
          </h2>
        </Col>
      </Row>
      <Divider />

      <Table
        rowKey="ID"
        columns={adminColumns}
        dataSource={payment}
        pagination={{ pageSize: 10 }}
      />

      {role === "admin" && (
        <Row>
          <Col
            span={24}
            style={{
              fontSize: "27px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "end",
              alignItems: "end",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <Link to="/Payment/Managepayment">
              <Button
                style={{
                  backgroundColor: "#253543",
                  borderRadius: "30px",
                  color: "#FFFFFF",
                  height: "50px",
                  padding: "0 50px",
                  fontSize: "24px",
                  minWidth: "400px",
                }}
              >
                จัดการข้อมูล
              </Button>
            </Link>
          </Col>
        </Row>
      )}

      {role === "student" && (
        <Row>
          <Col span={24}>
            <div
              style={{
                fontSize: "27px",
                textAlign: "center",
                marginBottom: "10px",
              }}
            >
              <h4>เลือกวิธีการชำระเงิน</h4>
            </div>
          </Col>

          <Col
            span={24}
            style={{
              fontSize: "27px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <Link
              to="/Payment/Bank"
              onClick={() => {
                localStorage.setItem("payment_method", "bank");
                localStorage.removeItem("selected_bank");
              }}
            >
              <Button
                style={{
                  backgroundColor: "#253543",
                  borderRadius: "30px",
                  color: "#FFFFFF",
                  height: "50px",
                  padding: "0 50px",
                  fontSize: "24px",
                  minWidth: "750px",
                }}
              >
                โอนธนาคาร
              </Button>
            </Link>

            <Link
              to="/Payment/QRCode"
              onClick={() => {
                localStorage.setItem("payment_method", "qr");
              }}
            >
              <Button
                style={{
                  backgroundColor: "#253543",
                  borderRadius: "30px",
                  color: "#FFFFFF",
                  height: "50px",
                  padding: "0 50px",
                  fontSize: "24px",
                  minWidth: "750px",
                }}
              >
                QR Code
              </Button>
            </Link>
          </Col>
        </Row>
      )}
    </>
  );
}

export default Payment;
