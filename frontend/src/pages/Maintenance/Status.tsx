import { useEffect, useState } from "react";
import { Button, Card, Col, Form, Row, Select, message } from "antd";
import { useNavigate, useParams, Link } from "react-router-dom";
import { GetMaintenanceById, GetMaintenanceStatuses, UpdateMaintenanceStatus } from "../../Service/https";

export default function MaintenanceStatusPage() {
  const { id } = useParams();
  const [statuses, setStatuses] = useState<any[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    (async () => {
      if (role !== "admin") { messageApi.error("อนุญาตเฉพาะผู้ดูแลระบบ"); navigate("/Maintenance", {replace:true}); return; }
      if (!id) { messageApi.error("ไม่พบรหัส"); navigate("/Maintenance", {replace:true}); return; }
      const [m, s] = await Promise.all([GetMaintenanceById(Number(id)), GetMaintenanceStatuses()]);
      if (s?.status === 200) setStatuses(s.data);
      if (m?.status !== 200) messageApi.error(m?.data?.error || "โหลดข้อมูลไม่สำเร็จ");
    })();
  }, [id]);

  const onFinish = async (values:any) => {
  const res = await UpdateMaintenanceStatus(Number(id), {
    maintenance_status_id: Number(values.maintenance_status_id), // ✅ ชื่อฟิลด์ตรง backend
  });
  if (res?.status === 200) {
    messageApi.success("อัปเดตสถานะสำเร็จ"); navigate("/Maintenance");
  } else {
    messageApi.error(res?.data?.error || "อัปเดตไม่สำเร็จ");
  }
};


  return (
    <Card>
      {contextHolder}
      <h2>อัปเดตสถานะงานซ่อม</h2>
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Row gutter={[16,16]}>
          <Col xs={24} sm={12}>
            <Form.Item name="maintenance_status_id" label="สถานะ" rules={[{required:true}]}>
              <Select
                placeholder="เลือกสถานะ"
                options={statuses.map(s=>({ value: s.ID!, label: s.StatusName ?? s.status_name }))}
                showSearch optionFilterProp="label"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Col>
            <Link to="/Maintenance"><Button>ยกเลิก</Button></Link>
            <Button type="primary" htmlType="submit" style={{marginLeft:8}}>บันทึก</Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
