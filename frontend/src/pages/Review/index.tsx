import { useEffect, useMemo, useState } from "react";
import { Button, Table, Rate, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { GetReviews, DeleteReview } from "../../Service/https";
import type { ReviewInterface } from "../../interfaces/Review";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

export default function ReviewPage() {
  const [reviews, setReviews] = useState<ReviewInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const role = localStorage.getItem("role");   // "student" | "admin"
  const myId = localStorage.getItem("id");

  const getTitle = (r: any) => r?.Title ?? r?.title ?? "-";
  const getFirstName = (r:any) => r?.Student?.first_name ?? r?.student?.first_name ?? r?.Student?.First_Name ?? "-";
  const getRoomNumber = (r: any) => r?.Room?.RoomNumber ?? r?.room?.RoomNumber;
  const getTopic = (r:any) => r?.ReviewTopic?.TopicName ?? r?.review_topic?.topic_name ?? "-";
  const getRating = (r: any) => r?.Rating ?? r?.rating ?? 0;
  const getDate = (r: any) => r?.ReviewDate ?? r?.review_date;
  const getOwnerId = (r:any) => r?.StudentID ?? r?.student_id ?? r?.Student?.ID ?? r?.student?.id;
  const isOwner = (r:any) => myId && getOwnerId(r)?.toString() === myId?.toString();
  const getComment = (r: any) => r?.Comment ?? r?.comment ?? "-";

  // นักศึกษา 1 คนเขียนได้ 1 รีวิว: ถ้ามีของตัวเองแล้ว -> ซ่อนปุ่มสร้าง
  const hasMyReview = useMemo(
    () => role === "student" && !!myId && reviews.some((r) => isOwner(r)),
    [role, myId, reviews]
  );

  const columns: ColumnsType<any> = [
    { title: "รหัส", dataIndex: "ID" },
    { title: "หัวข้อ", render: (_: any, r: any) => getTitle(r) },
    { title: "ประเภท", render: (_: any, r: any) => getTopic(r) },
    { title: "ผู้รีวิว", render: (_: any, r: any) => getFirstName(r) },
    { title: "ห้อง", render: (_: any, r: any) => getRoomNumber(r) },
    { title: "คะแนน", render: (_: any, r: any) => <Rate disabled defaultValue={getRating(r)} /> },
    { title: "ความคิดเห็น", render: (_: any, r: any) => getComment(r) },
    {
      title: "วันที่รีวิว",
      render: (_: any, r: any) => {
        const d = getDate(r);
        return d ? dayjs(d).format("DD/MM/YYYY") : "-";
      },
    },
    {
      title: "การจัดการ",
      render: (_: any, record: any) => {
        if (role === "admin") {
          return <Button danger onClick={() => handleDelete(record.ID!)}>ลบ</Button>;
        }
        if (role === "student" && isOwner(record)) {
          return (
            <>
              <Link to={`/Review/Edit/${record.ID}`}>
                <Button icon={<EditOutlined />} style={{ marginRight: 8 }}>แก้ไข</Button>
              </Link>
              <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.ID!)}>ลบ</Button>
            </>
          );
        }
        return null;
      },
    },
  ];

  const fetchAll = async () => {
    const res = await GetReviews(); // ดึงรีวิวทั้งหมดให้นศ.เห็นได้ครบ
    if (res?.status === 200) setReviews(res.data);
    else messageApi.error(res?.data?.error || "โหลดข้อมูลรีวิวล้มเหลว");
  };

  const handleDelete = async (id: number) => {
    const res = await DeleteReview(id.toString());
    if (res?.status === 200) {
      messageApi.success("ลบรีวิวสำเร็จ");
      fetchAll(); // อัปเดตรายการ และจะทำให้ hasMyReview เป็น false หากลบของตัวเอง
    } else {
      messageApi.error(res?.data?.error || "ลบไม่สำเร็จ");
    }
  };

  useEffect(() => {
    fetchAll();
  }, [role]);

  return (
    <div>
      {contextHolder}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <h2>รีวิวและประเมินหอพัก</h2>
        {/* แสดงปุ่มเฉพาะนักศึกษาที่ 'ยังไม่มีรีวิวของตัวเอง' */}
        {role === "student" && !hasMyReview && (
          <Link to="/Review/Create">
            <Button type="primary" icon={<PlusOutlined />}>เขียนรีวิวใหม่</Button>
          </Link>
        )}
      </div>
      <Table
        columns={columns}
        dataSource={reviews}
        rowKey="ID"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
