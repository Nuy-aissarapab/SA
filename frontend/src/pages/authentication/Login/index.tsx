import { useNavigate } from "react-router-dom";
import { authAPI } from "../../../Service/https";
import logo from "../../../assets/logo.png";
import type { LoginStudentRequest } from "../../../interfaces/Student";
import type { LoginAdminRequest } from "../../../interfaces/Admin";
import { useState } from "react";
import { Button, Card, Form, Input, message, Flex, Row, Col, Radio } from "antd";

type UserRole = "student" | "admin";

function SignInPages() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [role, setRole] = useState<UserRole>("student"); // เก็บ role เฉพาะ frontend

  const handleLogin = async (values: any) => {
    try {
      let res;
      if (role === "student") res = await authAPI.studentLogin(values);
      else res = await authAPI.adminLogin(values);
  
      if (res?.status === 200 && res?.data) {
        // เก็บข้อมูลลง localStorage
        localStorage.setItem("isLogin", "true");
        localStorage.setItem("role", role);
        localStorage.setItem("id", res.data.id.toString());
        localStorage.setItem("email", res.data.email);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("token_type", res.data.token_type ?? "Bearer");
  
        message.success("เข้าสู่ระบบสำเร็จ");
        navigate("/Main");
      } else if (res?.data?.error) {
        messageApi.error(res.data.error);
      } else {
        messageApi.error("Unexpected error. Please try again.");
        console.error("Login failed, response:", res);
      }
    } catch (error) {
      console.error("Login error:", error);
      messageApi.error("Unexpected error. Please try again.");
    }
  };
  
  

  return (
    <>
      {contextHolder}
      <Flex justify="center" align="center" className="login">
        <Card className="card-login" style={{ width: 500 }}>
          <Row align={"middle"} justify={"center"} style={{ height: "450px" }}>
            <Col span={24}>
              <img alt="logo" style={{ width: "80%" }} src={logo} className="images-logo" />
            </Col>
            <Col span={24}>
              <Form
                name="basic"
                onFinish={handleLogin}
                autoComplete="off"
                layout="vertical"
              >
                {/* ✅ ใช้ state role ไม่ผูกกับ Form */}
                <Form.Item label="Role">
                  <Radio.Group
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <Radio value="student">Student</Radio>
                    <Radio value="admin">Admin</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  label="email"
                  name="email"
                  rules={[{ required: true, message: "Please input your email!" }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="password"
                  name="password"
                  rules={[{ required: true, message: "Please input your password!" }]}
                >
                  <Input.Password />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" style={{ marginBottom: 20 }}>
                    Log in
                  </Button>
                  Or <a onClick={() => navigate("/signup")}>signup now !</a>
                </Form.Item>
              </Form>
            </Col>
          </Row>
        </Card>
      </Flex>
    </>
  );
}

export default SignInPages;
