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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // ✅ preview ก่อนส่ง
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null); // ✅ URL หลังอัปโหลด
  const navigate = useNavigate();

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

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
      // ✅ เก็บไฟล์ลง state และทำ preview ทันที
      setFileList([file]);
      clearPreview();
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUploadedUrl(null); // เคลียร์ URL ที่อัปโหลดแล้ว (ถ้ามี)
      return false; // ไม่อัปโหลดทันที ให้ไปอัปโหลดตอน submit
    },
    onRemove: () => {
      setFileList([]);
      clearPreview();
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
        payment_id: Number(1),   // TODO: ใช้ payment จริง
        student_id: Number(123), // TODO: ใช้ student id จริง
      };

      const res = await UploadEvidence(payload);
      console.log("Upload response ===>", res);

      if (res?.status === 200) {
        const fileURL = res?.data?.file_url as string | undefined;

        Modal.success({
          title: "สำเร็จ",
          content: (
            <div>
              ✅ ส่งหลักฐานการโอนเรียบร้อยแล้ว
              {fileURL ? (
                <div style={{ marginTop: 12 }}>
                  <a href={fileURL} target="_blank" rel="noreferrer">
                    เปิดไฟล์ที่อัปโหลด
                  </a>
                </div>
              ) : null}
            </div>
          ),
        });

        // ✅ เก็บ URL จากเซิร์ฟเวอร์ไว้โชว์ในหน้าเดิม
        if (fileURL) setUploadedUrl(fileURL);

        form.resetFields();
        setFileList([]);
        clearPreview();

        // ถ้าอยากเด้งหน้า success เหมือนเดิมก็ใช้ได้
        navigate("/Payment/Evidence/EvidenceSuccess", { replace: true });
        return;
      } else {
        Modal.error({
          title: "ไม่สำเร็จ",
          content: `❌ ส่งหลักฐานไม่สำเร็จ (code ${res?.status})`,
        });
      }
    } catch (error: any) {
      Modal.error({
        title: "เกิดข้อผิดพลาด",
        content: `🚨 ${error.message}`,
      });
      form.resetFields();
      setFileList([]);
      clearPreview();
      navigate("/Payment/evidence/EvidenceFail", { replace: true });
      return;
    }
  };

  // helper ตรวจชนิดเป็นรูปหรือ pdf
  const isImage = (mimeOrUrl?: string | null) => {
    if (!mimeOrUrl) return false;
    return mimeOrUrl.includes("image/") || /\.(png|jpe?g|gif|webp)$/i.test(mimeOrUrl);
  };
  const isPDF = (mimeOrUrl?: string | null) => {
    if (!mimeOrUrl) return false;
    return mimeOrUrl.includes("application/pdf") || /\.pdf$/i.test(mimeOrUrl);
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

          {/* ✅ พรีวิว "ก่อนส่ง" จาก object URL */}
          {previewUrl && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>พรีวิวไฟล์ที่เลือก</div>
              {isImage(fileList[0]?.type || previewUrl) ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #eee" }}
                />
              ) : isPDF(fileList[0]?.type || previewUrl) ? (
                <iframe
                  src={previewUrl}
                  title="preview-pdf"
                  style={{ width: "100%", height: 480, border: "1px solid #eee", borderRadius: 8 }}
                />
              ) : null}
            </div>
          )}

          {/* ✅ พรีวิว "หลังส่ง" จาก URL ที่เซิร์ฟเวอร์ */}
          {uploadedUrl && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>ไฟล์ที่อัปโหลดแล้ว</div>
              {isImage(uploadedUrl) ? (
                <img
                  src={uploadedUrl}
                  alt="uploaded"
                  style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #eee" }}
                />
              ) : isPDF(uploadedUrl) ? (
                <iframe
                  src={uploadedUrl}
                  title="uploaded-pdf"
                  style={{ width: "100%", height: 480, border: "1px solid #eee", borderRadius: 8 }}
                />
              ) : (
                <a href={uploadedUrl} target="_blank" rel="noreferrer">
                  เปิดไฟล์
                </a>
              )}
            </div>
          )}

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
              <DatePicker showTime format="MM/DD/YYYY HH:mm" style={{ width: "100%" }} />
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
