import { useState, useEffect } from "react";
import { Space, Table, Button, Col, Row, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined, SearchOutlined, FileSearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { GetStudents, DeleteStudentById } from "../../../Service/https/index";
import type { StudentInterface } from "../../../interfaces/Student";
import { Link, useNavigate, Routes, Route } from "react-router-dom";
import dayjs from "dayjs";

function Bank() {
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
        <Col span={24}>
          <div style={{
            fontSize: '27px',
            display: 'flex',
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: '0px',
            padding: '50px',
            gap: '20px',
          }}>

            <div
              style={{
                backgroundColor: '#253543',
                borderRadius: '20px',
                color: '#FFFFFF',
                padding: '50px',
                fontSize: '20px',
                display: 'flex',
                flexDirection: 'column',   // ✅ เรียงบนลงล่าง
                alignItems: 'center',
                gap: '15px',
                minWidth: '500px',
                height: '300px',
              }}
            >


              
              {/* วงกลมเขียวมีตัว K */}
              <div
                style={{
                  backgroundColor: '#29B6F6',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '22px'
                }}
              >
                B
              </div>

              {/* ข้อความหลายบรรทัด */}
              <div style={{ lineHeight: '1.6', textAlign: 'center' }}>
                <div>ธนาคารกสิกรไทย</div>
                <div>เลขที่บัญชี: 123-4-56789-0</div>
                <div>ชื่อบัญชี: บริษัท ABC จำกัด</div>
              </div>
            </div>




            <div
              style={{
                backgroundColor: '#253543',
                borderRadius: '20px',
                color: '#FFFFFF',
                padding: '50px',
                fontSize: '20px',
                display: 'flex',
                flexDirection: 'column',   // ✅ เรียงบนลงล่าง
                alignItems: 'center',
                gap: '15px',
                minWidth: '500px',
                height: '300px',
              }}
            >
              {/* วงกลมเขียวมีตัว K */}
              <div
                style={{
                  backgroundColor: '#F06292',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '22px'
                }}
              >
                S
              </div>

              {/* ข้อความหลายบรรทัด */}
              <div style={{ lineHeight: '1.6', textAlign: 'center' }}>
                <div>ธนาคารกรุงเทพ</div>
                <div>เลขที่บัญชี: 123-4-56789-0</div>
                <div>ชื่อบัญชี: บริษัท ABC จำกัด</div>
              </div>
            </div>





            <div
              style={{
                backgroundColor: '#253543',
                borderRadius: '20px',
                color: '#FFFFFF',
                padding: '50px',
                fontSize: '20px',
                display: 'flex',
                flexDirection: 'column',   // ✅ เรียงบนลงล่าง
                alignItems: 'center',
                gap: '15px',
                minWidth: '500px',
                height: '300px',
              }}
            >
              {/* วงกลมเขียวมีตัว K */}
              <div
                style={{
                  backgroundColor: 'green',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '22px'
                }}
              >
                K
              </div>

              {/* ข้อความหลายบรรทัด */}
              <div style={{ lineHeight: '1.6', textAlign: 'center' }}>
                <div>ธนาคารไทยพาณิชย์</div>
                <div>เลขที่บัญชี: 123-4-56789-0</div>
                <div>ชื่อบัญชี: บริษัท ABC จำกัด</div>
              </div>
            </div>

          </div>

        </Col>
              
        <Col span={24} style={{ 
          fontSize: '27px',
          display: 'flex',
          flexDirection: 'column', 
          justifyContent: 'center',  
          alignItems: 'center',
          gap: '16px'
        }}>
          
          <Link to="/Payment/Evidence">
            <Button
              style={{
                backgroundColor: '#253543',
                borderRadius: '30px',
                color: "#FFFFFF",
                height: '50px',
                padding: '0 50px',
                fontSize: '24px',
                minWidth: '1500px'
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

export default Bank;