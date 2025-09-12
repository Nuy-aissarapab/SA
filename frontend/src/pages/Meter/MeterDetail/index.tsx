import { Table, Button, Space, message, Popconfirm, Row, Col, Card } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { MeterInterface } from "../../../interfaces/Meter";
import { GetMeterByRoom, DeleteMeter } from "../../../Service/https/index";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";

function MeterDetail() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage();
  const [meter, setMeter] = useState<MeterInterface[]>([]);

  const getMeter = async () => {
    if (!id) return;
    try {
      const res = await GetMeterByRoom(id);
      if (res.status === 200) {
        setMeter(res.data);
      } else {
        setMeter([]);
        messageApi.open({ type: "error", content: res.data?.error || "เกิดข้อผิดพลาด" });
      }
    } catch (err: any) {
      setMeter([]);
      messageApi.open({ type: "error", content: err.message || "เกิดข้อผิดพลาด" });
    }
  };

  useEffect(() => {
    getMeter();
  }, [id]);

  const handleDelete = async (meter_id: number) => {
    try {
      const res = await DeleteMeter(meter_id.toString());
      if (res.status === 200) {
        messageApi.success("ลบเรียบร้อย");
        getMeter();
      } else {
        const errorMsg = res.data?.error || "เกิดข้อผิดพลาด";
        messageApi.error(errorMsg);
      }
    } catch (error: any) {
      messageApi.error(error?.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  const columns: ColumnsType<MeterInterface> = [
    {
      title: "วันที่บันทึก",
      dataIndex: "record_date",
      key: "record_date",
      render: (_, record) =>
        record.record_date ? dayjs(record.record_date).format("DD/MM/YYYY") : "-",
    },
    {
      title: "ประเภท",
      key: "meter_name",
      render: (_, record) => record.meter_type?.meter_name || "-",
    },
    {
      title: "ค่าเดิม",
      dataIndex: "old_value",
      key: "old_value",
      render: (_, record) => record.old_value ?? "-",
    },
    {
      title: "ค่าใหม่",
      dataIndex: "new_value",
      key: "new_value",
      render: (_, record) => record.new_value ?? "-",
    },
    {
      title: "หน่วยที่ใช้",
      dataIndex: "unit_used",
      key: "unit_used",
      render: (_, record) => record.unit_used ?? "-",
    },
    {
      title: "รวมทั้งหมด",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (_, record) => record.total_amount ?? "-",
    },
    {
      title: "จัดการ",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="คุณแน่ใจว่าต้องการลบหรือไม่?"
            onConfirm={() => handleDelete(record.id!)}
            okText="ใช่"
            cancelText="ยกเลิก"
          >
            <Button type="link" danger icon={<EditOutlined />}>
              ลบ
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h2 style={{ margin: 0 }}>ประวัติการบันทึกมิเตอร์</h2>
        </Col>
        <Col>
          <Space>
            <Button type="default" onClick={() => navigate(-1)}>
              กลับ
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(`/Meter/MeterDetail/${id}/Create`)}
            >
              บันทึกมิเตอร์ใหม่
            </Button>
          </Space>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 2px 8px #f0f1f2" }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={meter}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </>
  );
}

export default MeterDetail;
