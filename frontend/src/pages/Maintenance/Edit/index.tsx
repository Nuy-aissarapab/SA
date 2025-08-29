import React from "react";
import { Button, Form, Select, Card, Row, Col, Space } from "antd";
import { Link, useParams } from "react-router-dom";

function MaintenanceEdit() {
    const { id } = useParams();
    return (
        <Card>
            <h2>แก้ไขสถานะการแจ้งซ่อม (สำหรับเจ้าหน้าที่) - รหัส #{id}</h2>
            <p><strong>หัวข้อ:</strong> [หัวข้อปัญหา]</p>
            <p><strong>ผู้แจ้ง:</strong> [ชื่อผู้แจ้ง]</p>
            <Form layout="vertical">
                <Row><Col span={12}><Form.Item name="statusId" label="สถานะ" rules={[{ required: true }]}>
                    <Select placeholder="กรุณาเลือกสถานะ" />
                </Form.Item></Col></Row>
                <Row justify="end"><Col><Space>
                    <Link to="/maintenance"><Button>ยกเลิก</Button></Link>
                    <Button type="primary" htmlType="submit">บันทึก</Button>
                </Space></Col></Row>
            </Form>
        </Card>
    );
}
export default MaintenanceEdit;