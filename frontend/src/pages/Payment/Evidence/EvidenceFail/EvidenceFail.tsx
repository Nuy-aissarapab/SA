// src/pages/evidence/EvidenceFail.tsx
import { Result, Button, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

const { Paragraph, Text } = Typography;

export default function EvidenceFail() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { error?: string } };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <Result
        status="error"
        title="ส่งหลักฐานไม่สำเร็จ"
        subTitle="กรุณาลองใหม่อีกครั้ง หรือแจ้งผู้ดูแลระบบหากปัญหายังคงอยู่"
        extra={[
          <Button key="home" onClick={() => navigate("/")}>
            กลับหน้าแรก
          </Button>,
        ]}
      />
      {state?.error && (
        <Paragraph style={{ marginTop: 16 }}>
          <Text strong>รายละเอียดข้อผิดพลาด: </Text>
          <Text type="danger">{state.error}</Text>
        </Paragraph>
      )}
    </div>
  );
}
