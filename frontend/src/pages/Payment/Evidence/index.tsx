// pages/.../Evidence.tsx
import {
  Upload, Button, Form, Input, DatePicker, Row, Col, Modal, Segmented, Space, message,
} from "antd";
import { InboxOutlined, UserOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { UploadEvidence ,GetEvidenceByID ,UpdateEvidence} from "../../../Service/https";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import type { EvidenceInterface } from "../../../interfaces/Evidence";

const { Dragger } = Upload;

type Method = "bank" | "qr" ;

export default function Evidence() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const [method, setMethod] = useState<Method>("bank");
  const [payerName, setPayerName] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const { id } = useParams<{ id: string }>();        // ✅ ใช้พารามฯ จาก URL
  const navigate = useNavigate();
  const location = useLocation();   

  const [loading, setLoading] = useState(false);
  // const sid = localStorage.getItem("id");
  // localStorage.setItem("current_payment_id","123")
  
  const getPaymentId = () => {
    const qs = new URLSearchParams(location.search);
    const qid = qs.get("paymentId");
    const sid = localStorage.getItem("id");
    const n = Number(qid || sid || "");
    return Number.isNaN(n) ? undefined : n;
  };

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  useEffect(() => {
    // กันเคส refresh แล้วยังจำ paymentId ได้
    const qs = new URLSearchParams(location.search);
    const qid = qs.get("paymentId");
    if (qid) localStorage.setItem("current_payment_id", qid);
    return () => clearPreview();
  }, [location.search]);

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    beforeUpload: (file) => {
      const okType = ["image/jpeg", "image/png", "application/pdf"].includes(file.type);
      if (!okType) {
        Modal.error({ title: "ไฟล์ไม่ถูกต้อง", content: "รองรับเฉพาะ JPG, PNG, PDF เท่านั้น" });
        return Upload.LIST_IGNORE;
      }
      if (file.size / 1024 / 1024 > 5) {
        Modal.error({ title: "ไฟล์ใหญ่เกินไป", content: "ไฟล์ต้องมีขนาดไม่เกิน 5MB" });
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      clearPreview();
      setPreviewUrl(URL.createObjectURL(file));
      setUploadedUrl(null);
      return false; // ไม่อัปโหลดอัตโนมัติ ให้เราจัดการเอง
    },
    onRemove: () => { setFileList([]); clearPreview(); },
    fileList,
  };

  const handleSubmit = async (values: any) => {
    if (submitting) return;

    if (fileList.length === 0) {
      Modal.error({ title: "ไม่พบไฟล์", content: "กรุณาเลือกไฟล์ก่อนส่ง" });
      return;
    }

    const paymentId = getPaymentId();
    if (!paymentId) {
      Modal.error({ title: "ไม่พบรายการชำระ", content: "กรุณากลับไปเลือกรายการหรือส่ง paymentId มาด้วย" });
      return;
    }

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Modal.error({ title: "จำนวนเงินไม่ถูกต้อง", content: "กรุณากรอกจำนวนเงินมากกว่า 0" });
      return;
    }

    try {
      setSubmitting(true);

      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.readAsDataURL(file);
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
        });

      const base64File = await toBase64(fileList[0]);
      const student_id = Number(localStorage.getItem("id")) || 0;

      const payload = {
        file: base64File,
        date: values.transferDate.format("YYYY-MM-DD HH:mm:ss"),
        note: values.note || "",
        payment_id: paymentId,
        student_id,
        method,
        payer_name: payerName,
        amount: amt,
      };

      const res = await UploadEvidence(payload);
      console.log("Upload /upload ->", res?.status, res?.data);

      if (res?.status === 200) {
        const fileURL = res?.data?.file_url as string | undefined;
        Modal.success({
          title: "สำเร็จ",
          content: <>✅ ส่งหลักฐานการโอนเรียบร้อยแล้ว{fileURL && <> — <a href={fileURL} target="_blank">เปิดไฟล์</a></>}</>,
        });
        if (fileURL) setUploadedUrl(fileURL);

        form.resetFields();
        setFileList([]); clearPreview();
        navigate("/Payment/Evidence/EvidenceSuccess", { replace: true });
      } else if (res?.status === 401) {
        Modal.error({ title: "ไม่ได้รับอนุญาต", content: "กรุณาเข้าสู่ระบบใหม่ แล้วลองอีกครั้ง" });
      } else {
        Modal.error({
          title: "ไม่สำเร็จ",
          content: `❌ ส่งหลักฐานไม่สำเร็จ (code ${res?.status ?? "-"})`,
        });
      }
    } catch (e: any) {
      console.error("handleSubmit error:", e);
      Modal.error({ title: "เกิดข้อผิดพลาด", content: `🚨 ${e?.message ?? "ไม่ทราบสาเหตุ"}` });
      form.resetFields();
      setFileList([]); clearPreview();
      navigate("/Payment/Evidence/EvidenceFail", { replace: true });
    } finally {
      setSubmitting(false);
    }
  };






  useEffect(() => {
    if (!id) return;
    GetEvidenceByID(Number(id)).then((res) => {
      if (res?.status === 200) {
        const ev = res.data;
        form.setFieldsValue({
          note: ev.note,
          transferDate: ev.date ? dayjs(ev.date, "YYYY-MM-DD HH:mm:ss") : null,  // ✅ map เป็น dayjs
        });
      } 
    });
  }, [id]);

  const getBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.readAsDataURL(file);
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
    });

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      let fileBase64 = "";
      if (fileList[0]?.originFileObj) {
        fileBase64 = await getBase64(fileList[0].originFileObj as File);
      }

      const payload = {
        note: values.note || "",
        date: values.date ? values.date.format("YYYY-MM-DD HH:mm:ss") : "",
        file: fileBase64 || undefined, // ไม่ส่ง = ไม่เปลี่ยนไฟล์
      };

      const res = await UpdateEvidence(Number(id), payload);
      if (res?.status === 200) {
        message.success("อัปเดต Evidence สำเร็จ");
        navigate("/admin/evidences"); // ปรับ path ให้ตรงกับของคุณ
      } else {
        Modal.error({ title: "อัปเดนไม่สำเร็จ", content: res?.data?.error ?? "Unknown error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const isImage = (m?: string | null) => !!m && (m.includes("image/") || /\.(png|jpe?g|gif|webp)$/i.test(m));
  const isPDF   = (m?: string | null) => !!m && (m.includes("application/pdf") || /\.pdf$/i.test(m));

  return (
    <Row justify="center">
      <Col xs={24} sm={20} md={16} lg={12}>
        <div style={{ background:"#fff", borderRadius:10, padding:24, boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize:27, display:"flex", justifyContent:"center" }}>แนบหลักฐานการโอน</h2>

          {/* ช่องทาง + ผู้ชำระ + จำนวนเงิน */}
          <Space style={{ marginBottom: 16 }} wrap>
            <div>
              <div style={{ fontWeight:600, marginBottom:6 }}>ช่องทาง</div>
              <Segmented
                value={method}
                onChange={(v) => setMethod(v as Method)}
                options={[
                  { label: "โอนผ่านธนาคาร", value: "bank" },
                  { label: "QR พร้อมเพย์", value: "qr" },
                ]}
              />
            </div>

            <div>
              <div style={{ fontWeight:600, marginBottom:6 }}>ผู้ชำระ</div>
              <Input
                placeholder="ชื่อผู้ชำระ"
                style={{ width: 220 }}
                prefix={<UserOutlined />}
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                allowClear
              />
            </div>

            <div>
              <div style={{ fontWeight:600, marginBottom:6 }}>จำนวนเงิน (บาท)</div>
              <Input
                placeholder="เช่น 1500"
                style={{ width: 160 }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
              />
            </div>
          </Space>

          <Dragger {...uploadProps} accept=".jpg,.jpeg,.png,.pdf">
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
            <p className="ant-upload-hint">รองรับไฟล์: JPG, PNG, PDF (ขนาดไม่เกิน 5MB)</p>
          </Dragger>

          {previewUrl && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight:600, marginBottom:8 }}>พรีวิวไฟล์ที่เลือก</div>
              {isImage(fileList[0]?.type || previewUrl)
                ? <img src={previewUrl} style={{ maxWidth:"100%", borderRadius:8, border:"1px solid #eee" }} />
                : isPDF(fileList[0]?.type || previewUrl)
                ? <iframe src={previewUrl} title="preview-pdf" style={{ width:"100%", height:480, border:"1px solid #eee", borderRadius:8 }} />
                : null}
            </div>
          )}

          {uploadedUrl && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight:600, marginBottom:8 }}>ไฟล์ที่อัปโหลดแล้ว</div>
              {isImage(uploadedUrl)
                ? <img src={uploadedUrl} style={{ maxWidth:"100%", borderRadius:8, border:"1px solid #eee" }} />
                : isPDF(uploadedUrl)
                ? <iframe src={uploadedUrl} title="uploaded-pdf" style={{ width:"100%", height:480, border:"1px solid #eee", borderRadius:8 }} />
                : <a href={uploadedUrl} target="_blank" rel="noreferrer">เปิดไฟล์</a>}
            </div>
          )}

          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 20 }}
            onFinish={handleSubmit}
            onFinishFailed={() => Modal.error({ title:"กรอกข้อมูลไม่ครบ", content:"กรุณาเลือกวันที่โอน" })}
            initialValues={{ transferDate: dayjs() }}
          >
            <Form.Item
              name="transferDate"
              label="วันที่และเวลาที่โอน"
              rules={[{ required: true, message: "กรุณาเลือกวันที่โอน" }]}
            >
              <DatePicker showTime format="MM/DD/YYYY HH:mm" style={{ width:"100%" }} />
            </Form.Item>

            <Form.Item name="note" label="หมายเหตุ (ถ้ามี)">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting}>
                ส่งหลักฐานการโอน
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Col>
    </Row>
  );
}
