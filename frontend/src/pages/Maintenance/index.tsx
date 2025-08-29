import React from "react";
import { Button, Table, Space } from "antd";
import { Link } from "react-router-dom";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

// สร้าง Interface ชั่วคราวสำหรับแสดงโครงสร้าง
interface DataType {
  key: string;
  id: number;
  title: string;
  student: string;
  status: string;
}

function Maintenance() {
  const columns: ColumnsType<DataType> = [
    { title: 'รหัส', dataIndex: 'id' },
    { title: 'หัวข้อปัญหา', dataIndex: 'title' },
    { title: 'ผู้แจ้ง', dataIndex: 'student' },
    { title: 'สถานะ', dataIndex: 'status' },
    { title: 'การจัดการ', render: (record) => (
        <Space>
            <Link to={`/maintenance/edit/${record.id}`}><Button type="primary" icon={<EditOutlined />}>แก้ไขสถานะ</Button></Link>
            <Button type="primary" danger icon={<DeleteOutlined />}>ลบ</Button>
        </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>จัดการข้อมูลการแจ้งซ่อม</h2>
        <Link to="/maintenance/create"><Button type="primary" icon={<PlusOutlined />}>สร้างข้อมูล</Button></Link>
      </div>
      <Table columns={columns} dataSource={[]} />
    </div>
  );
}
export default Maintenance;