import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Select,
  message,
  Spin,
  InputNumber,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import {
  GetRoomById,
  UpdateAllRoom,
  GetAllRoomTypes,
} from "../../Service/https";
import type { RoomInterface } from "../../interfaces/Room";
import type { RoomType } from "../../interfaces/RoomType";
import type { RcFile, UploadFile } from "antd/es/upload";

const { Option } = Select;

const getBase64 = (file: RcFile): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

function RoomEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [room, setRoom] = useState<RoomInterface | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);

  const fetchRoomData = async () => {
    setLoading(true);
    try {
      const res = await GetRoomById(Number(id));
      if (res.status === 200 && !res.data.error) {
        const roomData: RoomInterface = res.data;
        setRoom(roomData);

        setImagePreview(roomData.Image || "");

        form.setFieldsValue({
          RoomNumber: roomData.RoomNumber,
          RoomTypeID: roomData.RoomTypeID ?? null,
          Status: roomData.Status,
          Price: roomData.RoomType?.RentalPrice ?? 0,
        });

        setPrice(roomData.RoomType?.RentalPrice ?? 0);
      } else {
        message.error(res.data?.error || "ไม่พบข้อมูลห้อง");
        setRoom(null);
      }
    } catch (err) {
      message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setRoom(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await GetAllRoomTypes();
      const types = Array.isArray(res) ? res : res?.data ?? [];
      if (Array.isArray(types)) {
        setRoomTypes(types);
      } else {
        message.error("ไม่สามารถโหลดประเภทห้องได้");
      }
    } catch (err) {
      message.error("ไม่สามารถโหลดประเภทห้องได้");
    }
  };

  useEffect(() => {
    fetchRoomData();
    fetchRoomTypes();
  }, []);

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
    if (roomType) {
      const rentalPrice = roomType.RentalPrice ?? 0;
      setPrice(rentalPrice);
      form.setFieldsValue({ Price: rentalPrice, RoomTypeID: value });
    }
  };

  const onFinish = async (values: any) => {
    if (!room) return;
    setLoading(true);
    try {
      let base64Image = room.Image || "";

      // If new image uploaded, convert to base64
      if (imageFileList.length > 0 && imageFileList[0].originFileObj) {
        base64Image = await getBase64(imageFileList[0].originFileObj as RcFile);
      }

      const shouldClearStudent = values.Status === "ว่าง";

      const payload = {
        room_number: values.RoomNumber,
        room_type_id: values.RoomTypeID,
        room_status: values.Status,
        rental_price: values.Price,
        student_id: shouldClearStudent ? null : room.StudentID,
        image: base64Image,
      };

      const res = await UpdateAllRoom(Number(id), payload);

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
          <InputNumber
            min={0}
            style={{ width: "100%", backgroundColor: "#f5f5f5" }}
            value={price}
            disabled
          />
        </Form.Item>

        <Form.Item label="อัปโหลดรูปภาพใหม่ (ไม่บังคับ)">
          <Upload
            accept="image/*"
            maxCount={1}
            beforeUpload={() => false}
            fileList={imageFileList}
            onChange={({ fileList }) => setImageFileList(fileList)}
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>เลือกรูปภาพ</Button>
          </Upload>

          {imagePreview && imageFileList.length === 0 && (
            <img
              src={imagePreview}
              alt="Current Room"
              style={{ marginTop: 10, maxWidth: "100%", maxHeight: 200, borderRadius: 4 }}
            />
          )}
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
