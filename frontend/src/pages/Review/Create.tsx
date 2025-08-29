import { useEffect, useState } from "react";
import { Button, Form, Input, Select, Rate, Card, Row, Col, Space, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { CreateReview, GetReviewTopics } from "../../Service/https";
import type { ReviewInterface } from "../../interfaces/Review";
import type { ReviewTopicInterface } from "../../interfaces/ReviewTopic";

export default function ReviewCreate() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<ReviewTopicInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    (async () => {
      const res = await GetReviewTopics();
      if (res?.status === 200) setTopics(res.data);
      else messageApi.error("โหลดประเภทรีวิวไม่สำเร็จ");
    })();
  }, []);
  //ดึงชื่อประเภทรีวิวจาก backend มาแสดงใน select
  const topicOptions = topics.map((t) => ({
  value: t.ID!,                          // <-- ใช้ ID เป็นค่าที่ส่ง
  label: t.TopicName ?? t.topic_name!,   // <-- รองรับทั้ง Camel/Snake
  }));

  const onFinish = async (values: any) => {
  const contractId = localStorage.getItem("contractId");
  const payload = {
    title: values.title,
    comment: values.comment,
    rating: values.rating,
    review_topic_id: values.topicId,            // ✅ snake_case
    contract_id: contractId ? parseInt(contractId) : undefined,
  };
  const res = await CreateReview(payload as any);
    if (res?.status === 201) {
      messageApi.success("บันทึกรีวิวสำเร็จ");
      navigate("/Review");
    } else {
      messageApi.error(res?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <Card>
      {contextHolder}
      <h2>เขียนรีวิวใหม่</h2>
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item name="title" label="หัวข้อรีวิว" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="topicId" label="ประเภทการรีวิว" rules={[{ required: true }]}>
              <Select
                placeholder="กรุณาเลือกประเภท"
                options={topicOptions}
                showSearch
                optionFilterProp="label" // ค้นหาด้วยชื่อ
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="rating" label="คะแนน" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="comment" label="ความคิดเห็น">
              <Input.TextArea rows={4} />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Col>
            <Space>
              <Link to="/Review"><Button>ยกเลิก</Button></Link>
              <Button type="primary" htmlType="submit">ยืนยัน</Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
