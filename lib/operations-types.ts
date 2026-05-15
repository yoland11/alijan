import type { ServiceType } from "@/lib/types";

export type BookingDisplayStatus = "مؤكد" | "بانتظار الدفع" | "مكتمل" | "ملغي";

export interface BookingCalendarEventRecord {
  id: string;
  order_code: string;
  customer_name: string;
  phone: string;
  service_type: ServiceType;
  booking_date: string;
  status: string;
  display_status: BookingDisplayStatus;
  total_amount: number;
  received_amount: number;
  remaining_amount: number;
  notes: string;
}

export interface BookingCalendarSnapshot {
  month: string;
  events: BookingCalendarEventRecord[];
  upcoming: BookingCalendarEventRecord[];
  summary: Array<{
    status: BookingDisplayStatus;
    count: number;
  }>;
}

export type InventoryMovementType =
  | "purchase"
  | "sale"
  | "adjustment"
  | "booking_use"
  | "restock";

export interface InventoryMovementRecord {
  id: string;
  item_id: string;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost: number;
  note: string;
  related_order_id: string | null;
  related_shop_order_id: string | null;
  created_at: string;
}

export interface InventoryItemRecord {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  purchase_price: number;
  sale_price: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  movements: InventoryMovementRecord[];
}

export type FinanceEntryType =
  | "sale_invoice"
  | "purchase_invoice"
  | "receipt_voucher"
  | "payment_voucher"
  | "expense"
  | "income";

export type FinanceDirection = "in" | "out";

export interface CashTransactionRecord {
  id: string;
  entry_type: FinanceEntryType;
  reference_code: string;
  amount: number;
  direction: FinanceDirection;
  source: string;
  customer_name: string;
  customer_phone: string;
  notes: string;
  happened_at: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceSnapshotRecord {
  cashInToday: number;
  cashOutToday: number;
  cashInMonth: number;
  cashOutMonth: number;
  currentBalance: number;
  customerDebts: number;
  recentTransactions: CashTransactionRecord[];
}

export interface CustomerInsightRecord {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  booking_count: number;
  shop_order_count: number;
  total_spent: number;
  remaining_balance: number;
  last_activity_at: string;
  notes: string;
}

export type EmployeeAttendanceStatus = "حاضر" | "متأخر" | "إجازة" | "غائب";
export type EmployeeTaskStatus = "جديدة" | "قيد التنفيذ" | "مكتملة";

export interface EmployeeAttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time: string;
  check_out_time: string;
  status: EmployeeAttendanceStatus;
  notes: string;
  created_at: string;
}

export interface EmployeeTaskRecord {
  id: string;
  employee_id: string;
  title: string;
  status: EmployeeTaskStatus;
  due_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeProfileRecord {
  id: string;
  name: string;
  phone: string;
  role: string;
  permissions: string[];
  monthly_salary: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  attendance: EmployeeAttendanceRecord[];
  tasks: EmployeeTaskRecord[];
}

export interface OperationsOverviewRecord {
  stats: {
    totalBookings: number;
    pendingBookings: number;
    monthlyRevenue: number;
    dailyRevenue: number;
    totalCustomers: number;
    lowStockItems: number;
    activeEmployees: number;
    monthlyExpenses: number;
  };
  revenueSeries: Array<{
    label: string;
    revenue: number;
    expenses: number;
  }>;
  bookingStatusSeries: Array<{
    name: string;
    value: number;
  }>;
  topServices: Array<{
    name: string;
    value: number;
  }>;
  recentBookings: BookingCalendarEventRecord[];
  lowStock: InventoryItemRecord[];
  recentCustomers: CustomerInsightRecord[];
}
