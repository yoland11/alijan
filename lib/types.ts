import { ALBUM_SESSION_TYPES, ORDER_STATUSES, SERVICE_TYPES } from "@/lib/constants";

export type ServiceType = (typeof SERVICE_TYPES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type AlbumSessionType = (typeof ALBUM_SESSION_TYPES)[number];

export interface OrderRecord {
  id: string;
  order_code: string;
  name: string;
  phone: string;
  service_type: ServiceType;
  photographer: string;
  session_type: AlbumSessionType | "";
  booking_date: string;
  status: OrderStatus;
  notes: string;
  images: string[];
  total_amount: number;
  received_amount: number;
  remaining_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderFormValues {
  name: string;
  phone: string;
  service_type: ServiceType;
  photographer: string;
  session_type: AlbumSessionType | "";
  booking_date: string;
  status: OrderStatus;
  notes: string;
  images: string[];
  total_amount: number;
  received_amount: number;
  remaining_amount: number;
}

export interface AdminTokenPayload {
  role: "admin";
  username: string;
}
