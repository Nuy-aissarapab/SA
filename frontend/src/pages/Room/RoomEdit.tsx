import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, Button, Select, message, Spin, InputNumber } from "antd";
import { GetRoomById, UpdateAllRoom, GetAllRoomTypes } from "../../Service/https";
import type { Room } from "../../interfaces/Room";
import type { RoomType } from "../../interfaces/RoomType";

const { Option } = Select;

function RoomEdit() {
  const { id } = useParams<{ id: string }>();
  const roomId = Number(id); // ✅ แปลง string → number
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [room, setRoom] = useState<Room | null>(null);

  const [price, setPrice] = useState<number>(0);
  const [priceEdited, setPriceEdited] = useState(false);

  // ดึงข้อมูลห้อง
  const fetchRoomData = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await GetRoomById(roomId);
      if (res.status === 200) {
        setRoom(res.data);
        form.setFieldsValue({
          RoomNumber: res.data.room_number,
          RoomTypeID: res.data.RoomTypeID,
          Status: res.data.room_status,
          Price: res.data.RoomType?.RentalPrice ?? 0,
        });
        setPrice(res.data.RoomType?.RentalPrice ?? 0);
      } else {
        message.error("ไม่สามารถโหลดข้อมูลห้องได้");
      }
    } catch {
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // ดึงประเภทห้อง
  const fetchRoomTypes = async () => {
    try {
      const res = await GetAllRoomTypes();
      if (res.status === 200) {
        setRoomTypes(res.data);
      } else {
        message.error("ไม่สามารถโหลดประเภทห้องได้");
      }
    } catch {
      message.error("ไม่สามารถโหลดประเภทห้องได้");
    }
  };

  useEffect(() => {
    fetchRoomData();
    fetchRoomTypes();
  }, [roomId]);

  // ตั้งราคาห้องเริ่มต้นตามประเภท
  useEffect(() => {
    if (room && roomTypes.length > 0) {
      const roomType = roomTypes.find((rt) => rt.ID === room.RoomTypeID);
      const initialPrice = roomType?.RentalPrice ?? 0;
      setPrice(initialPrice);
      form.setFieldsValue({ Price: initialPrice });
    }
  }, [room, roomTypes]);

  const onRoomTypeChange = (value: number) => {
    const roomType = roomTypes.find((rt) => rt.ID === value);
    if (roomType && !priceEdited) {
      setPrice(roomType.RentalPrice ?? 0);
      form.setFieldsValue({ Price: roomType.RentalPrice ?? 0 });
    }
    form.setFieldsValue({ RoomTypeID: value });
  };

  const onPriceChange = (value: number | null) => {
    setPrice(value ?? 0);
    setPriceEdited(true);
  };

  const onFinish = async (values: any) => {
    if (!room) return;
    setLoading(true);
    try {
      const shouldClearStudent = values.Status === "ว่าง";

      // ✅ payload ต้องตรงกับ backend
      const payload = {
        room_number: values.RoomNumber,
        room_type_id: values.RoomTypeID,
        room_status: values.Status,
        rental_price: values.Price,
        student_id: shouldClearStudent ? null : room.StudentID,
      };

      const res = await UpdateAllRoom(roomId, payload); // number ไม่ใช่ string

      if (res.status === 200) {
        message.success("แก้ไขข้อมูลสำเร็จ");
        navigate("/Room");
      } else {
        message.error("แก้ไขไม่สำเร็จ: " + res.data?.error);
      }
    } catch {
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !room) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 24 }}>แก้ไขห้องพัก</h2>
      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item
          label="หมายเลขห้อง"
          name="RoomNumber"
          rules={[{ required: true, message: "กรุณากรอกหมายเลขห้อง" }]}
        >
          <Input readOnly style={{ backgroundColor: "#f5f5f5" }} />
        </Form.Item>

        <Form.Item
          label="ประเภทห้อง"
          name="RoomTypeID"
          rules={[{ required: true, message: "กรุณาเลือกประเภทห้อง" }]}
        >
          <Select placeholder="เลือกประเภทห้อง" onChange={onRoomTypeChange}>
            {roomTypes.map((type) => (
              <Option key={type.ID} value={type.ID}>
                {type.RoomTypeName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="สถานะ"
          name="Status"
          rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
        >
          <Select placeholder="เลือกสถานะ">
            <Option value="ว่าง">ว่าง</Option>
            <Option value="ไม่ว่าง">ไม่ว่าง</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="ราคา (บาท)"
          name="Price"
          rules={[{ required: true, message: "กรุณากรอกราคา" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} value={price} onChange={onPriceChange} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            บันทึกการเปลี่ยนแปลง
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate("/Room")}>
            ยกเลิก
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default RoomEdit;
