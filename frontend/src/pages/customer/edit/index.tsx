import { useState, useEffect } from "react";

import {

  Space,

  Button,

  Col,

  Row,

  Divider,

  Form,

  Input,

  Card,

  message,

  DatePicker,

  InputNumber,

  Select,

} from "antd";

import { PlusOutlined } from "@ant-design/icons";

import type { UsersInterface } from "../../../interfaces/IUser";

import type { GenderInterface } from "../../../interfaces/Gender";

import { GetGender, GetUsersById, UpdateUsersById } from "../../../Service/https/index";

import { useNavigate, Link, useParams } from "react-router-dom";

import dayjs from "dayjs";


function CustomerEdit() {

  const navigate = useNavigate();

  const { id } = useParams<{ id: any }>();

  const [messageApi, contextHolder] = message.useMessage();

  const [gender, setGender] = useState<GenderInterface[]>([]);

  const [form] = Form.useForm();


 const onGetGender = async () => {

    let res = await GetGender();

    if (res.status == 200) {

      setGender(res.data);

    } else {

      messageApi.open({

        type: "error",

        content: "ไม่พบข้อมูลเพศ",

      });

      setTimeout(() => {

        navigate("/customer");

      }, 2000);

    }

  };


  const getUserById = async (id: string) => {

    let res = await GetUsersById(id);

    if (res.status == 200) {

      form.setFieldsValue({

        first_name: res.data.first_name,

        last_name: res.data.last_name,

        email: res.data.email,

        birthday: dayjs(res.data.birthday),

        address: res.data.address,

        age: res.data.age,

        gender_id: res.data.gender?.ID,

      });

    } else {

      messageApi.open({

        type: "error",

        content: "ไม่พบข้อมูลผู้ใช้",

      });

      setTimeout(() => {

        navigate("/customer");

      }, 2000);

    }

  };


  const onFinish = async (values: UsersInterface) => {

    let payload = {

      ...values,

    };


    const res = await UpdateUsersById(id, payload);

    if (res.status == 200) {

      messageApi.open({

        type: "success",

        content: res.data.message,

      });

      setTimeout(() => {

        navigate("/customer");

      }, 2000);

    } else {

      messageApi.open({

        type: "error",

        content: res.data.error,

      });

    }

  };


  useEffect(() => {

    onGetGender();

    getUserById(id);

  }, []);


  return (

    <div>

      {contextHolder}

      <Card>

        <h2>แก้ไขข้อมูล ผู้ดูแลระบบ</h2>

        <Divider />


        <Form

          name="basic"

          form={form}

          layout="vertical"

          onFinish={onFinish}

          autoComplete="off"

        >

          <Row gutter={[16, 0]}>

            <Col xs={24} sm={24} md={24} lg={24} xl={12}>

              <Form.Item

                label="ชื่อจริง"

                name="first_name"

                rules={[

                  {

                    required: true,

                    message: "กรุณากรอกชื่อ !",

                  },

                ]}

              >

                <Input />

              </Form.Item>

            </Col>


            <Col xs={24} sm={24} md={24} lg={24} xl={12}>

              <Form.Item

                label="นามกสุล"

                name="last_name"

                rules={[

                  {

                    required: true,

                    message: "กรุณากรอกนามสกุล !",

                  },

                ]}

              >

                <Input />

              </Form.Item>

            </Col>


            <Col xs={24} sm={24} md={24} lg={24} xl={12}>

              <Form.Item

                label="อีเมล"

                name="email"

                rules={[

                  {

                    type: "email",

                    message: "รูปแบบอีเมลไม่ถูกต้อง !",

                  },

                  {

                    required: true,

                    message: "กรุณากรอกอีเมล !",

                  },

                ]}

              >

                <Input />

              </Form.Item>

            </Col>


            <Col xs={24} sm={24} md={24} lg={24} xl={12}>

              <Form.Item

                label="วัน/เดือน/ปี เกิด"

                name="birthday"

                rules={[

                  {

                    required: true,

                    message: "กรุณาเลือกวัน/เดือน/ปี เกิด !",

                  },

                ]}

              >

                <DatePicker style={{ width: "100%" }} />

              </Form.Item>

            </Col>

            <Col xs={24} sm={24} md={24} lg={24} xl={12}>

              <Form.Item

                label="อายุ"

                name="age"

                rules={[

                  {

                    required: true,

                    message: "กรุณากรอกอายุ !",

                  },

                ]}

              >

                <InputNumber

                  min={0}

                  max={99}

                  defaultValue={0}

                  style={{ width: "100%" }}

                />

              </Form.Item>

            </Col>

              <Col xs={24} sm={24} md={24} lg={24} xl={12}>

              <Form.Item

                label="ที่อยู่"

                name="address"

                rules={[

                  {

                    required: true,

                    message: "กรุณากรอกที่อยู่ !",

                  },

                ]}

              >

                <Input

                  style={{ width: "100%" }}

                />

              </Form.Item>

            </Col>

            <Col xs={24} sm={24} md={24} lg={24} xl={12}>

              <Form.Item

                label="เพศ"

                name="gender_id"

                rules={[

                  {

                    required: true,

                    message: "กรุณาเลือกเพศ !",

                  },

                ]}

              >

                <Select defaultValue="" style={{ width: "100%" }}>

                  {gender?.map((item) => (

                    <Select.Option value={item?.ID}>

                      {item?.gender}

                    </Select.Option>

                  ))}

                </Select>

              </Form.Item>

            </Col>

          </Row>


          <Row justify="end">

            <Col style={{ marginTop: "40px" }}>

              <Form.Item>

                <Space>

                  <Link to="/customer">

                    <Button htmlType="button" style={{ marginRight: "10px" }}>

                      ยกเลิก

                    </Button>

                  </Link>


                  <Button

                    type="primary"

                    htmlType="submit"

                    icon={<PlusOutlined />}

                  >

                    บันทึก

                  </Button>

                </Space>

              </Form.Item>

            </Col>

          </Row>

        </Form>

      </Card>

    </div>

  );

}

export default CustomerEdit;