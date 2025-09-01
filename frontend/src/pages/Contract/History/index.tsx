import { useState, useEffect } from "react";
import { Table, message } from "antd";
import { GetPayment } from "../../../Service/https/index"; 
import type { PaymentInterface } from "../../../interfaces/Payment";

function History() {
  const [payments, setPayments] = useState<PaymentInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const getPayments = async () => {
    let res = await GetPayment();
    if (res.status === 200) {
      setPayments(res.data);
    } else {
      setPayments([]);
      messageApi.error(res.data.error);
    }
  };

  useEffect(() => {
    getPayments();
  }, []);

  const columns = [
    { title: "เลขที่สัญญา", dataIndex: "contract_id", key: "contract_id" },
    { title: "วันที่ชำระ", dataIndex: "payment_date", key: "payment_date" },
    { title: "จำนวนเงิน", dataIndex: "amount", key: "amount" },
    { title: "สถานะ", dataIndex: "status", key: "status" },
  ];

  return (
    <>
      {contextHolder}
      <h2 style={{ fontSize: "27px" }}>ประวัติการชำระเงิน</h2>
      <Table rowKey="ID" columns={columns} dataSource={payments} />
    </>
  );
}

export default History;
