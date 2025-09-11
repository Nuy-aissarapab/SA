import { useState, useEffect } from "react";
import {
  Button,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  message,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { CreateRoomAsset, GetAllAssetTypes, GetAllRoomAssets } from "../../Service/https/index";

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
  const [existingAssets, setExistingAssets] = useState<any[]>([]);

  const roomNumber = query.get("roomNumber") || "";

  // โหลดประเภททรัพย์สิน + ทรัพย์สินที่มีอยู่ในห้อง
  useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const res = await GetAllAssetTypes();
        console.log("📦 AssetTypes API:", res);

        if (res.status === 200 && Array.isArray(res.data)) {
          setAssetTypes(res.data);
        } else {
          messageApi.error("ไม่พบข้อมูลประเภททรัพย์สิน");
        }
      } catch (error) {
        console.error(error);
        messageApi.error("เกิดข้อผิดพลาดในการโหลดประเภททรัพย์สิน");
      }
    };

    const fetchExistingAssets = async () => {
      try {
        const res = await GetAllRoomAssets();
        if (res.status === 200 && Array.isArray(res)) {
          const roomAssets = res.filter((a: any) => a.RoomNumber === roomNumber);
          setExistingAssets(roomAssets);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchAssetTypes();
    fetchExistingAssets();
  }, [messageApi, roomNumber]);

  const onFinish = async (values: any) => {
    console.log("📌 Form values:", values);

    if (!roomNumber) {
      messageApi.error("ไม่พบเลขห้อง กรุณากลับไปหน้าเลือกห้อง");
      return;
    }

    const selected = assetTypes.find(
      (at) => (at.ID ?? at.id) === values.asset_type
    );

    if (!selected) {
      messageApi.error("ไม่พบประเภททรัพย์สิน");
      return;
    }

    // ✅ กันการเพิ่มซ้ำ
    const alreadyExists = existingAssets.some(
      (asset) => asset.AssetTypeID === (selected.ID ?? selected.id)
    );
    if (alreadyExists) {
      messageApi.error(`ห้องนี้มี ${selected.Name ?? selected.name} อยู่แล้ว ไม่สามารถเพิ่มซ้ำได้`);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        room_number: roomNumber,
        asset_type_id: selected.ID ?? selected.id,
        Quantity: Number(values.quantity),
        Condition: "ปกติ",
        Status: "ok",
        CreatedDate: new Date().toISOString(),
        CheckDate: new Date().toISOString(),
      };

      console.log("📦 Payload ส่งไป API:", payload);

      const res = await CreateRoomAsset(payload);

      if (res.status === 200 || res.status === 201) {
        messageApi.success("เพิ่มทรัพย์สินสำเร็จ");
        navigate(`/Assets/room/${roomNumber}`);
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
            onClick={() => navigate(`/Assets/room/${roomNumber}`)}
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
      const selected = assetTypes.find((at) => (at.ID ?? at.id) === val);
      form.setFieldsValue({
        penalty_fee: selected?.PenaltyFee ?? 0,
      });
    }}
  >
    {assetTypes.map((at) => (
      <Option key={at.ID ?? at.id} value={at.ID ?? at.id}>
        {at.Name ?? at.name} ({at.Type ?? at.type})
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
                  <Button onClick={() => navigate("/Assets/assetroom")}>ยกเลิก</Button>
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
