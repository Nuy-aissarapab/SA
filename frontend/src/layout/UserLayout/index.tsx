import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  HomeOutlined,
  FileSearchOutlined,
  ToolOutlined,
  ExceptionOutlined,
  KeyOutlined,
  DownOutlined,
  CommentOutlined
} from "@ant-design/icons";
import { Layout, Menu, theme, Button, message } from "antd";

const { Header, Content, Footer, Sider } = Layout;

const UserLayout: React.FC = () => {
  const page = localStorage.getItem("page");
  const [collapsed, setCollapsed] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

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
      location.href = "/"; // เปลี่ยนเป็นหน้าหลักหรือล็อกอิน
    }, 1500);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {contextHolder}

      {/* Sidebar */}
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", backgroundColor: '#253543' }}>
          <div>
            <h1 style={{ color: 'white', textAlign: 'center' }}>
              SUT<br />
              DORMITORY
              <hr style={{ border: 'none', borderTop: '1px solid white', width: '80%', margin: '10px auto' }} />
            </h1>

            <Menu
              theme="dark"
              mode="inline"
              style={{ backgroundColor: '#253543' }}
              defaultSelectedKeys={[page ? page : "user-home"]}
            >
              <Menu.Item key="user-home" onClick={() => setCurrentPage("user-home")}>
                <Link to="/user">
                  <HomeOutlined />
                  <span>หน้าหลัก</span>
                </Link>
              </Menu.Item>

              <Menu.Item key="user-contract" onClick={() => setCurrentPage("user-contract")}>
                <Link to="/user/contract">
                  <FileSearchOutlined />
                  <span>ตรวจสอบสัญญาเช่า</span>
                </Link>
              </Menu.Item>

              <Menu.Item key="user-billing" onClick={() => setCurrentPage("user-billing")}>
                <Link to="/user/billing">
                  <ExceptionOutlined />
                  <span>บิลของฉัน</span>
                </Link>
              </Menu.Item>

              <Menu.Item key="user-maintenance" onClick={() => setCurrentPage("user-maintenance")}>
                <Link to="/user/maintenance">
                  <ToolOutlined />
                  <span>แจ้งซ่อม</span>
                </Link>
              </Menu.Item>

              <Menu.Item key="user-review" onClick={() => setCurrentPage("user-review")}>
                <Link to="/user/review">
                  <CommentOutlined />
                  <span>รีวิวหอพัก</span>
                </Link>
              </Menu.Item>

              <Menu.Item key="user-password" onClick={() => setCurrentPage("user-password")}>
                <Link to="/user/change-password">
                  <KeyOutlined />
                  <span>เปลี่ยนรหัสผ่าน</span>
                </Link>
              </Menu.Item>
            </Menu>
          </div>

          <Button onClick={Logout} style={{ margin: 8 }}>
            ออกจากระบบ
          </Button>
        </div>
      </Sider>

      {/* Main Layout */}
      <Layout>
        {/* Header */}
        <Header style={{
          padding: '0 24px',
          background: '#C4C2C2',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Menu
            mode="horizontal"
            theme="dark"
            style={{ backgroundColor: '#253543', fontSize: '14px', flex: 1, justifyContent: 'flex-end' }}
            defaultSelectedKeys={[page ? page : "user-home"]}
          >
            <Menu.Item key="user-home" onClick={() => setCurrentPage("user-home")}>
              <Link to="/user">หน้าหลัก</Link>
            </Menu.Item>
            <Menu.Item key="user-review" onClick={() => setCurrentPage("user-review")}>
              <Link to="/user/review">รีวิวหอพัก</Link>
            </Menu.Item>
            <Menu.Item key="user-contact" onClick={() => setCurrentPage("user-contact")}>
              <Link to="/user/contact">ติดต่อเจ้าหน้าที่</Link>
            </Menu.Item>
            <Menu.Item key="logout" onClick={Logout}>
              ออกจากระบบ
            </Menu.Item>
            <Menu.Item key="language">
              เปลี่ยนภาษา <DownOutlined />
            </Menu.Item>
          </Menu>
        </Header>

        {/* Content */}
        <Content style={{ margin: "0 16px" }}>
          <div style={{ padding: 24, minHeight: "100%", background: colorBgContainer }}>
            <Outlet />
          </div>
        </Content>

        {/* Footer */}
        <Footer style={{ textAlign: "center" }}>
          SUT Dormitory ©2025 สำหรับนักศึกษา
        </Footer>
      </Layout>
    </Layout>
  );
};

export default UserLayout;
