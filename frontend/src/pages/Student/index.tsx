import React, { useEffect, useMemo, useState } from "react";
import { Space, Table, Button, Col, Row, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

// ====== Service functions (ตามโปรเจ็กต์ของคุณ) ======
import { GetStudents, DeleteUsersById, GetUsersById } from "../../Service/https";
import type { StudentInterface } from "../../interfaces/Student";

// ====== ตัวช่วยเล็ก ๆ ======
const roleFromStorage = () => (localStorage.getItem("role") || "").toLowerCase() as "admin" | "student" | "";

// =======================
// หน้าฝั่งแอดมิน (ตารางนักศึกษา)
// =======================
const AdminStudentTable: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const myId = localStorage.getItem("id");

  const refresh = async () => {
    const res = await GetStudents();
    console.log("GetStudents res =", res.data);//
    if (res?.status === 200) {
      setStudent(res.data || []);
    } else {
      setStudent([]);
      messageApi.open({ type: "error", content: res?.data?.error || "โหลดรายชื่อล้มเหลว" });
    }
  };

  const deleteUserById = async (id: string | number) => {
    const res = await DeleteUsersById(String(id));
    if (res?.status === 200) {
      messageApi.open({ type: "success", content: res.data.message || "ลบสำเร็จ" });
      await refresh();
    } else {
      messageApi.open({ type: "error", content: res?.data?.error || "ลบไม่สำเร็จ" });
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<StudentInterface> = useMemo(
    () => [
      {
        title: "",
        key: "actions",
        render: (record) => (
          <>
            {String(myId) === String(record?.ID) ? null : (
              <Button
                type="dashed"
                danger
                icon={<DeleteOutlined />}
                onClick={() => deleteUserById(record.ID as unknown as string)}
              />
            )}
          </>
        ),
        width: 80,
      },
      { title: "ลำดับ", dataIndex: "Student_ID", key: "Student_ID", width: 120 },
      { title: "ชื่อ", dataIndex: "first_name", key: "first_name" },
      { title: "นามสกุล", dataIndex: "last_name", key: "last_name" },
      { title: "อีเมล", dataIndex: "email", key: "email" },
      {
        title: "วัน/เดือน/ปี เกิด",
        key: "birthday",
        render: (record) => <>{record?.birthday ? dayjs(record.birthday).format("DD/MM/YYYY") : "-"}</>,
        width: 160,
      },
      {
        title: "",
        key: "edit",
        render: (record) => (
          <Button
            type="primary"
            onClick={() => navigate(`/customer/edit/${record.ID}`)} // ✅ ใช้ backticks
          >
            แก้ไขข้อมูล
          </Button>
        ),
        width: 140,
      },
    ],
    [myId, navigate]
  );

  return (
    <>
      {contextHolder}
      <Row>
        <Col span={12}>
          <h2>จัดการข้อมูลสมาชิก</h2>
        </Col>
        <Col span={12} style={{ textAlign: "end", alignSelf: "center" }}>
          <Space>
            <Link to="/customer/create">
              <Button type="primary" icon={<PlusOutlined />}>
                สร้างข้อมูล
              </Button>
            </Link>
          </Space>
        </Col>
      </Row>

      <Divider />
      <div style={{ marginTop: 20 }}>
        <Table
          rowKey="ID"
          columns={columns}
          dataSource={student}
          style={{ width: "100%", overflow: "auto" }}
        />
      </div>
    </>
  );
};



// =======================
// หน้าฝั่งนักศึกษา (ข้อมูลส่วนตัว)
// =======================
const StudentSelfInfo: React.FC = () => {
  const [user, setUser] = useState<StudentInterface>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const UserID = localStorage.getItem("id");


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

  return (
    <div style={pageWrapper}>
      <div key={user.ID} style={containerStyle}>
        <div style={buttonGroupStyle}>
          <Link to={`/student/UpdateInfo/UpdateInfo/${user.ID}`}>
              <button style={btnStyle}>เปลี่ยนแปลงข้อมูล</button>
          </Link>
          <button style={btnStyleGreen}>ยืนยันข้อมูล</button>
        </div>

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
              <td style={cellTitle}>หมายเลขโทรศัพท์มือถือ</td>
              <td style={cellValue}>{user.phone || "N/A"}</td>
              <td style={cellTitle}>Email</td>
              <td style={cellValue}>{user.email || "N/A"}</td>
            </tr>
            <tr>
              <td style={cellTitle}>วัน/เดือน/ปีเกิด</td>
              <td style={cellValue}>
                {user.birthday ? dayjs(user.birthday).format("DD/MM/YYYY") : "N/A"}
              </td>
              <td style={cellTitle}>ID</td>
              <td style={cellValue}>{user.ID ?? "N/A"}</td>
            </tr>
          </tbody>
        </table>

        <h2 style={sectionTitle}>ข้อมูลที่อยู่</h2>
        <textarea
          value={user.address || ""}
          readOnly
          style={addressStyle}
          placeholder="ไม่มีข้อมูลที่อยู่"
        />
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
        ไม่พบ <code>role</code> ใน <code>localStorage</code> (ควรเป็น "admin" หรือ "student")
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
