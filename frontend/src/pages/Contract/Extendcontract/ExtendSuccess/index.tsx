// src/pages/evidence/EvidenceSuccess.tsx
import { Result, Button, Descriptions } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

export default function ExtendSuccess() {
  const navigate = useNavigate();


  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <Result
        status="success"
        title="คำร้องต่อสัญญาสำเร็จ"
        subTitle="เราได้รับคำร้องต่อสัญญาของคุณแล้ว อยู่ระหว่างตรวจสอบ"
        extra={[
          <Button key="Contract" onClick={() => navigate("/Contract")}>
            กลับหน้าแรก
          </Button>,
        ]}
      />
    </div>
  );
}
