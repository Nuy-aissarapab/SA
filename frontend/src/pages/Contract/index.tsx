import { useState, useEffect, useRef} from "react";
import { Space, Table, Button, Col, Row, Divider, message } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { GetContracts } from "../../Service/https/index";
import type { ContractInterface } from "../../interfaces/Contract";
import dayjs from "dayjs";


function ContractPage() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const shownRef = useRef(false); 
  const [contracts, setContracts] = useState<ContractInterface[]>([]); 
  const [messageApi, contextHolder] = message.useMessage();

  const role = localStorage.getItem("role"); // "student" | "admin"

  // เพิ่ม type ชั่วคราว (ถ้า interface หลักยังไม่มีฟิลด์เหล่านี้)
type ContractRow = ContractInterface & {
  renewal_status?: string | null;
  renewal_pending?: boolean | null;
  renewal_start_date?: string | null;
  renewal_end_date?: string | null;
};

// ช่วยเช็กวันที่ (กันเคส null/invalid/0001-01-01)
const isRealDate = (s?: string | null) =>
  !!s && dayjs(s).isValid() && dayjs(s).year() >= 1900;

// มีการกดต่อสัญญาแล้วหรือยัง
const shouldUseRenewal = (r: ContractRow) =>
  (r.renewal_status === "pending" || r.renewal_status === "approved" || r.renewal_pending === true) &&
  isRealDate(r.renewal_start_date) &&
  isRealDate(r.renewal_end_date);

// เลือกค่าที่จะแสดง
const getDisplayStart = (r: ContractRow) =>
  shouldUseRenewal(r) ? r.renewal_start_date! : r.start_date;

const getDisplayEnd = (r: ContractRow) =>
  shouldUseRenewal(r) ? r.renewal_end_date! : r.end_date;

const mapRenewalStatus = (status?: string | null) => {
  switch (status) {
    case "approved":
      return "การต่อสัญญาเสร็จสิ้น";
    case "pending":
      return "รออนุมัติกรุณาชำระเงิน";
    case "rejected":
      return "คำขอถูกปฏิเสธ";
    default:
      return "ยังไม่ต่อสัญญา"; // ✅ ค่าเริ่มต้นที่คุณต้องการ
  }
};

// ---------- เปลี่ยน state ให้รองรับฟิลด์ renewal ----------

const studentColumns: ColumnsType<ContractRow> = [
  { title: "Student ID", dataIndex: "StudentID", key: "StudentID" },
  { title: "ชื่อ", dataIndex: ["Student", "first_name"] },
  { title: "นามสกุล", dataIndex: ["Student", "last_name"] },
  {
    title: "วันที่เริ่ม",
    key: "start",
    render: (_: any, r) =>
      isRealDate(getDisplayStart(r)) ? dayjs(getDisplayStart(r)).format("DD/MM/YYYY") : "-",
  },
  {
    title: "วันที่สิ้นสุด",
    key: "end",
    render: (_: any, r) =>
      isRealDate(getDisplayEnd(r)) ? dayjs(getDisplayEnd(r)).format("DD/MM/YYYY") : "-",
  },
  { title: "ค่าเช่า", dataIndex: "rate", key: "rate" },
  {
    title: "สถานะต่อสัญญา",
    dataIndex: "renewal_status",
    key: "renewal_status",
    render: (value?: string | null) => mapRenewalStatus(value),
  },
];

