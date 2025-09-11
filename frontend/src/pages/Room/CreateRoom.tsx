import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  PostAllRooms,
  GetAllRoomTypes,
  GetAllRooms,
} from "../../Service/https/index";
import type { RoomInterface } from "../../interfaces/Room";
import { useEffect, useState } from "react";
import type { RcFile, UploadFile } from "antd/es/upload";

const { Option } = Select;

const getBase64 = (file: RcFile): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

function CreateRoomForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const res = await GetAllRoomTypes();
        const types = Array.isArray(res) ? res : res?.data ?? [];
        if (Array.isArray(types)) {
          setRoomTypes(types);
        } else {
          messageApi.error("โหลดข้อมูลประเภทห้องไม่สำเร็จ");
        }
      } catch (error) {
        messageApi.error("เกิดข้อผิดพลาดในการโหลดประเภทห้อง");
      }
    };
    fetchRoomTypes();
  }, [messageApi]);

  const onFinish = async (values: any) => {
    try {
      const resRooms = await GetAllRooms();
      const rooms = Array.isArray(resRooms) ? resRooms : resRooms?.data ?? [];
      const isDuplicate = rooms.some((r: any) => r.room_number === values.room_number);
      if (isDuplicate) {
        messageApi.error("หมายเลขห้องนี้ถูกใช้งานแล้ว");
        return;
      }

      const fileList: UploadFile[] = values.image || [];
      let imageBase64 = "";

      if (fileList.length > 0 && fileList[0].originFileObj) {
        imageBase64 = await getBase64(fileList[0].originFileObj as RcFile);
      }

      // Ensure imageBase64 is not empty
      if (!imageBase64) {
        messageApi.error("กรุณาอัปโหลดรูปภาพก่อนบันทึก");
        return;
      }

      const payload: RoomInterface = {
        RoomNumber: values.room_number,
        RoomTypeID: values.room_type,
        Status: values.status,
        AdminID: Number(localStorage.getItem("id")),
        Image: imageBase64,
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

            <Form.Item
              label="อัปโหลดรูปห้อง (1 รูป)"
              name="image"
              valuePropName="fileList"
              getValueFromEvent={(e) => e?.fileList}
              rules={[{ required: true, message: "กรุณาอัปโหลดรูปภาพ" }]}
            >
              <Upload
                accept="image/*"
                maxCount={1}
                beforeUpload={() => false}
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>เลือกไฟล์รูปภาพ</Button>
              </Upload>
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
