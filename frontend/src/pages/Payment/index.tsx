import { useState, useEffect } from "react";
import { Space, Table, Button, Col, Row, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined, SearchOutlined, FileSearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { GetPayment, DeleteStudentById ,GetStudents} from "../../Service/https/index";
import type { PaymentInterface } from "../../interfaces/Payment";
import type { StudentInterface } from "../../interfaces/Student";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

function Payment() {
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentInterface[]>([]);
  const [student, setStudent] = useState<StudentInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const myId = localStorage.getItem("id");
  console.log("id:Payment ",myId)

  const role = localStorage.getItem("role"); // "student" | "admin"

  const getPaymentStudent = async () => {
    const id = localStorage.getItem("id"); // ✅ ใช้ id จาก login response
    let res = await GetPayment(id ?? undefined);
    console.log("s",res.data);
    if (res.status == 200) {
      setPayment(res.data);
    } else {
      setPayment([]);
      messageApi.open({
        type: "error",
        content: res.data.error,
      });
    }
  };

  const getPaymentAdmin = async () => {
    let res = await GetPayment();
  
    if (res.status == 200) {
      setPayment(res.data);
    } else {
      setPayment([]);
      messageApi.open({
        type: "error",
        content: res.data.error,
      });
    }
  };
  
  

  const getStudents = async () => {
    let res = await GetStudents();
      console.log("AAA",res)
    if (res.status == 200) {
      setStudent(res.data);
    } else {
      setStudent([]);
      messageApi.open({
        type: "error",
        content: res.data.error,
      });
    }
  };

  useEffect(() => {
    getStudents();
    if(role === "student")getPaymentStudent();
    if(role === "admin")getPaymentAdmin();

  }, [role]);

  const studentColumns: ColumnsType<PaymentInterface> = [
    { title: "Student ID",
      dataIndex: "StudentID", 
      key: "StudentID" },
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
    {
      title: "วันที่-เวลา",
      dataIndex: "Payment_Date",
      key: "Payment_Date",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "ค้างชำระ",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "สถานะ",
      dataIndex: "payment_status",
      key: "payment_status",
    },
    
  ];

  const adminColumns: ColumnsType<PaymentInterface> = [
    {
      title: "Student ID",
      dataIndex: ["student", "StudentID"],
      key: "StudentID",
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
    {
      title: "วันที่-เวลา",
      dataIndex: "Payment_Date",
      key: "Payment_Date",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "ค้างชำระ",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "สถานะ",
      dataIndex: "payment_status",
      key: "payment_status",
    },
    
  ];


  return (
  <>
    
    {contextHolder}
    <Row>
      <Col span={24}>
        <h2 style={{ fontSize: '27px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          กรุณาชำระเงินและแนบหลักฐานการโอน
        </h2>
      </Col>
    </Row>
    <Divider />
    
    <Table
      rowKey="ID"
      columns={role === "admin" ? adminColumns : studentColumns}
      dataSource={payment}
      pagination={{ pageSize: 10 }}
    />
    {role === "admin" && (
    <>
      {/* <div style={{ marginTop: 20 }}>
        <Table
          rowKey="ID"
          dataSource={payment}
          style={{ width: "100%", overflow: "scroll" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </div> */}
    {/* ส่วนท้าย - Custom Footer Section */}
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
        <Link to="/Contract/Extendcontract/EvidenceGallery">
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
  </>
    )}
    {role === "student" && (
    <>
      {/* <div style={{ marginTop: 20 }}>
        <Table
          rowKey="ID"
          dataSource={payment}
          style={{ width: "100%", overflow: "scroll" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </div> */}
    {/* ส่วนท้าย - Custom Footer Section */}
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
        <Link to="/Payment/Bank">
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

        <Link to="/Payment/QRCode">
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
  </>
    )}

  </>
);
  
}

export default Payment;