import { useState, useEffect } from "react";
import { Space, Table, Button, Col, Row, Divider, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { GetContracts, DeleteContractById } from "../../Service/https/index";
import type { ContractInterface } from "../../interfaces/Contract";
import dayjs from "dayjs";

function ContractPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const role = localStorage.getItem("role"); // "student" | "admin"

  const studentColumns: ColumnsType<ContractInterface> = [
    { title: "Student ID", dataIndex: "StudentID", key: "StudentID" },
    { title: "ชื่อ", dataIndex: ["Student", "first_name"] },
    { title: "นามสกุล", dataIndex: ["Student", "last_name"] },
    { title: "วันที่เริ่ม", dataIndex: "start_date", render: (date) => dayjs(date).format("DD/MM/YYYY") },
    { title: "วันที่สิ้นสุด", dataIndex: "end_date", render: (date) => dayjs(date).format("DD/MM/YYYY") },
    { title: "ค่าเช่า", dataIndex: "rate", key: "rate" },
  ];

  const adminColumns: ColumnsType<ContractInterface> = [
    { title: "Contract ID", dataIndex: "ID", key: "ID" },
    { title: "Student ID", dataIndex: "StudentID", key: "StudentID" },
    { title: "นามสกุล", dataIndex: ["Student", "last_name"] },
    { title: "เบอร์โทร", dataIndex: ["Student", "phone"] },
    { title: "วันที่เริ่ม", dataIndex: "start_date", render: (date) => dayjs(date).format("DD/MM/YYYY") },
    { title: "วันที่สิ้นสุด", dataIndex: "end_date", render: (date) => dayjs(date).format("DD/MM/YYYY") },
    { title: "ค่าเช่า", dataIndex: "rate", key: "rate" },
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
    const res = await GetContracts(); // ไม่ส่ง studentId
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
            <Link to="/Contract/report">
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
                รายงานผู้ดูแล
              </Button>
            </Link>
          </Col>
        </Row>
      )}
    </>
  );
}

export default ContractPage;
