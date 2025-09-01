import React, { useState } from "react";

import { Routes, Route, Link ,useNavigate} from "react-router-dom";

import "../../App.css";

import { UserOutlined, DashboardOutlined, FileSearchOutlined, SolutionOutlined, HomeOutlined, ToolOutlined, ExceptionOutlined, KeyOutlined ,DownOutlined } from "@ant-design/icons";

import { Breadcrumb, Layout, Menu, theme, Button, message } from "antd";

import logo from "../../assets/logo.png";

import Dashboard from "../../pages/dashboard";

import Customer from "../../pages/customer";

// import CustomerCreate from "../../pages/customer/create";

// import CustomerEdit from "../../pages/customer/edit";

import Contract from "../../pages/Contract";

import Billing from "../../pages/Billing";

import Payment from "../../pages/Payment";

import Evidence from "../../../src/pages/Payment/Evidence"

import EvidenceFail from "../../pages/Payment/Evidence/EvidenceSuccess/EvidenceSuccess"

import EvidenceSuccess from "../../pages/Payment/Evidence/EvidenceSuccess/EvidenceSuccess"

import Student from "../../pages/Student";

import UpdateInfo from "../../pages/Student/UpdateInfo/UpdateInfo";

import Assets from "../../pages/Assets";

import Room from "../../pages/Room";

import Maintenance from "../../pages/Maintenance";

import MaintenanceCreate from "../../pages/Maintenance/Create";

import MaintenanceEdit from "../../pages/Maintenance/Edit";

import Review from "../../pages/Review"

import ReviewEdit from "../../pages/Review/Edit"

import ReviewCreate from "../../pages/Review/Create"

import Bank from "../../../src/pages/Payment/Bank"

import QRCode from "../../../src/pages/Payment/QRCode"

import Managecontracts from "../../pages/Contract/Managecontracts"

import Extendcontract from "../../pages/Contract/Extendcontract"

import EvidenceGallery from "../../pages/Contract/Extendcontract/EvidenceGallery"

import History from "../../pages/Contract/History"

import Main from "../../pages/Main"

import Login from "../../pages/authentication/Login"

