import { useState, useEffect } from "react";
import { Space, Table, Button, Col, Row, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined, SearchOutlined, FileSearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { GetStudents, DeleteStudentById } from "../../../Service/https/index";
import type { StudentInterface } from "../../../interfaces/Student";
import { Link, useNavigate, Routes, Route } from "react-router-dom";
import dayjs from "dayjs";
import QRcode from "../../../assets/QRCode.jpg";

function QRCode() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const myId = localStorage.getItem("id");

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

      {/* ส่วนท้าย - Custom Footer Section */}
      <Row> 
      <Col span={24} style={{ 
          fontSize: '27px',
          display: 'flex',
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '16px'
        }}>

          {/* Updated Link paths */}
          <Link to="/Bank">
            <img
                alt="QRcode"
                style={{ width: "100%" }}
                src={QRcode}
                className="images-logo"
              />
          </Link>

          <Link to="/Payment/Evidence">
          <Button
            style={{
              backgroundColor: '#253543',
              borderRadius: '30px',
              color: "#FFFFFF",
              height: '50px',
              padding: '0 50px',
              fontSize: '24px',
              minWidth: '1500px' // ลดความกว้างให้เหมาะสม
            }}
          >
            แนบหลักฐานการโอน
            
          </Button>
          
        </Link>

        </Col>
      </Row>


    </>
  );
}

export default QRCode;