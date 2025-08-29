import React from "react";
import { Card, Divider } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

// สร้าง Interface ชั่วคราวสำหรับแสดงโครงสร้าง
interface DataType {
  key: string;
  id: number;
  title: string;
  student: string;
  status: string;
}

function Main() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <span>ประกาศหอพัก / Dormitory Notice</span>
          </div>
        }
        style={{ marginBottom: '20px' }}
      >
        <div style={{ lineHeight: '1.8', fontSize: '14px' }}>
          <h3 style={{ color: '#d32f2f', marginBottom: '16px' }}>
            โปรดอ่านให้เข้าใจก่อนทำรายการ
          </h3>
          
          <p style={{ color: '#d32f2f', fontWeight: 'bold', marginBottom: '16px' }}>
            ****** นักศึกษาทุกคนต้องกรอกข้อมูลส่วนตัว หรืออัพเดทข้อมูล 
            ให้ครบถ้วนก่อนจึงจะสามารถทำรายการยืนยันสิทธิ์อยู่หอพักได้ *******
          </p>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#1976d2', marginBottom: '8px' }}>
              คำแนะนำการกรอกข้อมูลส่วนตัว
            </h4>
            <ul style={{ paddingLeft: '20px' }}>
              <li>กรอกข้อมูลให้ครบถ้วนตามความจริง</li>
              <li>หากข้อมูลไม่มี ให้เติมเลข 0 ในช่องนั้น ๆ</li>
            </ul>
          </div>

          <Divider />

          <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
            <h4 style={{ color: '#1976d2', marginBottom: '8px' }}>
              เลือกตั้งกรรมการหอพักประจำปีการศึกษา 2568
            </h4>
            <p><strong>วันที่:</strong> 23 เมษายน 2568</p>
            <p><strong>เวลา:</strong> 07.00-15.00 น.</p>
          </div>

          <Divider />

          <h3 style={{ color: '#d32f2f', marginBottom: '16px' }}>
            Please read and understand before making a transaction
          </h3>

          <p style={{ color: '#d32f2f', fontWeight: 'bold', marginBottom: '16px' }}>
            ****** All students must fill in personal information or update their information 
            completely before they can confirm their dormitory rights *******
          </p>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#1976d2', marginBottom: '8px' }}>
              Recommendations for filling in personal information
            </h4>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Fill in the information completely and truthfully</li>
              <li>If there is no information, fill in the number 0 in that box</li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
            <h4 style={{ color: '#1976d2', marginBottom: '8px' }}>
              Election of the dormitory committee for the academic year 2025
            </h4>
            <p><strong>Date:</strong> April 23, 2025</p>
            <p><strong>Time:</strong> 07.00-15.00 hrs.</p>
          </div>

          <div style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '4px', 
            padding: '12px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#856404', fontWeight: 'bold', margin: 0 }}>
              Please read carefully,<br />
              ** Student MUST update personal info before making another progress **
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Main;