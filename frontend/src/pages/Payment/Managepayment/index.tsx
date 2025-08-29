import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  DatePicker,
  InputNumber,
  Button,
  Select,
  Space,
  Table,
  Popconfirm,
  message,
} from "antd";
import dayjs from "dayjs";
import { GetContracts, CreateContract, UpdateContractById, DeleteContractById } from "../../../Service/https";
import type { ContractInterface } from "../../../interfaces/Contract";

const Managepayment = () => {
  const [contracts, setContracts] = useState<ContractInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // โหลดข้อมูลสัญญา
  const fetchContracts = async () => {
    setLoading(true);
    const res = await GetContracts();
    if (res?.status === 200) {
      setContracts(res.data);
    } else {
      messageApi.error("โหลดข้อมูลสัญญาไม่สำเร็จ");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // สร้างสัญญา
  const handleCreate = async (values: any) => {
    const payload: ContractInterface = {
      Start_Date: values.Start_Date.toDate(),
      End_Date: values.End_Date.toDate(),
      Rate: values.Rate,
      Student_ID: values.Student_ID,
    };

    const res = await CreateContract(payload);
    if (res?.status === 201) {
      messageApi.success("สร้างสัญญาสำเร็จ");
      fetchContracts();
      form.resetFields();
    } else {
      messageApi.error("ไม่สามารถสร้างสัญญาได้");
    }
  };

  // อัพเดตสัญญา
  const handleUpdate = async (values: any) => {
    if (!editingId) return;
    const payload: ContractInterface = {
      Start_Date: values.Start_Date.toDate(),
      End_Date: values.End_Date.toDate(),
      Rate: values.Rate,
      Student_ID: values.Student_ID,
    };

    const res = await UpdateContractById(editingId.toString(), payload);
    if (res?.status === 200) {
      messageApi.success("อัพเดตสัญญาสำเร็จ");
      fetchContracts();
      form.resetFields();
      setEditingId(null);
    } else {
      messageApi.error("ไม่สามารถอัพเดตสัญญาได้");
    }
  };

  // ลบสัญญา
  const handleDelete = async (id: number) => {
    const res = await DeleteContractById(id.toString());
    if (res?.status === 200) {
      messageApi.success("ลบสัญญาสำเร็จ");
      fetchContracts();
    } else {
      messageApi.error("ไม่สามารถลบสัญญาได้");
    }
  };

  // กดแก้ไข => set ค่าเข้า form
  const handleEdit = (record: ContractInterface) => {
    form.setFieldsValue({
      Start_Date: dayjs(record.Start_Date),
      End_Date: dayjs(record.End_Date),
      Rate: record.Rate,
      Student_ID: record.Student_ID,
    });
    setEditingId(record.ContractID!);
  };

  // คอลัมน์ของ Table
  const columns = [
    {
      title: "ContractID",
      dataIndex: "ContractID",
    },
    {
      title: "Start Date",
      dataIndex: "Start_Date",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "End Date",
      dataIndex: "End_Date",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Rate",
      dataIndex: "Rate",
    },
    {
      title: "Student",
      dataIndex: ["Student", "first_name"],
      render: (_: any, record: ContractInterface) =>
        `${record.Student?.first_name ?? ""} ${record.Student?.last_name ?? ""}`,
    },
    {
      title: "Action",
      render: (_: any, record: ContractInterface) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            แก้ไข
          </Button>
          <Popconfirm
            title="ยืนยันการลบ?"
            onConfirm={() => handleDelete(record.ContractID!)}
          >
            <Button type="link" danger>
              ลบ
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="จัดการสัญญาเช่า">
      {contextHolder}
      <Form
        form={form}
        layout="inline"
        onFinish={editingId ? handleUpdate : handleCreate}
        style={{ marginBottom: 20 }}
      >
        <Form.Item
          name="Start_Date"
          rules={[{ required: true, message: "กรุณาเลือกวันเริ่ม" }]}
        >
          <DatePicker placeholder="วันเริ่ม" />
        </Form.Item>
        <Form.Item
          name="End_Date"
          rules={[{ required: true, message: "กรุณาเลือกวันสิ้นสุด" }]}
        >
          <DatePicker placeholder="วันสิ้นสุด" />
        </Form.Item>
        <Form.Item
          name="Rate"
          rules={[{ required: true, message: "กรุณากรอกค่าเช่า" }]}
        >
          <InputNumber placeholder="ค่าเช่า" />
        </Form.Item>
        <Form.Item
          name="Student_ID"
          rules={[{ required: true, message: "กรุณาเลือกผู้เช่า" }]}
        >
          <Select placeholder="เลือกผู้เช่า" style={{ width: 200 }}>
            {/* TODO: ดึงรายชื่อ Student มาจาก API */}
            <Select.Option value={1}>Student 1</Select.Option>
            <Select.Option value={2}>Student 2</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {editingId ? "อัพเดต" : "เพิ่ม"}
          </Button>
        </Form.Item>
        {editingId && (
          <Form.Item>
            <Button onClick={() => { form.resetFields(); setEditingId(null); }}>
              ยกเลิก
            </Button>
          </Form.Item>
        )}
      </Form>

      <Table
        rowKey="ContractID"
        columns={columns}
        dataSource={contracts}
        loading={loading}
      />
    </Card>
  );
};

export default Managepayment;
