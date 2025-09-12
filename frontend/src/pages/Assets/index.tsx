import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Col,
  Row,
  Divider,
  message,
  Modal,
  Spin,
  Space,
} from "antd";
import { EditOutlined, DeleteOutlined, HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, useParams } from "react-router-dom";
import type { RoomAsset } from "../../interfaces/RoomAsset";
import { GetAllRoomAssets, DeleteRoomAsset } from "../../Service/https/index";

interface RoomAssetData extends RoomAsset {
  key: string;
}

const Asset = () => {
  const { roomNumber } = useParams<{ roomNumber: string }>();
  const [dataSource, setDataSource] = useState<RoomAssetData[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await GetAllRoomAssets();
      const roomAssets: RoomAsset[] = response.data ?? response;

      const formatted: RoomAssetData[] = roomAssets.map(
        (item: RoomAsset, index: number) => ({
          ...item,
          key: (item.Room?.room_number ?? "unknown") + "-" + index,
        })
      );

      const filteredAssets = formatted.filter(
        (item: RoomAssetData) =>
          item.Room?.room_number === roomNumber ||
          item.Room?.RoomNumber === roomNumber
      );


      setDataSource(filteredAssets);
    } catch (error) {
      console.error("Fetch error:", error);
      messageApi.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roomNumber]);

  const deleteAsset = async (id?: number) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await DeleteRoomAsset(id);
      if (res.status === 200) {
        messageApi.success("ลบทรัพย์สินสำเร็จ");
        fetchData();
      } else {
        messageApi.error("ลบไม่สำเร็จ");
      }
    } catch {
      messageApi.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number, assetName: string) => {
    modal.confirm({
      title: "ยืนยันการลบ",
      content: `คุณต้องการลบทรัพย์สิน: ${assetName} หรือไม่?`,
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: () => deleteAsset(id),
    });
  };

  const adminColumns: ColumnsType<RoomAssetData> = [
    {
      title: "ชื่อทรัพย์สิน",
      dataIndex: ["AssetType", "Name"],
      key: "assetName",
      align: "center",
    },
    {
      title: "จำนวน",
      dataIndex: "Quantity",
      key: "quantity",
      align: "center",
    },
    {
      title: "ค่าปรับ (บาท)",
      dataIndex: ["AssetType", "PenaltyFee"],
      key: "penalty",
      align: "center",
    },
    {
      title: "วันที่ตรวจสอบ",
      dataIndex: "CheckDate",
      key: "checkDate",
      align: "center",
    },
    {
      title: "ผู้จอง",
      dataIndex: ["Room", "Student", "FirstName"],
      key: "student",
      render: (_, record) => record.Room?.Student?.first_name || "-",
      align: "center",
    },

    {
      title: "จัดการ",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/Assets/edit/${record.ID}`)}
          >
            แก้ไข
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              confirmDelete(record.ID!, record.AssetType?.Name || "")
            }
          >
            ลบ
          </Button>
        </Space>
      ),
    },
  ];

  return (

    <>

      {contextHolder}
      {modalContextHolder}

      {/* ✅ ปุ่มย้อนกลับ */}
      <Row justify="start" style={{ marginBottom: 16 }}>
        <Col>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/Assets/assetroom")}
            style={{
              border: "1px solid #8c8c8c",
              color: "#595959",
              borderRadius: 6,
            }}
          >
            ย้อนกลับ
          </Button>
        </Col>
      </Row>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <HomeOutlined style={{ fontSize: 24 }} />
            <h2>
              ทรัพย์สินของห้อง:{" "}
              <span style={{ color: "#1890ff" }}>{roomNumber}</span>
            </h2>
          </Space>

        </Col>

        <Col>
          {/* ปุ่มเพิ่มทรัพย์สิน */}
          <Button
            type="primary"
            onClick={() => navigate(`/Assets/create?roomNumber=${roomNumber}`)}
          >
            เพิ่มทรัพย์สิน
          </Button>
        </Col>
      </Row>


      <Divider />

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <Table
          columns={adminColumns}
          dataSource={dataSource}
          rowKey="key"
          pagination={{ pageSize: 10 }}
        />
      )}
    </>
  );
};

export default Asset;
