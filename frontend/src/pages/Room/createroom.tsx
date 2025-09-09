import { Button, Col, Form, Input, InputNumber, Row, Select, message } from "antd";
import { useNavigate } from "react-router-dom";
import { PostAllRooms, GetAllRoomTypes } from "../../Service/https/index";
import type { Room } from "../../interfaces/Room";
import { useEffect, useState } from "react";

const { Option } = Select;

function CreateRoomForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const res = await GetAllRoomTypes();
        if (res.status === 200) {
          // สมมติ API ส่งข้อมูลแบบ array ตรง ๆ
          console.log("📦 Room types from API:", res.data);
          setRoomTypes(Array.isArray(res.data) ? res.data : []);
        } else {
          messageApi.error("โหลดข้อมูลประเภทห้องไม่สำเร็จ");
        }
      } catch (error) {
        messageApi.error("เกิดข้อผิดพลาดในการโหลดประเภทห้อง");
        console.error(error);
      }
    };
    fetchRoomTypes();
  }, [messageApi]);

  const onFinish = async (values: any) => {
    try {
      const payload: Room = {
        room_number: values.room_number,
        RoomTypeID: values.room_type,
        room_status: values.status,
        AdminID: Number(localStorage.getItem("id")),
        Image: "",
        BookingTime: new Date().toISOString(),
        StudentID: null,
      };

      const res = await PostAllRooms(payload);
      if (res.status === 201) {
        messageApi.success("เพิ่มห้องพักสำเร็จ");
        navigate("/room");
      } else {
        messageApi.error("เกิดข้อผิดพลาด: " + res.data?.error);
      }
    } catch (error) {
      messageApi.error("ไม่สามารถเพิ่มห้องพักได้");
      console.error(error);
    }
  };

  return (
    <>
      {contextHolder}
      <Row justify="center">
        <Col span={16}>
          <h2>➕ เพิ่มห้องพักใหม่</h2>
          <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item label="เลขห้อง" name="room_number" rules={[{ required: true }]}>
              <Input placeholder="เช่น 101" />
            </Form.Item>

            <Form.Item label="ประเภทห้อง" name="room_type" rules={[{ required: true }]}>
              <Select
                placeholder="เลือกประเภท"
                onChange={(val) => {
                  const selectedType = roomTypes.find((rt) => rt.ID === val);
                  form.setFieldsValue({ price: selectedType?.RentalPrice || 0 });
                }}
                allowClear
              >
                {roomTypes.map((rt) => (
                  <Option key={rt.ID} value={rt.ID}>
                    {rt.RoomTypeName}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="สถานะ" name="status" rules={[{ required: true }]}>
              <Select placeholder="เลือกสถานะ">
                <Option value="ว่าง">ว่าง</Option>
                <Option value="ไม่ว่าง">ไม่ว่าง</Option>
              </Select>
            </Form.Item>

            <Form.Item label="ราคา (บาท)" name="price">
              <InputNumber min={0} style={{ width: "100%" }} disabled />
            </Form.Item>

            <Form.Item>
              <Row justify="space-between">
                <Col>
                  <Button onClick={() => navigate("/room")}>ยกเลิก</Button>
                </Col>
                <Col>
                  <Button type="primary" htmlType="submit">
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

export default CreateRoomForm;