const adminColumns: ColumnsType<ContractRow> = [
  { title: "Contract ID", dataIndex: "ID", key: "ID" },
  { title: "Student ID", dataIndex: "StudentID", key: "StudentID" },
  { title: "ชื่อ", dataIndex: ["Student", "first_name"] },
  { title: "นามสกุล", dataIndex: ["Student", "last_name"] },
  { title: "เบอร์โทร", dataIndex: ["Student", "phone"] },
  {
    title: "วันที่เริ่ม",
    key: "start",
    render: (_: any, r) =>
      isRealDate(getDisplayStart(r)) ? dayjs(getDisplayStart(r)).format("DD/MM/YYYY") : "-",
  },
  {
    title: "วันที่สิ้นสุด",
    key: "end",
    render: (_: any, r) =>
      isRealDate(getDisplayEnd(r)) ? dayjs(getDisplayEnd(r)).format("DD/MM/YYYY") : "-",
  },
  { title: "ค่าเช่า", dataIndex: "rate", key: "rate" },
  {
    title: "สถานะต่อสัญญา",
    dataIndex: "renewal_status",
    key: "renewal_status",
    render: (value?: string | null) => mapRenewalStatus(value),
  },
];

  const getContractsStudent = async () => {
    const id = localStorage.getItem("id");
    const res = await GetContracts(id ?? undefined);
    if (res.status === 200) setContracts(res.data);
    else {
      setContracts([]);
      messageApi.open({ type: "error", content: res?.data?.error || "โหลดสัญญาไม่สำเร็จ" });
    }
  };

  const getContractsAdmin = async () => {
    const res = await GetContracts();
    if (res.status === 200) setContracts(res.data);
    else {
      setContracts([]);
      messageApi.open({ type: "error", content: res?.data?.error || "โหลดสัญญาไม่สำเร็จ" });
    }
  };

  useEffect(() => {
    if (role === "student") getContractsStudent();
    else if (role === "admin") getContractsAdmin();
  }, [role]);

    useEffect(() => {
    const flash = (location.state as any)?.flash;
    // ยิงครั้งเดียวเท่านั้น
    if (flash === "renewal_submitted" && !shownRef.current) {
      shownRef.current = true;

      messageApi.success("ส่งคำขอต่อสัญญาแล้ว • รออนุมัติและชำระเงิน");

      // รีเฟรชข้อมูลล่าสุด
      if (role === "student") getContractsStudent();
      else if (role === "admin") getContractsAdmin();

      // ล้าง state เพื่อไม่ให้เด้งซ้ำเวลา back/refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, role, navigate, messageApi]);

  return (
    <>
      {contextHolder}
      <Row>
        <Col span={24}>
          <h2 style={{ fontSize: "27px" }}>
            {role === "admin" ? "จัดการสัญญาทั้งหมด" : "ตรวจสอบสัญญาของคุณ"}
          </h2>
        </Col>
      </Row>
      <Divider />

      <Table
        rowKey="ID"
        columns={role === "admin" ? adminColumns : studentColumns}
        dataSource={contracts}
        pagination={{ pageSize: 10 }}
      />

      {role === "admin" && (
        <Row justify="end" style={{ marginTop: 20 }}>
          <Space>
            <Link to="/Contract/Managecontracts">
              <Button
                style={{
                  backgroundColor: "#253543",
                  borderRadius: "30px",
                  color: "#FFFFFF",
                  height: "50px",
                  padding: "0 50px",
                  fontSize: "20px",
                  minWidth: "200px",
                }}
              >
                จัดการสัญญา
              </Button>
            </Link>
          </Space>
        </Row>
      )}

      {role === "student" && (
        <Row justify="end" style={{ marginTop: 20 }}>
          <Col>
            <Link to="/Billing/Payment">
              <Button
                style={{
                  backgroundColor: "#253543",
                  borderRadius: "30px",
                  color: "#FFFFFF",
                  height: "50px",
                  padding: "0 50px",
                  fontSize: "20px",
                  minWidth: "200px",
                }}
              >
                ชำระเงิน
              </Button>
            </Link>
            <Link to="/Contract/Extendcontract">
              <Button
                style={{
                  backgroundColor: "#253543",
                  borderRadius: "30px",
                  color: "#FFFFFF",
                  height: "50px",
                  padding: "0 50px",
                  fontSize: "20px",
                  minWidth: "200px",
                }}
              >
                ต่อสัญญา
              </Button>
            </Link>
          </Col>
        </Row>
      )}
    </>
  );
}

export default ContractPage;
