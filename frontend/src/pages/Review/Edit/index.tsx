import { useEffect, useState } from "react";
import { Button, Form, Input, Select, Rate, Card, Row, Col, Space, message } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GetReviewById, GetReviewTopics, UpdateReview } from "../../../Service/https";
import type { ReviewTopicInterface } from "../../../interfaces/ReviewTopic";

export default function ReviewEdit() {
  const { id } = useParams(); // review id
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<ReviewTopicInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!id) {
          messageApi.error("ไม่พบรหัสรีวิว");
          navigate("/Review", { replace: true });
          return;
        }
  
        const [r, t] = await Promise.all([GetReviewById(id), GetReviewTopics()]);
        if (!alive) return;
  
        if (r?.status === 200) {
          const ownerId =
            r.data?.StudentID ??
            r.data?.student_id ??
            r.data?.Student?.ID ??
            r.data?.student?.id;
  
          const myId = localStorage.getItem("id");
          const role = localStorage.getItem("role");
  
          if (role === "student" && String(ownerId) !== String(myId)) {
            messageApi.error("คุณไม่มีสิทธิ์แก้ไขรีวิวนี้");
            navigate("/Review", { replace: true });
            return;
          }
  
          form.setFieldsValue({
            topicId: Number(r.data?.ReviewTopicID ?? r.data?.review_topic_id),
            title: r.data?.Title ?? r.data?.title,
            comment: r.data?.Comment ?? r.data?.comment,
            rating: r.data?.Rating ?? r.data?.rating,
          });
        } else if (r?.status === 401) {
          messageApi.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
          navigate("/Login", { replace: true });
          return;
        } else {
          messageApi.error(r?.data?.error || "โหลดรีวิวไม่สำเร็จ");
        }
  
        if (t?.status === 200) setTopics(t.data);
      } catch (e: any) {
        messageApi.error(e?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    })();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  

  const onFinish = async (values: any) => {
    const payload = {
      title: values.title,
      comment: values.comment,
      rating: values.rating,
      review_topic_id: Number(values.topicId), // 🔒 ให้เป็น number ชัดเจน
    };
  
    const res = await UpdateReview(id!, payload);
    
    if (res?.status === 200) {
      messageApi.success("แก้ไขรีวิวสำเร็จ");
      navigate("/Review");
    } else if (res?.status === 401) {
      messageApi.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      navigate("/Login", { replace: true });
    } else if (res?.status === 403) {
      messageApi.error("อนุญาตเฉพาะเจ้าของรีวิวเท่านั้นที่จะแก้ไขได้");
    } else {
      messageApi.error(res?.data?.error || "แก้ไขไม่สำเร็จ");
    }
  };
  

  return (
    <Card>
      {contextHolder}
      <h2>แก้ไขรีวิว</h2>
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Row gutter={[16,16]}>
          
          <Col xs={24} sm={12}>
            <Form.Item name="title" label="หัวข้อรีวิว" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="topicId" label="ประเภทการรีวิว" rules={[{ required: true }]}>
              <Select
                    placeholder="กรุณาเลือกประเภท"
                    options={topics.map((t) => ({
                    value: t.ID!,
                    label: t.TopicName ?? t.topic_name!,
                 }))}
                showSearch
                optionFilterProp="label"
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
              <Button type="primary" htmlType="submit">บันทึก</Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
