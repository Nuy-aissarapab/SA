import { useEffect, useState } from "react";
import { Button, Card, Col, Form, Input, Row, Select, Upload, Image, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GetMaintenanceById, GetProblemTypes, UpdateMaintenance } from "../../../Service/https";
import type { ProblemTypeInterface } from "../../../interfaces/ProblemType";
const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000";

export default function MaintenanceEdit() {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [types, setTypes] = useState<ProblemTypeInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const myId = localStorage.getItem("id") ?? "";

  const [preview, setPreview] = useState<string>();
  const [imgB64, setImgB64] = useState<string>("");
  const [imgName, setImgName] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!id) { messageApi.error("ไม่พบรหัส"); navigate("/Maintenance",{replace:true}); return; }
      const [r, t] = await Promise.all([GetMaintenanceById(Number(id)), GetProblemTypes()]);
      if (t?.status === 200) setTypes(t.data);

      if (r?.status === 200) {
        const d = r.data;
        const ownerId = d?.StudentID ?? d?.student_id ?? d?.Student?.ID ?? d?.student?.id;
        const statusName = d?.MaintenanceStatus?.StatusName ?? d?.maintenance_status?.status_name;

        if (role === "student") {
          if (String(ownerId) !== String(myId)) {
            messageApi.error("คุณไม่มีสิทธิ์แก้ไขรายการนี้");
            navigate("/Maintenance", { replace: true }); return;
          }
          if (statusName !== "แจ้งซ่อม") {
            messageApi.error("แก้ไขไม่ได้หลังเจ้าหน้าที่อัปเดตสถานะแล้ว");
            navigate("/Maintenance", { replace: true }); return;
          }
        }

        form.setFieldsValue({
          title: d?.Title ?? d?.title,
          detail: d?.Detail ?? d?.detail,
          problem_type_id: Number(d?.ProblemTypeID ?? d?.problem_type_id),
        });

        // พรีวิวรูปเดิม
        const url = d?.ImageURL ?? d?.image_url;
        if (url) setPreview(`${API_URL}${url}`);
      } else {
        messageApi.error(r?.data?.error || "โหลดข้อมูลไม่สำเร็จ");
        navigate("/Maintenance", {replace:true});
      }
    })();
  }, [id]);

  const onFinish = async (v:any) => {
    const body: any = {
      title: v.title,
      detail: v.detail,
      room_no: v.room_no,
      problem_type_id: Number(v.problem_type_id),
    };
    if (imgB64) { body.image_base64 = imgB64; body.image_name = imgName || "image"; }

    const res = await UpdateMaintenance(Number(id), body);
    if (res?.status === 200) { messageApi.success("แก้ไขสำเร็จ"); navigate("/Maintenance"); }
    else messageApi.error(res?.data?.error || "แก้ไขไม่สำเร็จ");
  };

  return (
    <Card>
      {contextHolder}
      <h2>แก้ไขแจ้งซ่อม</h2>
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
            <Form.Item name="detail" label="รายละเอียด"><Input.TextArea rows={4} /></Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="เปลี่ยนรูป (ถ้าต้องการ)">
              <Upload
                listType="picture-card"
                beforeUpload={(file) => {
                  setImgName(file.name);
                  const reader = new FileReader();
                  reader.onload = e => {
                    const result = String(e.target?.result || "");
                    setPreview(result);
                    setImgB64(result);
                  };
                  reader.readAsDataURL(file);
                  return false;
                }}
                onRemove={() => { setImgB64(""); setImgName(""); }}
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
