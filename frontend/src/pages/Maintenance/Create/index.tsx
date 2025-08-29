import React from "react";
import { Button, Form, Input, Select, Card, Row, Col, Space } from "antd";
import { Link } from "react-router-dom";

function MaintenanceCreate() {
    return (
        <Card>
            <h2>เพิ่มข้อมูลการแจ้งซ่อม</h2>
            <Form layout="vertical">
                <Row gutter={[16,16]}>
                    <Col xs={24} sm={12}><Form.Item name="title" label="หัวข้อปัญหา" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    <Col xs={24} sm={12}><Form.Item name="problemTypeId" label="ประเภทปัญหา" rules={[{ required: true }]}>
                        <Select placeholder="กรุณาเลือกประเภทปัญหา" />
                    </Form.Item></Col>
                    <Col xs={24}><Form.Item name="description" label="รายละเอียด"><Input.TextArea /></Form.Item></Col>
                </Row>
                <Row justify="end"><Col><Space>
                    <Link to="/maintenance"><Button>ยกเลิก</Button></Link>
                    <Button type="primary" htmlType="submit">ยืนยัน</Button>
                </Space></Col></Row>
            </Form>
        </Card>
    );
}
export default MaintenanceCreate;