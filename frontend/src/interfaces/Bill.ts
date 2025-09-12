import type { RoomMeterInterface } from "./Room";
import type { BillItemInterface } from "./BillItem";  


export interface BillInterface {
  id?: number;
  Billing_date?: Date;
  amount_due?: number;
  due_date?: Date;
  status?: string;
  room?: RoomMeterInterface; // เพิ่มตรงนี้
  billitem?: BillItemInterface;
}

export interface CreateBillPayload {
  room_id: number;
  due_date: Date;
  items: BillItemInterface[];
  
}