  import { useParams, useNavigate } from "react-router-dom";
  import { useState, useEffect } from "react";
  import { Input, Button, Form, message, Card, Typography } from "antd";
  import { UserOutlined, PhoneOutlined, HomeOutlined } from "@ant-design/icons";

  const { Title, Text } = Typography;

  function Booking() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        form.setFieldsValue({
          name: user.name,
          phone: user.phone,
        });
      }
    }, [form]);

    const onFinish = (values: any) => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        message.success(`จองห้อง ${id} สำเร็จ!`);
        navigate("/Room");
      }, 1500);
    };

    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md shadow-xl rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <HomeOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
            <Title level={3} className="m-0">
              จองห้องพักหมายเลข {id}
            </Title>
          </div>

          <Text type="secondary" className="block mb-6">
            กรุณากรอกข้อมูลให้ครบถ้วนเพื่อทำการจอง
          </Text>

          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item
              label="ชื่อผู้จอง"
              name="name"
              rules={[{ required: true, message: "กรุณากรอกชื่อผู้จอง" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="ชื่อ-นามสกุล" />
            </Form.Item>

            <Form.Item
              label="เบอร์ติดต่อ"
              name="phone"
              rules={[
                { required: true, message: "กรุณากรอกเบอร์โทรศัพท์" },
                { pattern: /^\d+$/, message: "กรุณากรอกเฉพาะตัวเลข" },
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="เบอร์โทรศัพท์" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-11 text-lg rounded-xl"
              >
                ✅ ยืนยันการจอง
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  export default Booking;
