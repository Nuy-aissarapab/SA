import { useState, useEffect } from "react";

import { Space, Table, Button, Col, Row, Divider, message } from "antd";

import { PlusOutlined, DeleteOutlined, SearchOutlined ,FileSearchOutlined } from "@ant-design/icons";

import type { ColumnsType } from "antd/es/table";

import { GetUsers, DeleteUsersById } from "../../Service/https/index";

import type { UsersInterface } from "../../interfaces/IUser";

import { Link, useNavigate } from "react-router-dom";

import dayjs from "dayjs";

import SizeContext from "antd/es/config-provider/SizeContext";


function Contract() {

  const navigate = useNavigate();

  const [users, setUsers] = useState<UsersInterface[]>([]);

  const [messageApi, contextHolder] = message.useMessage();

  const myId = localStorage.getItem("id");


  const columns: ColumnsType<UsersInterface> = [

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

      title: "Contract ID",

      dataIndex: "contract_id",

      key: "contract_id",

    },

    {

      title: "รหัสนักศึกษา",

      dataIndex: "student_id",

      key: "student_id",

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

      title: "วันที่เริ่มสัญญา",

      dataIndex: "start_date",

      key: "start_date",

    },

    {

      title: "วันที่สิ้นสุดสัญญา",

      dataIndex: "end_date",

      key: "end_date",

    },

    {
      title: "ค่าห้อง",

      dataIndex: "rental_price",
    
      key: "rental_price",
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

  // 
  const deleteUserById = async (id: string) => {

    let res = await DeleteUsersById(id);


    if (res.status == 200) {

      messageApi.open({

        type: "success",

        content: res.data.message,

      });

      await getUsers();

    } else {

      messageApi.open({

        type: "error",

        content: res.data.error,

      });

    }

  };

  // 
  const getUsers = async () => {

    let res = await GetUsers();

   

    if (res.status == 200) {

      setUsers(res.data);

    } else {

      setUsers([]);

      messageApi.open({

        type: "error",

        content: res.data.error,

      });

    }

  };


  useEffect(() => {

    getUsers();

  }, []);




  return (

    <>

      {contextHolder}

      <Row>
          
        <Col  span={12}>
        <h2 style={{fontSize: '27px'}}>
          {/* <FileSearchOutlined /> */}
          ตรวจสอบสัญญาเช่า</h2>
        </Col>


        <Col span={12} style={{ textAlign: "end", alignSelf: "center" }}>

          <Space>

            <Link to="/customer/create">

            <Button 

              style={{ backgroundColor: '#253543',borderRadius: '20px',color:"#FFFFFF" }}
              
            > ค้นหาสัญญาเช่าด้วยรหัสนักศึกษา

            <FileSearchOutlined />

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

          dataSource={users}

          style={{ width: "100%", overflow: "scroll" }}

        />

      </div>

    </>

  );

}


export default Contract;