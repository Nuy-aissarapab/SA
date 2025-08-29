import { useState, useEffect } from "react";
import { Space, Table, Button, Col, Row, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { GetUsers, DeleteUsersById ,GetStudents} from "../../Service/https/index";
import { type StudentInterface } from "../../interfaces/Student";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

function Student() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const myId = localStorage.getItem("id");
  const columns: ColumnsType<StudentInterface> = [
    {
      title: "",
      render: (record) => (
        <>
          {myId == record?.ID ? (
            <></>
          ) : (
            <Button
              type="dashed"
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteUserById(record.ID)}
            ></Button>
          )}
        </>
      ),
    },
    {
      title: "ลำดับ",
      dataIndex: "Student_ID",
      key: "Student_ID",
    },
    {
      title: "ชื่อ",
      dataIndex: "first_name",
      key: "first_name",
    },
    {
      title: "นามสกุุล",
      dataIndex: "last_name",
      key: "last_name",
    },
    {
      title: "อีเมล",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "วัน/เดือน/ปี เกิด",
      key: "birthday",
      render: (record) => <>{dayjs(record.birthday).format("DD/MM/YYYY")}</>,
    },
    {
      title: "",
      render: (record) => (
        <>
          <Button
            type="primary"
            icon={<DeleteOutlined />}
            onClick={() => navigate(`/customer/edit/${record.ID}`)}
          >
            แก้ไขข้อมูล
          </Button>
        </>
      ),
    },
  ];

  const deleteUserById = async (id: string) => {
    let res = await DeleteUsersById(id);
    
    if (res.status == 200) {
      messageApi.open({
        type: "success",
        content: res.data.message,
      });
      await GetStudents();
    } else {
      messageApi.open({
        type: "error",
        content: res.data.error,
      });
    }
  };

  const getStudents = async () => {
    let res = await GetStudents();
      // console.log("sss",res)
    if (res.status == 200) {
      setStudent(res.data);
    } else {
      setStudent([]);
      messageApi.open({
        type: "error",
        content: res.data.error,
      });
    }
  };

  //ทำงานตลอดเวลา
  useEffect(() => {
    getStudents();
  }, []);

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
          style={{ width: "100%", overflow: "scroll" }}
        />
      </div>
    </>
  );
}

export default Student;