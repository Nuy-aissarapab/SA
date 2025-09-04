import { useEffect, useState } from "react";
import { Button, Card, Col, Form, Image, Input, Row, Select, Upload, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { CreateMaintenance, GetProblemTypes } from "../../Service/https";
import type { ProblemTypeInterface } from "../../interfaces/ProblemType";

export default function MaintenanceCreate() {
  const [form] = Form.useForm();
  const [types, setTypes] = useState<ProblemTypeInterface[]>([]);
  const [preview, setPreview] = useState<string>();
  const [imgB64, setImgB64] = useState<string>("");
  const [imgName, setImgName] = useState<string>("");
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role !== "student") messageApi.error("อนุญาตเฉพาะนักศึกษาที่จะแจ้งซ่อมได้");
    (async () => {
      const r = await GetProblemTypes();
      if (r?.status === 200) setTypes(r.data);
      else messageApi.error("โหลดประเภทปัญหาไม่สำเร็จ");
    })();
  }, []);

  const onFinish = async (v:any) => {
    if (role !== "student") { messageApi.error("only student can create maintenance"); return; }

    const payload = {
      title: v.title,
      detail: v.detail || "",
      problem_type_id: Number(v.problem_type_id),
      image_base64: imgB64 || "",
      image_name: imgName || "",
    };

    const res = await CreateMaintenance(payload);
    if (res?.status === 201) { messageApi.success("บันทึกสำเร็จ"); navigate("/Maintenance"); }
    else messageApi.error(res?.data?.error || "เกิดข้อผิดพลาด");
  };

  return (
    <Card>
      {contextHolder}
      <h2>แจ้งซ่อมใหม่</h2>
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Row gutter={[16,16]}>
          <Col xs={24} sm={12}>
            <Form.Item name="title" label="หัวข้อ" rules={[{required:true}]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="problem_type_id" label="ประเภทปัญหา" rules={[{required:true}]}>
              <Select
                placeholder="เลือกประเภทปัญหา"
                options={types.map(t=>({ value: t.ID!, label: t.TypeName ?? t.type_name! }))}
                showSearch optionFilterProp="label"
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="detail" label="รายละเอียด">
              <Input.TextArea rows={4} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="รูปภาพ (ไม่บังคับ)">
              <Upload
                listType="picture-card"
                beforeUpload={(file) => {
                  setImgName(file.name);
                  const reader = new FileReader();
                  reader.onload = e => {
                    const result = String(e.target?.result || "");
                    setPreview(result);
                    setImgB64(result); // dataURL ทั้งเส้น ส่งได้เลย
                  };
                  reader.readAsDataURL(file);
                  return false; // ไม่อัปโหลดอัตโนมัติ
                }}
                onRemove={() => { setPreview(undefined); setImgB64(""); setImgName(""); }}
                maxCount={1}
              >
                <div><PlusOutlined /><div style={{marginTop:8}}>อัปโหลด</div></div>
              </Upload>
              {preview && <Image src={preview} width={200} />}
            </Form.Item>
          </Col>
        </Row>

        <Row justify="end">
          <Col>
            <Link to="/Maintenance"><Button>ยกเลิก</Button></Link>
            <Button type="primary" htmlType="submit" style={{marginLeft:8}}>บันทึก</Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
