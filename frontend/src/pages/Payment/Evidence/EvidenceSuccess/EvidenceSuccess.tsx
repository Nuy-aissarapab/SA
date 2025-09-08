// src/pages/evidence/EvidenceSuccess.tsx
import { Result, Button, Descriptions } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

export default function EvidenceSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state?: {
      paymentId?: number;
      studentId?: number;
      filename?: string;
      date?: string;
      note?: string;
    };
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <Result
        status="success"
        title="ส่งหลักฐานสำเร็จ"
        subTitle="เราได้รับหลักฐานการโอนของคุณแล้ว อยู่ระหว่างตรวจสอบ"
        extra={[
          <Button key="home" onClick={() => navigate("/Main")}>
            กลับหน้าแรก
          </Button>,
        ]}
      />
    </div>
  );
}

