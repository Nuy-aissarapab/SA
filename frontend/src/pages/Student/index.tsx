import React, { useEffect, useMemo, useState } from "react";
import {
  Space,
  Table,
  Button,
  Col,
  Row,
  Divider,
  message,
  Popconfirm,
  Tooltip,
  Modal,
  Form,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Input } from "antd";
import { Update } from "../../Service/https";

const { Search } = Input;

// ====== Service functions (ตามโปรเจ็กต์ของคุณ) ======
import {
  GetStudents,
  DeleteUsersById,
  GetUsersById,
} from "../../Service/https";
import type { StudentInterface } from "../../interfaces/Student";

// ====== ตัวช่วยเล็ก ๆ ======
const roleFromStorage = () =>
  (localStorage.getItem("role") || "").toLowerCase() as
    | "admin"
    | "student"
    | "";

// =======================
// หน้าฝั่งแอดมิน (ตารางนักศึกษา)
// =======================
const AdminStudentTable: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const myId = localStorage.getItem("id");
  const [filtered, setFiltered] = useState<StudentInterface[]>([]);
  // ✅ NEW: state/logic เปลี่ยนรหัสผ่าน (แอดมิน)
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdTarget, setPwdTarget] = useState<{ id?: number; name?: string }>(
    {}
  );
  const [pwdForm] = Form.useForm();

  const openPwdModal = (rec: StudentInterface) => {
    setPwdTarget({
      id: rec.ID,
      name: `${rec.first_name ?? ""} ${rec.last_name ?? ""}`.trim(),
    });
    pwdForm.resetFields();
    setPwdOpen(true);
  };

  const submitPwd = async (values: any) => {
  if (!pwdTarget.id) return;
  setPwdLoading(true);
  try {
    const res = await Update(`/student/${pwdTarget.id}/password`, {
      new_password: values.newPassword, // ✅ admin ไม่ต้องส่ง old_password
    });
    if (res?.status === 200) {
      message.success("อัปเดตรหัสผ่านสำเร็จ");
      setPwdOpen(false);
    } else {
      message.error(res?.data?.error || "อัปเดตรหัสผ่านไม่สำเร็จ");
    }
  } catch (e) {
    console.error(e);
    message.error("เกิดข้อผิดพลาด");
  } finally {
    setPwdLoading(false);
  }
};


  const refresh = async () => {
    const res = await GetStudents();
    if (res?.status === 200) {
      setStudent(res.data || []);
      setFiltered(res.data || []);
    } else {
      setStudent([]);
      setFiltered([]);
      messageApi.open({
        type: "error",
        content: res?.data?.error || "โหลดรายชื่อล้มเหลว",
      });
    }
  };

  const deleteUserById = async (id: string | number) => {
    const res = await DeleteUsersById(String(id));
    if (res?.status === 200) {
      messageApi.open({
        type: "success",
        content: res.data.message || "ลบสำเร็จ",
      });
      await refresh();
    } else {
      messageApi.open({
        type: "error",
        content: res?.data?.error || "ลบไม่สำเร็จ",
      });
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (value: string) => {
    const keyword = value.trim().toLowerCase();
    if (!keyword) {
      setFiltered(student);
      return;
    }
    const filteredList = student.filter(
      (s) =>
        s.first_name?.toLowerCase().includes(keyword) ||
        s.last_name?.toLowerCase().includes(keyword)
    );
    setFiltered(filteredList);
  };

  const columns: ColumnsType<StudentInterface> = useMemo(
    () => [
      {
        title: "ลำดับ",
        key: "index",
        align: "center",
        width: 90,
        render: (_record, _row, index) => index + 1,
      },
      {
        title: "รหัสนักศึกษา",
        dataIndex: "ID",
        key: "ID",
        width: 120,
      },
      {
        title: "ชื่อ",
        key: "first_name",
        render: (record) => `${record?.first_name ?? ""}`.trim() || "-",
      },
      {
        title: "นามสกุล",
        key: "last_name",
        render: (record) => `${record?.last_name ?? ""}`.trim() || "-",
      },
      {
        title: "จัดการ",
        key: "actions",
        width: 200,
        render: (record) => (
          <Space>
            <Button
              type="primary"
              onClick={() =>
                navigate(`/student/UpdateInfo/UpdateInfo/${record.ID}`)
              }
            >
              แก้ไข
            </Button>
            <Button onClick={() => openPwdModal(record)}>แก้ไขรหัสผ่าน</Button>

            <Popconfirm
              title="ยืนยันการลบ"
              description={`ต้องการลบนักศึกษา ID: ${record.ID} ใช่ไหม?`}
              okText="ลบเลย"
              cancelText="ยกเลิก"
              onConfirm={() => deleteUserById(record.ID!)} // ✅ ลบได้แม้เป็นตัวเอง
            >
              <Button danger icon={<DeleteOutlined />}>
                ลบ
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [navigate, myId]
  );

  return (
    <>
      {contextHolder}
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h1>จัดการข้อมูลนักศึกษา</h1>
        </Col>
        <Col>
          <Space
            direction="vertical"
            style={{ width: "100%", marginBottom: 16 }}
          >
            <Search
              placeholder="ค้นหาชื่อ..."
              allowClear
              onSearch={onSearch}
              style={{ width: 240 }}
            />
            <Button
              type="primary"
              onClick={() => navigate("/admin/students/create")}
            >
              เพิ่มนักศึกษา
            </Button>
          </Space>
        </Col>
      </Row>

      <Divider />
      <Table
        rowKey="ID"
        columns={columns}
        dataSource={filtered}
        style={{ width: "100%", overflow: "auto" }}
      />
      {/* ✅ NEW: Modal เปลี่ยนรหัสผ่าน (แอดมิน) */}
      <Modal
        open={pwdOpen}
        title={`เปลี่ยนรหัสผ่าน: ${pwdTarget.name ?? ""} (ID: ${
          pwdTarget.id ?? "-"
        })`}
        onCancel={() => setPwdOpen(false)}
        onOk={() => pwdForm.submit()}
        confirmLoading={pwdLoading}
        okText="บันทึก"
        cancelText="ยกเลิก"
        destroyOnClose
      >
        <Form form={pwdForm} layout="vertical" onFinish={submitPwd}>
          <Form.Item
            label="รหัสผ่านใหม่"
            name="newPassword"
            rules={[
              { required: true, message: "กรอกรหัสผ่านใหม่" },
              { min: 6, message: "อย่างน้อย 6 ตัวอักษร" },
            ]}
          >
            <Input.Password placeholder="อย่างน้อย 6 ตัวอักษร" />
          </Form.Item>
          <Form.Item
            label="ยืนยันรหัสผ่านใหม่"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "กรอกยืนยันรหัสผ่าน" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value)
                    return Promise.resolve();
                  return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="พิมพ์ซ้ำให้ตรงกัน" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// =======================
// หน้าฝั่งนักศึกษา (ข้อมูลส่วนตัว) — เวอร์ชันแสดงครบ
// =======================
const StudentSelfInfo: React.FC = () => {
  const [user, setUser] = useState<StudentInterface>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const UserID = localStorage.getItem("id");
  // ✅ NEW: เปลี่ยนรหัสผ่าน (นักศึกษา)
  const [selfPwdOpen, setSelfPwdOpen] = useState(false);
  const [selfPwdLoading, setSelfPwdLoading] = useState(false);
  const [selfPwdForm] = Form.useForm();

  const submitSelfPwd = async (values: any) => {
  if (!user?.ID) return;

  if (values.currentPassword === values.newPassword) {
    message.error("รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม");
    return;
  }

  setSelfPwdLoading(true);
  try {
    const res = await Update(`/student/${user.ID}/password`, {
      old_password: values.currentPassword,
      new_password: values.newPassword,
    });
    if (res?.status === 200) {
      message.success("เปลี่ยนรหัสผ่านสำเร็จ");
      setSelfPwdOpen(false);
      selfPwdForm.resetFields();
    } else if (res?.status === 401) {
      message.error(res?.data?.error || "รหัสผ่านเดิมไม่ถูกต้อง");
    } else {
      message.error(res?.data?.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    }
  } catch (e) {
    console.error(e);
    message.error("เกิดข้อผิดพลาด");
  } finally {
    setSelfPwdLoading(false);
  }
};


  useEffect(() => {
    if (!UserID) {
      setError("ไม่พบ User ID ใน localStorage");
      setLoading(false);
      return;
    }
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await GetUsersById(UserID);
        setUser(res?.data);
      } catch (err) {
        console.error("Error fetching student:", err);
        setError("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [UserID]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;
  if (!user) return <div>ไม่พบข้อมูลผู้ใช้</div>;

  // const contractsCount = Array.isArray(user.contracts) ? user.contracts.length : 0;
  // const paymentsCount = Array.isArray(user.payments) ? user.payments.length : 0;

  return (
    <div style={pageWrapper}>
      <div key={user.ID} style={containerStyle}>
        <div style={buttonGroupStyle}>
          <Link to={`/student/UpdateInfo/UpdateInfo/${user.ID}`}>
            <button style={btnStyleGreen}>เปลี่ยนแปลงข้อมูล</button>
          </Link>
          <button
            style={btnStyle}
            onClick={() => {
              selfPwdForm.resetFields();
              setSelfPwdOpen(true);
            }}
          >
            เปลี่ยนรหัสผ่าน
          </button>
        </div>

        <Modal
          open={selfPwdOpen}
          title="เปลี่ยนรหัสผ่านของฉัน"
          onCancel={() => {
            setSelfPwdOpen(false);
            selfPwdForm.resetFields();
          }}
          onOk={() => selfPwdForm.submit()}
          confirmLoading={selfPwdLoading}
          okText="บันทึก"
          cancelText="ยกเลิก"
          destroyOnClose
        >
          <Form form={selfPwdForm} layout="vertical" onFinish={submitSelfPwd}>
            <Form.Item
              label="รหัสผ่านเดิม"
              name="currentPassword"
              rules={[{ required: true, message: "กรอกรหัสผ่านเดิม" }]}
            >
              <Input.Password placeholder="รหัสผ่านเดิม" />
            </Form.Item>

            <Form.Item
              label="รหัสผ่านใหม่"
              name="newPassword"
              rules={[
                { required: true, message: "กรอกรหัสผ่านใหม่" },
                { min: 6, message: "อย่างน้อย 6 ตัวอักษร" },
              ]}
            >
              <Input.Password placeholder="อย่างน้อย 6 ตัวอักษร" />
            </Form.Item>

            <Form.Item
              label="ยืนยันรหัสผ่านใหม่"
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "กรอกยืนยันรหัสผ่าน" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value)
                      return Promise.resolve();
                    return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="พิมพ์ซ้ำให้ตรงกัน" />
            </Form.Item>
          </Form>
        </Modal>

        {/* ข้อมูลบัญชี/ระบบ */}
        <h2 style={sectionTitle}>ข้อมูลบัญชี</h2>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={cellTitle}>ID</td>
              <td style={cellValue}>{user.ID ?? "N/A"}</td>
              <td style={cellTitle}>Username</td>
              <td style={cellValue}>{user.username || "-"}</td>
            </tr>
            <tr>
              <td style={cellTitle}>Email</td>
              <td style={cellValue}>{user.email || "-"}</td>
              <td style={cellTitle}>สาขา (Major)</td>
              <td style={cellValue}>{user.major || "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* ข้อมูลทั่วไป */}
        <h2 style={sectionTitle}>ข้อมูลทั่วไป</h2>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={cellTitle}>ชื่อจริง</td>
              <td style={cellValue}>{user.first_name || "-"}</td>
              <td style={cellTitle}>นามสกุล</td>
              <td style={cellValue}>{user.last_name || "-"}</td>
            </tr>
            <tr>
              <td style={cellTitle}>วัน/เดือน/ปีเกิด</td>
              <td style={cellValue}>
                {user.birthday
                  ? dayjs(user.birthday).format("DD/MM/YYYY")
                  : "N/A"}
              </td>
              <td style={cellTitle}>หมายเลขโทรศัพท์</td>
              <td style={cellValue}>{user.phone || "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* ผู้ปกครอง */}
        <h2 style={sectionTitle}>ข้อมูลผู้ปกครอง</h2>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={cellTitle}>ชื่อผู้ปกครอง</td>
              <td style={cellValue}>{user.parent_name || "-"}</td>
              <td style={cellTitle}>เบอร์ผู้ปกครอง</td>
              <td style={cellValue}>{user.parent_phone || "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* ที่อยู่ */}
        <h2 style={sectionTitle}>ที่อยู่</h2>
        <textarea
          value={user.address || ""}
          readOnly
          style={addressStyle}
          placeholder="ไม่มีข้อมูลที่อยู่"
        />

        {/* ที่พัก/ห้อง */}
        <h2 style={sectionTitle}>ข้อมูลที่พัก/ห้อง</h2>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={cellTitle}>Room_ID</td>
              <td style={cellValue}>{user.room_id ?? "-"}</td>
              <td style={cellTitle}>รายละเอียดห้อง</td>
              <td style={cellValue}>
                {/* ถ้าหลังบ้านส่งรายละเอียด Room มาด้วย ค่อย render เพิ่มได้ */}
                {user.room ? "มีข้อมูลห้อง" : "-"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* สรุปสัญญา/การชำระเงิน 
        <h2 style={sectionTitle}>สรุปสัญญา/การชำระเงิน</h2>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={cellTitle}>จำนวนสัญญา (Contract)</td>
              <td style={cellValue}>{contractsCount}</td>
              <td style={cellTitle}>จำนวนการชำระเงิน (Payments)</td>
              <td style={cellValue}>{paymentsCount}</td>
            </tr>
          </tbody>
        </table> */}
      </div>
    </div>
  );
};

// =======================
// หน้าเดียวจบ: เลือกเรนเดอร์ตาม role
// =======================
const StudentPage: React.FC = () => {
  const role = roleFromStorage();

  if (!role) {
    return (
      <div style={{ padding: 16 }}>
        ไม่พบ <code>role</code> ใน <code>localStorage</code> (ควรเป็น "admin"
        หรือ "student")
      </div>
    );
  }

  if (role === "admin") return <AdminStudentTable />;
  if (role === "student") return <StudentSelfInfo />;
  return <div style={{ padding: 16 }}>role ไม่ถูกต้อง: {role}</div>;
};

export default StudentPage;

/* ===== Styles (ฝั่งนักศึกษา) ===== */
const pageWrapper: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "16px 20px",
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "980px",
  backgroundColor: "#fff",
  padding: "16px",
  border: "1px solid #ddd",
  borderRadius: "8px",
};

const buttonGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  marginBottom: "10px",
};

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  backgroundColor: "#e5e5e5",
  border: "1px solid #ccc",
  borderRadius: "6px",
  cursor: "pointer",
};

const btnStyleGreen: React.CSSProperties = {
  ...btnStyle,
  backgroundColor: "#4CAF7A",
  color: "#fff",
  border: "none",
};

const sectionTitle: React.CSSProperties = { margin: "6px 0 8px 0" };

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "12px",
};

const cellTitle: React.CSSProperties = {
  backgroundColor: "#f3f5f7",
  padding: "8px",
  border: "1px solid #ddd",
  fontWeight: 600,
  width: "25%",
  fontSize: "14px",
};

const cellValue: React.CSSProperties = {
  padding: "8px",
  border: "1px solid #ddd",
  width: "25%",
  fontSize: "14px",
};

const addressStyle: React.CSSProperties = {
  width: "100%",
  height: "88px",
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "14px",
  resize: "none",
};
