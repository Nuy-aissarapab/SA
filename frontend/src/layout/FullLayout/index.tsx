import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  UserOutlined,
  FileSearchOutlined,
  HomeOutlined,
  ToolOutlined,
  ExceptionOutlined,
  KeyOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { Layout, Menu, theme, Button, message } from "antd";

const { Header, Content, Footer, Sider } = Layout;

const FullLayout: React.FC = () => {
  const page = localStorage.getItem("page");
  const [messageApi, contextHolder] = message.useMessage();
  const [collapsed, setCollapsed] = useState(false);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const setCurrentPage = (val: string) => {
    localStorage.setItem("page", val);
  };

  const Logout = () => {
    localStorage.clear();
    messageApi.success("Logout successful");
    setTimeout(() => {
      location.href = "/";
    }, 2000);
  };

  const sidebarItems = [
    {
      key: "Contract",
      icon: <FileSearchOutlined />,
      label: <Link to="/Contract" onClick={() => setCurrentPage("Contract")}>ตรวจสอบสัญญาเช่า</Link>,
    },
    {
      key: "Student",
      icon: <UserOutlined />,
      label: <Link to="/Student" onClick={() => setCurrentPage("Student")}>ข้อมูลนักศึกษา</Link>,
    },
    {
      key: "Room",
      icon: <HomeOutlined />,
      label: <Link to="/Room" onClick={() => setCurrentPage("Room")}>ห้องพัก</Link>,
    },
    {
      key: "Assets",
      icon: <HomeOutlined />,
      label: <Link to="/Assets/assetroom" onClick={() => setCurrentPage("Assets")}>ทรัพย์สินหอพัก</Link>,
    },
    {
      key: "Maintenance",
      icon: <ToolOutlined />,
      label: <Link to="/Maintenance" onClick={() => setCurrentPage("Maintenance")}>แจ้งซ่อม</Link>,
    },
    {
      key: "Billing",
      icon: <ExceptionOutlined />,
      label: <Link to="/Billing" onClick={() => setCurrentPage("Billing")}>บิลและใบแจ้งหนี้</Link>,
    },
    {
      key: "customer",
      icon: <KeyOutlined />,
      label: <Link to="/" onClick={() => setCurrentPage("customer")}>เปลี่ยนรหัสผ่าน</Link>,
    },
  ];

  const headerItems = [
    {
      key: "Contract",
      label: <Link to="/Contract" onClick={() => setCurrentPage("Contract")}>หน้าหลัก</Link>,
    },
    {
      key: "Review",
      label: <Link to="/Review" onClick={() => setCurrentPage("Review")}>รีวิวและประเมินหอพัก</Link>,
    },
    {
      key: "customer",
      label: <Link to="/" onClick={() => setCurrentPage("customer")}>ติดต่อเจ้าหน้าที่</Link>,
    },
    {
      key: "logout",
      label: <span onClick={Logout} style={{ cursor: 'pointer' }}>ออกจากระบบ</span>,
    },
    {
      key: "language",
      label: <span>เปลี่ยนภาษา <DownOutlined /></span>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {contextHolder}

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{ backgroundColor: '#253543' }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            backgroundColor: '#253543',
            color: "white",
          }}
        >
          <div>
            <h1 style={{ color: 'white', textAlign: 'center', margin: '16px 0' }}>
              SUT<br />
              DORMITORY
              <hr style={{ border: 'none', borderTop: '1px solid white', width: '80%', margin: '10px auto' }} />
            </h1>

            <Menu
              theme="dark"
              defaultSelectedKeys={[page ? page : "dashboard"]}
              mode="inline"
              items={sidebarItems}
              style={{ backgroundColor: '#253543' }}
            />
          </div>

          <Button onClick={Logout} style={{ margin: 12 }}>
            ออกจากระบบ
          </Button>
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#C4C2C2',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Menu
            mode="horizontal"
            theme="dark"
            defaultSelectedKeys={[page ? page : "dashboard"]}
            style={{
              backgroundColor: '#253543',
              fontSize: '14px',
              flex: 1,
              justifyContent: 'flex-end',
            }}
            items={headerItems}
          />
        </Header>

        <Content style={{ margin: "0 16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: "100%",
              background: colorBgContainer,
            }}
          >
            <Outlet />
          </div>
        </Content>

        <Footer style={{ textAlign: "center" }}>
          System Analysis and Design 1/67
        </Footer>
      </Layout>
    </Layout>
  );
};

export default FullLayout;
