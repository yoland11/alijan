import { ORDER_STATUSES, SERVICE_TYPES } from "@/lib/constants";

export type ServiceType = (typeof SERVICE_TYPES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  note: string;
  timestamp: string;
}

export interface OrderRecord {
  id: string;
  order_code: string;
  name: string;
  phone: string;
  service_type: ServiceType;
  booking_date: string;
  status: OrderStatus;
  notes: string;
  images: string[];
  portal_message: string;
  delivery_details: string;
  estimated_delivery_date: string | null;
  archived_at: string | null;
  last_notification_at: string | null;
  last_notification_status: OrderStatus | null;
  status_history: OrderStatusHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface OrderFormValues {
  name: string;
  phone: string;
  service_type: ServiceType;
  booking_date: string;
  status: OrderStatus;
  notes: string;
  images: string[];
  portal_message: string;
  delivery_details: string;
  estimated_delivery_date: string | null;
}

export interface AdminTokenPayload {
  role: "admin";
  username: string;
}

export interface WhatsAppAutomationResult {
  attempted: boolean;
  sent: boolean;
  reason?: string;
}
