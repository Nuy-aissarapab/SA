import { useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  message,
  Modal,
} from "antd";
import { ArrowLeftOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { GetAllRoomTypes, UpdateRoomType, DeleteRoomType } from "../../Service/https/index";

const { Option } = Select;

function EditRoomType() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  // โหลดประเภทห้องทั้งหมด
  useEffect(() => {
    const fetchTypes = async () => {
      setInitialLoading(true);
      const res = await GetAllRoomTypes();
      if (Array.isArray(res)) {
        setRoomTypes(res);
      } else {
        messageApi.error("โหลดประเภทห้องไม่สำเร็จ");
      }
      setInitialLoading(false);
    };
    fetchTypes();
  }, []);

  // เมื่อเลือกประเภท
  const handleSelect = (id: number) => {
    const selected = roomTypes.find((rt) => rt.ID === id);
    if (selected) {
      setSelectedId(id);
      form.setFieldsValue({
        roomTypeId: selected.ID,
        name: selected.RoomTypeName,
        price: selected.RentalPrice,
      });
    }
  };

  // ✅ ฟังก์ชันแก้ไข
  const onFinish = async (values: any) => {
    if (!selectedId) {
      return messageApi.error("กรุณาเลือกประเภทห้องที่จะ แก้ไข");
    }
    try {
      setLoading(true);
      const payload = {
        RoomTypeName: values.name,
        RentalPrice: Number(values.price),
      };

      const res = await UpdateRoomType(selectedId, payload);
      if (res?.status === 200) {
        messageApi.success("แก้ไขประเภทห้องสำเร็จ");
        navigate("/Room");
      } else {
        messageApi.error("เกิดข้อผิดพลาด: " + (res?.data?.error || "ไม่ทราบสาเหตุ"));
      }
    } catch {
      messageApi.error("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ฟังก์ชันลบ
  const handleDelete = () => {
    if (!selectedId) {
      return messageApi.error("กรุณาเลือกประเภทห้องที่จะลบ");
    }

    modal.confirm({
      title: "ยืนยันการลบ",
      icon: <ExclamationCircleOutlined />,
      content: "คุณแน่ใจหรือไม่ที่จะลบประเภทห้องนี้?",
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          const res = await DeleteRoomType(selectedId);
          console.log("🔥 Delete response:", res);

          if (res && res.status === 200) {
            messageApi.success(res.data?.message || "ลบประเภทห้องสำเร็จ");
            navigate("/Room");
          } else {
            messageApi.error("เกิดข้อผิดพลาด: " + (res?.data?.error || "ไม่ทราบสาเหตุ"));
          }
        } catch (err) {
          console.error("🔥 Delete error:", err);
          messageApi.error("ลบไม่สำเร็จ");
        }
      },
    });
  };

  return (
    <>
      {contextHolder}
      {modalContextHolder}

      <Row justify="start">
        <Col>
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/Room")}
            style={{ marginBottom: 16, borderRadius: 6 }}
          >
            ย้อนกลับ
          </Button>
        </Col>
      </Row>

      <Row justify="center">
        <Col span={16}>
          <h2>✏️ แก้ไขประเภทห้อง</h2>
          {initialLoading ? (
            <Spin />
          ) : (
            <Form form={form} layout="vertical" onFinish={onFinish}>
              {/* Dropdown เลือกประเภทห้อง */}
              <Form.Item
                label="เลือกประเภทห้อง"
                name="roomTypeId"
                rules={[{ required: true, message: "กรุณาเลือกประเภทห้อง" }]}
                style={{ marginBottom: 20 }}
              >
                <Select
                  placeholder="เลือกประเภทห้อง"
                  onChange={(val) => handleSelect(Number(val))}
                >
                  {roomTypes.map((rt) => (
                    <Option key={rt.ID} value={rt.ID}>
                      {rt.RoomTypeName} (ราคา {rt.RentalPrice} บาท)
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="ชื่อประเภทห้อง"
                name="name"
                rules={[{ required: true, message: "กรุณากรอกชื่อประเภทห้อง" }]}
              >
                <Input placeholder="เช่น ห้องพัดลม, ห้องแอร์" />
              </Form.Item>

              <Form.Item
                label="ราคาเช่า (บาท)"
                name="price"
                rules={[{ required: true, message: "กรุณากรอกราคาเช่า" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item>
                <Row justify="space-between">
                  <Col>
                    <Button danger onClick={handleDelete}>
                      🗑️ ลบประเภทห้อง
                    </Button>
                  </Col>
                  <Col>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      ✅ บันทึกการแก้ไข
                    </Button>
                  </Col>
                </Row>
              </Form.Item>
            </Form>
          )}
        </Col>
      </Row>
    </>
  );
}

export default EditRoomType;
