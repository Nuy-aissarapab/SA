import { useState, useEffect } from "react";
import {
  Button,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  message,
  Input,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { CreateRoomAsset, GetAllAssetTypes } from "../../Service/https/index";

const { Option } = Select;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function CreateRoomAssetForm() {
  const query = useQuery();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [selectedAssetType, setSelectedAssetType] = useState<any>(null);

  const roomNumber = query.get("roomNumber") || "";

  // โหลดประเภททรัพย์สิน
  useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const res = await GetAllAssetTypes();
        if (res.status === 200) {
          setAssetTypes(Array.isArray(res.data) ? res.data : []);
        } else {
          messageApi.error("โหลดประเภททรัพย์สินไม่สำเร็จ");
        }
      } catch (error) {
        console.error(error);
        messageApi.error("เกิดข้อผิดพลาดในการโหลดประเภททรัพย์สิน");
      }
    };
    fetchAssetTypes();
  }, [messageApi]);

  const onFinish = async (values: any) => {
    if (!roomNumber) {
      messageApi.error("ไม่พบเลขห้อง กรุณากลับไปหน้าเลือกห้อง");
      return;
    }

    if (!selectedAssetType) {
      messageApi.error("กรุณาเลือกทรัพย์สิน");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        room_number: roomNumber,
        asset_type_id: selectedAssetType.ID,
        Quantity: Number(values.quantity),
        Condition: selectedAssetType.Name,
        Status: "ok",
      };

      console.log("📦 Payload:", payload);

      const res = await CreateRoomAsset(payload);

      if (res.status === 200 || res.status === 201) {
        messageApi.success("เพิ่มทรัพย์สินสำเร็จ");
        navigate(`/assets/room/${roomNumber}`);
      } else {
        messageApi.error("เกิดข้อผิดพลาด: " + (res?.data?.error || "ไม่ทราบสาเหตุ"));
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.error || "ไม่สามารถเพิ่มทรัพย์สินได้";
      messageApi.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Row justify="start">
        <Col>
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ marginBottom: 16, borderRadius: 6 }}
          >
            ย้อนกลับ
          </Button>
        </Col>
      </Row>

      <Row justify="center">
        <Col span={16}>
          <h2>
            ➕ เพิ่มทรัพย์สินของห้องพัก:{" "}
            <span style={{ color: "#1890ff" }}>{roomNumber}</span>
          </h2>

          <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            {/* เลือกทรัพย์สิน */}
            <Form.Item
              label="ทรัพย์สิน"
              name="asset_type"
              rules={[{ required: true, message: "กรุณาเลือกทรัพย์สิน" }]}
            >
              <Select
                placeholder="เลือกทรัพย์สิน"
                onChange={(val) => {
                  const id = Number(val);
                  const selected = assetTypes.find((at) => at.ID === id);
                  setSelectedAssetType(selected || null);
                  // อัปเดต Form
                  form.setFieldsValue({
                    penalty_fee: selected?.PenaltyFee || 0,
                    asset_type_category: selected?.Type || "",
                  });
                }}
              >
                {assetTypes.map((at) => (
                  <Option key={at.ID} value={at.ID}>
                    {at.Name} ({at.Type})
                  </Option>
                ))}
              </Select>
            </Form.Item>


            {/* จำนวน */}
            <Form.Item
              label="ปริมาณ / จำนวน"
              name="quantity"
              rules={[{ required: true, message: "กรุณากรอกจำนวน" }]}
            >
              <InputNumber min={1} max={1000} style={{ width: "100%" }} />
            </Form.Item>

            {/* ค่าปรับ */}
            <Form.Item label="ค่าปรับ (บาท)" name="penalty_fee">
              <InputNumber style={{ width: "100%" }} disabled />
            </Form.Item>

            <Form.Item>
              <Row justify="space-between">
                <Col>
                  <Button onClick={() => navigate(`/assets/${roomNumber}`)}>ยกเลิก</Button>
                </Col>
                <Col>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    ✅ บันทึกข้อมูล
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </>
  );
}

export default CreateRoomAssetForm;
