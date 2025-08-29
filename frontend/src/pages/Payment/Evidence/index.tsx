import { Upload, Button, Form, Input, DatePicker, Row, Col, Modal } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

import { UploadEvidence } from "../../../Service/https/index";
import { useNavigate } from "react-router-dom";
const { Dragger } = Upload;
const { TextArea } = Input;

const Evidence = () => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const navigate = useNavigate(); // 👈 สำหรับเปลี่ยนหน้า
  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    beforeUpload: (file) => {
      const isAllowed =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "application/pdf";
      if (!isAllowed) {
        Modal.error({
          title: "ไฟล์ไม่ถูกต้อง",
          content: "รองรับเฉพาะ JPG, PNG, PDF เท่านั้น",
        });
        return Upload.LIST_IGNORE;
      }
      if (file.size / 1024 / 1024 > 5) {
        Modal.error({
          title: "ไฟล์ใหญ่เกินไป",
          content: "ไฟล์ต้องมีขนาดไม่เกิน 5MB",
        });
        return Upload.LIST_IGNORE;
      }
      setFileList([file]); // เก็บไฟล์ลง state
      return false; // ไม่อัปโหลดทันที ให้ไปอัปโหลดตอน submit
    },
    onRemove: () => {
      setFileList([]);
    },
    fileList,
  };

  const handleSubmit = async (values: any) => {
    if (fileList.length === 0) {
      Modal.error({
        title: "ไม่พบไฟล์",
        content: "กรุณาเลือกไฟล์ก่อนส่ง",
      });
      return;
    }

    const file = fileList[0];

    const toBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

    try {
      const base64File = await toBase64(file);

      const payload = {
        file: base64File,
        date: values.transferDate.format("YYYY-MM-DD HH:mm:ss"),
        note: values.note || "",
        payment_id: Number(1),   // TODO: เปลี่ยนเป็นค่า payment จริง
        student_id: Number(123), // TODO: เปลี่ยนเป็น student id ของ user ที่ล็อกอิน
      };

      const res = await UploadEvidence(payload);
      console.log("Upload response ===>", res);

      if (res.status === 200) {
        Modal.success({
          title: "สำเร็จ",
          content: "✅ ส่งหลักฐานการโอนเรียบร้อยแล้ว",
        });
        form.resetFields();
        setFileList([]);
        navigate("/Payment/Evidence/EvidenceSuccess", { replace: true });
        return;
      } else {
        Modal.error({
          title: "ไม่สำเร็จ",
          content: `❌ ส่งหลักฐานไม่สำเร็จ (code ${res.status})`,
        });
      }

    } catch (error: any) {
      Modal.error({
        title: "เกิดข้อผิดพลาด",
        content: `🚨 ${error.message}`,
      });
      form.resetFields();
        setFileList([]);
        navigate("/Payment/evidence/EvidenceFail", { replace: true });
        return;
    }
  };

  return (
    <Row justify="center">
      <Col xs={24} sm={20} md={16} lg={12}>
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "27px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            แนบหลักฐานการโอน
          </h2>

          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
            </p>
            <p className="ant-upload-hint">
              รองรับไฟล์: JPG, PNG, PDF (ขนาดไม่เกิน 5MB)
            </p>
          </Dragger>

          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: "20px" }}
            onFinish={handleSubmit}
            initialValues={{
              transferDate: dayjs(),
            }}
          >
            <Form.Item
              name="transferDate"
              label="วันที่และเวลาที่โอน"
              rules={[{ required: true, message: "กรุณาเลือกวันที่โอน" }]}
            >
              <DatePicker
                showTime
                format="MM/DD/YYYY HH:mm"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item name="note" label="หมายเหตุ (ถ้ามี)">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                ส่งหลักฐานการโอน
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Col>
    </Row>
  );
};

export default Evidence;
