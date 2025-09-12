import { useState, useEffect } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  message,
  Spin,
  Select,
  Modal,
} from "antd";
import { ArrowLeftOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { GetAllAssetTypes, UpdateAssetType, DeleteAssetType } from "../../Service/https/index";

const { Option } = Select;

function EditAssetTypes() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  // โหลดข้อมูลประเภททั้งหมด
  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      const res = await GetAllAssetTypes();
      if (res?.status === 200 && Array.isArray(res.data)) {
        setAssetTypes(res.data);
      } else {
        messageApi.error("โหลดประเภททรัพย์สินไม่สำเร็จ");
      }
      setInitialLoading(false);
    };
    fetchData();
  }, []);

  // เมื่อเลือกประเภท
  const handleSelect = (id: number) => {
    const selected = assetTypes.find((a) => a.ID === id);
    if (selected) {
      setSelectedId(id);
      form.setFieldsValue({
        name: selected.Name,
        type: selected.Type,
        penalty_fee: selected.PenaltyFee,
      });
    }
  };

  // ✅ บันทึกการแก้ไข
  const onFinish = async (values: any) => {
    if (!selectedId) {
      return messageApi.error("กรุณาเลือกประเภทที่จะ แก้ไข");
    }
    try {
      setLoading(true);
      const payload = {
        ID: selectedId,
        Name: values.name,
        Type: values.type,
        PenaltyFee: Number(values.penalty_fee),
        Date: new Date().toISOString(),
      };
      const res = await UpdateAssetType(selectedId, payload);
      if (res?.status === 200) {
        messageApi.success("แก้ไขประเภททรัพย์สินสำเร็จ");
        navigate("/Assets/assetroom");
      } else {
        messageApi.error("เกิดข้อผิดพลาด: " + (res?.data?.error || "ไม่ทราบสาเหตุ"));
      }
    } catch {
      messageApi.error("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ลบประเภท
  const handleDelete = () => {
    if (!selectedId) {
      return messageApi.error("กรุณาเลือกประเภทที่จะลบ");
    }

    modal.confirm({
      title: "ยืนยันการลบ",
      icon: <ExclamationCircleOutlined />,
      content: "คุณแน่ใจหรือไม่ที่จะลบประเภททรัพย์สินนี้?",
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          const res = await DeleteAssetType(selectedId!);
          if (res?.status === 200) {
            messageApi.success("ลบประเภททรัพย์สินสำเร็จ");
            navigate("/Assets/assetroom");
          } else {
            messageApi.error(res?.data?.error || "ลบไม่สำเร็จ");
          }
        } catch (err) {
          console.error("❌ Delete error:", err);
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
            onClick={() => navigate("/Assets/assetroom")}
            style={{ marginBottom: 16, borderRadius: 6 }}
          >
            ย้อนกลับ
          </Button>
        </Col>
      </Row>

      <Row justify="center">
        <Col span={16}>
          <h2>✏️ แก้ไขประเภททรัพย์สิน</h2>

          {initialLoading ? (
            <Spin />
          ) : (
            <Form form={form} layout="vertical" onFinish={onFinish}>
              {/* Dropdown เลือกประเภท */}
              <Form.Item
                label="เลือกประเภท"
                name="assetTypeId"
                rules={[{ required: true, message: "กรุณาเลือกประเภท" }]}
                style={{ marginBottom: 20 }}
              >
                <Select
                  placeholder="เลือกประเภทที่ต้องการแก้ไข"
                  onChange={(value) => handleSelect(Number(value))}
                >
                  {assetTypes.map((a) => (
                    <Option key={a.ID} value={a.ID}>
                      {a.Name} ({a.Type})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* ฟอร์มแก้ไข */}
              <Form.Item
                label="ชื่อทรัพย์สิน"
                name="name"
                rules={[{ required: true, message: "กรุณากรอกชื่อทรัพย์สิน" }]}
              >
                <Input placeholder="เช่น เตียง, โต๊ะ, Wi-Fi" />
              </Form.Item>

              <Form.Item
                label="หมวดหมู่ / ประเภท"
                name="type"
                rules={[{ required: true, message: "กรุณากรอกหมวดหมู่" }]}
              >
                <Input placeholder="เช่น เฟอร์นิเจอร์, สิ่งอำนวยความสะดวก" />
              </Form.Item>

              <Form.Item
                label="ค่าปรับ (บาท)"
                name="penalty_fee"
                rules={[{ required: true, message: "กรุณากรอกค่าปรับ" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item>
                <Row justify="space-between">
                  <Col>
                    <Button danger onClick={handleDelete}>
                      🗑️ ลบประเภท
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

export default EditAssetTypes;
