import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Tag, Row, Col, Image, Divider, Spin, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { GetRoomById } from "../../Service/https/index";
import type { Room } from "../../interfaces/Room";

function RoomDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      try {
        if (!id) {
          messageApi.error("ไม่พบ ID ห้อง");
          setLoading(false);
          return;
        }

        const roomId = Number(id);
        const res = await GetRoomById(roomId);

        if (res.status === 200 && res.data) {
          setRoom(res.data);
        } else {
          messageApi.error("ไม่พบข้อมูลห้องหรือเกิดข้อผิดพลาด");
          setRoom(null);
        }
      } catch (error) {
        console.error("Fetch room error:", error);
        messageApi.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ padding: 24 }}>
        {contextHolder}
        <p>ไม่พบข้อมูลห้อง {id}</p>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          ย้อนกลับ
        </Button>
      </div>
    );
  }

  const renderStatus = (status: Room["room_status"]) => (
    <Tag
      color={status === "ว่าง" || status.toLowerCase() === "available" ? "green" : "red"}
      style={{ fontWeight: 600, fontSize: 14 }}
    >
      {status}
    </Tag>
  );

  // URL รูปภาพ
  const backendUrl = "http://localhost:8000"; // เปลี่ยนเป็น backend จริง
  const imageUrl = room.image ? `${backendUrl}/images/${room.image}` : "/images/default-room.png";

  // สิ่งอำนวยความสะดวกและเฟอร์นิเจอร์
  const facilities =
    room.RoomAsset?.filter(a => a.AssetType?.Type === "facility").map(f => f.AssetType?.Name) || [];
  const furniture =
    room.RoomAsset?.filter(a => a.AssetType?.Type === "furniture").map(f => f.AssetType?.Name) || [];

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        ย้อนกลับ
      </Button>

      <Card title={`รายละเอียดห้องพัก หมายเลข ${room.room_number}`}>
        <Row gutter={24}>
          <Col span={10}>
            <Image.PreviewGroup>
              <Image
                src={imageUrl}
                alt={`Room ${room.room_number}`}
                width={300}
                height={200}
                style={{ borderRadius: 10, objectFit: "cover" }}
                fallback="/images/default-room.png"
              />
            </Image.PreviewGroup>
          </Col>

          <Col span={14}>
            <p><b>ประเภท:</b> {room.RoomType?.RoomTypeName || "-"}</p>
            <p><b>สถานะ:</b> {renderStatus(room.room_status)}</p>
            <p>
              <b>ราคา:</b>{" "}
              {room.RoomType?.RentalPrice
                ? `${room.RoomType.RentalPrice.toLocaleString()} บาท / เดือน`
                : "-"}
            </p>
            <p>
              <b>แก้ไขล่าสุด:</b>{" "}
              {room.UpdatedAt ? dayjs(room.UpdatedAt).format("DD/MM/YYYY") : "-"}
            </p>
            <p>
              <b>ผู้ดูแล:</b> {room.Admin ? `${room.Admin.first_name} ${room.Admin.last_name}` : "-"}
            </p>
          </Col>
        </Row>

        <Divider />
        <h3>สิ่งอำนวยความสะดวก</h3>
        <Row gutter={[8, 8]}>
          {facilities.length > 0
            ? facilities.map((f, idx) => (
                <Col key={idx}>
                  <Tag color="blue">{f}</Tag>
                </Col>
              ))
            : <Col>ไม่มีข้อมูลสิ่งอำนวยความสะดวก</Col>}
        </Row>

        <Divider />
        <h3>เฟอร์นิเจอร์ในห้อง</h3>
        <Row gutter={[8, 8]}>
          {furniture.length > 0
            ? furniture.map((f, idx) => (
                <Col key={idx}>
                  <Tag color="purple">{f}</Tag>
                </Col>
              ))
            : <Col>ไม่มีข้อมูลเฟอร์นิเจอร์</Col>}
        </Row>
      </Card>
    </div>
  );
}

export default RoomDetails;
