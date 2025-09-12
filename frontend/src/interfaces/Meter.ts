import type { StudentInterface } from "./Student";
import type { RoomMeterInterface } from "./Room";
import type { MeterTypeInterface } from "./MeterType";

export interface MeterInterface {

  id?: number;
  record_date?: Date;
  old_value?: number;
  new_value?: number;
  unit_used?: number;
  total_amount?: number;
  student?: StudentInterface;
  room?: RoomMeterInterface;
  meter_type?: MeterTypeInterface;
}

export interface CreateMeterPayload {
  room_id: number;
  meter_type_id: number;
  new_value: number;
  
}

export interface UpdateMeterPayload {
  room_id: number;
  meter_type_id: number;
  new_value: number;
}