import Announcement from "../../pages/Announcement"



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

  const headerStyle: React.CSSProperties = {
    padding: 0,                 // ตัด padding ออกให้ “ชิดขอบ”
    background: "#253543",      // สีเดียวกับเมนู
    borderBottom: "0",
    display: "flex",
    alignItems: "center",
  };

  const menuStyle: React.CSSProperties = {
    background: "transparent",
    borderBottom: 0,
    width: "100%",              // ให้เมนูยืดเต็มความกว้าง
    display: "flex",
    justifyContent: "flex-end", // ถ้าอยากกระจายเต็มเปลี่ยนเป็น 'space-between'
    alignItems: "center",
  };

  const itemStyle: React.CSSProperties = {
    margin: 0,                 // ตัด margin เริ่มต้นของ item
    padding: "0 20px",         // ระยะห่างระหว่างแท็บ (ปรับตามชอบ)
  };

  return (

    <Layout style={{ minHeight: "100vh" }}>

      {contextHolder}


      <Sider

        collapsible

        collapsed={collapsed}

        onCollapse={(value) => setCollapsed(value)}

      >

        <div

          style={{

            display: "flex",

            flexDirection: "column",

            justifyContent: "space-between",

            height: "100%",

            backgroundColor: '#253543'

          }}

        >

          <div >

            <div

              style={{


                justifyContent: "center",

                alignItems: "center"
                
              }}

            >

            <h1 style={{ color: 'white', textAlign: 'center' }}>

                SUT<br />
                DORMITIRY
                <hr style={{ border: 'none', borderTop: '1px solid white', width: '80%', margin: '10px auto' }} />
            </h1>

            </div>

            <Menu
              style = {{backgroundColor: '#253543'}}

              theme="dark"

              defaultSelectedKeys={[page ? page : "dashboard"]}

              mode="inline"

              

            >  

              <Menu.Item

                key="Contract"

                onClick={() => setCurrentPage("Contract")}

              >

                <Link to="/Contract">

                  <FileSearchOutlined />

                  <span>ตรวจสอบสัญญาเช่า</span>

                </Link>

              </Menu.Item>


              <Menu.Item

                key="Student"

                onClick={() => setCurrentPage("Student")}

              >

                <Link to="/Student">

                  <UserOutlined />

                  <span>ข้อมูลนักศึกษา</span>

                </Link>

              </Menu.Item>

              <Menu.Item

                key="Room"

                onClick={() => setCurrentPage("Room")}

              >

                <Link to="/Room">

                  <HomeOutlined />

                  <span>ห้องพัก</span>

                </Link>

              </Menu.Item>

              <Menu.Item

                key="Assets"

                onClick={() => setCurrentPage("Assets")}

              >

                <Link to="/Assets">

                  <HomeOutlined />

                  <span>ทรัพย์สินหอพัก</span>

                </Link>

              </Menu.Item>

              <Menu.Item

                key="Maintenance"

                onClick={() => setCurrentPage("Maintenance")}

              >

                <Link to="/Maintenance">

                  <ToolOutlined />

                  <span>แจ้งซ่อม</span>

                </Link>

              </Menu.Item>

              <Menu.Item

                key="Billing"

                onClick={() => setCurrentPage("Billing")}

              >

                <Link to="/Billing">

                  <ExceptionOutlined />

                  <span>บิลและใบแจ้งหนี้</span>

                </Link>

              </Menu.Item>

              <Menu.Item

                key="Announcement"

                onClick={() => setCurrentPage("Announcement")}

              >

                <Link to="/Announcement">

                  <UserOutlined />

                  <span>Announcement</span>

                </Link>

              </Menu.Item>

              <Menu.Item

                key="customer"

                onClick={() => setCurrentPage("customer")}

              >

                <Link to="/">

                  <KeyOutlined />

                  <span>เปลี่ยนรหัสผ่าน</span>

                </Link>

              </Menu.Item>

            </Menu>

          </div>

        </div>

      </Sider>


      <Layout >

        {/* Add Header */}
        <Header style={headerStyle}>
          <Menu
            mode="horizontal"
            theme="dark"
            defaultSelectedKeys={[page ? page : "dashboard"]}
            style={menuStyle}
          >
            <Menu.Item key="Main" style={itemStyle} onClick={() => setCurrentPage("Main")}>
              <Link to="/Main">หน้าหลัก</Link>
            </Menu.Item>

            <Menu.Item key="Review" style={itemStyle} onClick={() => setCurrentPage("Review")}>
              <Link to="/Review">รีวิวและประเมินหอพัก</Link>
            </Menu.Item>

            <Menu.Item key="customer" style={itemStyle} onClick={() => setCurrentPage("customer")}>
              <Link to="/">ติดต่อเจ้าหน้าที่</Link>
            </Menu.Item>

            <Menu.Item
              key="Logout"
              style={itemStyle}
              onClick={() => {
                localStorage.removeItem("isLogin");
              }}
            >
              <Link to="/">ออกจากระบบ</Link>
            </Menu.Item>

            <Menu.Item key="lang" style={itemStyle} onClick={() => setCurrentPage("customer")}>
              <Link to="/">
                เปลี่ยนภาษา <DownOutlined />
              </Link>
            </Menu.Item>
          </Menu>
        </Header>

        <Content style={{ margin: "0 16px" }}>

          <Breadcrumb style={{ margin: "16px 0" }} />

          <div

            style={{

              padding: 24,

              minHeight: "100%",

              background: colorBgContainer,
              

            }}

          >

            <Routes>

              <Route path="/" element={<Dashboard />} />

              <Route path="/customer" element={<Customer />} />

              {/* <Route path="/customer/create" element={<CustomerCreate />} />

              <Route path="/customer/edit/:id" element={<CustomerEdit />} /> */}

              <Route path="/Contract" element={<Contract />} />

              <Route path="/Billing" element={<Billing />} />

              <Route path="/Billing/Payment" element={<Payment />} />

              <Route path="/Student" element={<Student />} />

              <Route path="/Assets" element={<Assets />} />

              <Route path="/Room" element={<Room />} />

              <Route path="/Maintenance" element={<Maintenance />} />

              <Route path="/Maintenance/Create" element={<MaintenanceCreate />} />

              <Route path="/Maintenance/Edit" element={<MaintenanceEdit />} />

              <Route path="/Review" element={<Review />} />

              <Route path="/Review/Create" element={<ReviewCreate />} />

              <Route path="/Review/Edit/:id" element={<ReviewEdit />} /> {/* ✅ ต้องมี :id */}

              <Route path="/Bank" element={<Bank />} />

              <Route path="/Payment/Bank" element={<Bank />} />

              <Route path="/Payment/QRCode" element={<QRCode />} />

              <Route path="/Payment/Evidence" element={<Evidence />} />

              <Route path="/Payment/Evidence/EvidenceSuccess" element={<EvidenceSuccess />} />

              <Route path="/Payment/Evidence/EvidenceFail" element={<EvidenceFail />} />

              <Route path="/Bank" element={<Bank />} />

              <Route path="/Contract" element={<Contract />} />

              <Route path="/Contract/Managecontracts" element={<Managecontracts />} />

              <Route path="/Contract/Extendcontract" element={<Extendcontract />} />

              <Route path="/Contract/History" element={<History />} />

              <Route path="/Contract/Extendcontract/EvidenceGallery" element={<EvidenceGallery />} />

              <Route path="/Main" element={<Main />} />

              <Route path="/Login" element={<Login />} />


              <Route path="/Announcement" element={<Announcement/>} />



            </Routes>

          </div>

        </Content>

      </Layout>


    </Layout>


  );

  

};


export default FullLayout;
