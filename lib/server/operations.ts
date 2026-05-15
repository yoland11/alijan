import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import type { z } from "zod";
import type { OrderRecord } from "@/lib/types";
import { isCompletionReadyStatus, normalizeOrderRecord, normalizePhone, parseAmountValue } from "@/lib/utils";
import type {
  BookingCalendarEventRecord,
  BookingCalendarSnapshot,
  BookingDisplayStatus,
  CashTransactionRecord,
  CustomerInsightRecord,
  EmployeeAttendanceRecord,
  EmployeeProfileRecord,
  EmployeeTaskRecord,
  FinanceSnapshotRecord,
  InventoryItemRecord,
  InventoryMovementRecord,
  OperationsOverviewRecord,
} from "@/lib/operations-types";
import type {
  cashTransactionSchema,
  employeeAttendanceSchema,
  employeeProfileSchema,
  employeeTaskSchema,
  employeeTaskStatusSchema,
  inventoryItemSchema,
  inventoryMovementSchema,
} from "@/lib/operations-validators";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;
type CashTransactionInput = z.infer<typeof cashTransactionSchema>;
type EmployeeProfileInput = z.infer<typeof employeeProfileSchema>;
type EmployeeAttendanceInput = z.infer<typeof employeeAttendanceSchema>;
type EmployeeTaskInput = z.infer<typeof employeeTaskSchema>;
type EmployeeTaskStatusInput = z.infer<typeof employeeTaskStatusSchema>;

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numeric(value: unknown) {
  return parseAmountValue(value as string | number | null | undefined);
}

function bool(value: unknown) {
  return value === true;
}

function arrayText(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapBookingDisplayStatus(order: OrderRecord): BookingDisplayStatus {
  if (text(order.status) === "ملغي") {
    return "ملغي";
  }

  if (isCompletionReadyStatus(order.status) || text(order.status) === "تم التسليم") {
    return "مكتمل";
  }

  if (order.remaining_amount > 0) {
    return "بانتظار الدفع";
  }

  return "مؤكد";
}

function normalizeBookingEvent(order: OrderRecord): BookingCalendarEventRecord {
  return {
    id: order.id,
    order_code: order.order_code,
    customer_name: order.name,
    phone: order.phone,
    service_type: order.service_type,
    booking_date: order.booking_date,
    status: order.status,
    display_status: mapBookingDisplayStatus(order),
    total_amount: order.total_amount,
    received_amount: order.received_amount,
    remaining_amount: order.remaining_amount,
    notes: order.notes,
  };
}

function getMonthRange(input?: string) {
  const now = new Date();
  const base = input && /^\d{4}-\d{2}$/.test(input) ? new Date(`${input}-01T00:00:00`) : now;
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return {
    month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function normalizeInventoryMovement(raw: Record<string, unknown>): InventoryMovementRecord {
  return {
    id: text(raw.id),
    item_id: text(raw.item_id),
    movement_type: text(raw.movement_type) as InventoryMovementRecord["movement_type"],
    quantity: numeric(raw.quantity),
    unit_cost: numeric(raw.unit_cost),
    note: text(raw.note),
    related_order_id: text(raw.related_order_id) || null,
    related_shop_order_id: text(raw.related_shop_order_id) || null,
    created_at: text(raw.created_at),
  };
}

function normalizeInventoryItem(
  raw: Record<string, unknown>,
  movements: InventoryMovementRecord[],
): InventoryItemRecord {
  return {
    id: text(raw.id),
    name: text(raw.name),
    category: text(raw.category),
    unit: text(raw.unit) || "قطعة",
    quantity: numeric(raw.quantity),
    min_quantity: numeric(raw.min_quantity),
    purchase_price: numeric(raw.purchase_price),
    sale_price: numeric(raw.sale_price),
    notes: text(raw.notes),
    is_active: raw.is_active !== false,
    created_at: text(raw.created_at),
    updated_at: text(raw.updated_at),
    movements,
  };
}

function normalizeCashTransaction(raw: Record<string, unknown>): CashTransactionRecord {
  return {
    id: text(raw.id),
    entry_type: text(raw.entry_type) as CashTransactionRecord["entry_type"],
    reference_code: text(raw.reference_code),
    amount: numeric(raw.amount),
    direction: text(raw.direction) as CashTransactionRecord["direction"],
    source: text(raw.source),
    customer_name: text(raw.customer_name),
    customer_phone: text(raw.customer_phone),
    notes: text(raw.notes),
    happened_at: text(raw.happened_at),
    created_at: text(raw.created_at),
    updated_at: text(raw.updated_at),
  };
}

function normalizeEmployeeAttendance(raw: Record<string, unknown>): EmployeeAttendanceRecord {
  return {
    id: text(raw.id),
    employee_id: text(raw.employee_id),
    attendance_date: text(raw.attendance_date),
    check_in_time: text(raw.check_in_time),
    check_out_time: text(raw.check_out_time),
    status: text(raw.status) as EmployeeAttendanceRecord["status"],
    notes: text(raw.notes),
    created_at: text(raw.created_at),
  };
}

function normalizeEmployeeTask(raw: Record<string, unknown>): EmployeeTaskRecord {
  return {
    id: text(raw.id),
    employee_id: text(raw.employee_id),
    title: text(raw.title),
    status: text(raw.status) as EmployeeTaskRecord["status"],
    due_date: text(raw.due_date),
    notes: text(raw.notes),
    created_at: text(raw.created_at),
    updated_at: text(raw.updated_at),
  };
}

function normalizeEmployeeProfile(
  raw: Record<string, unknown>,
  attendance: EmployeeAttendanceRecord[],
  tasks: EmployeeTaskRecord[],
): EmployeeProfileRecord {
  return {
    id: text(raw.id),
    name: text(raw.name),
    phone: text(raw.phone),
    role: text(raw.role),
    permissions: arrayText(raw.permissions),
    monthly_salary: numeric(raw.monthly_salary),
    notes: text(raw.notes),
    is_active: raw.is_active !== false,
    created_at: text(raw.created_at),
    updated_at: text(raw.updated_at),
    attendance,
    tasks,
  };
}

async function fetchOrdersRange(month?: string) {
  const supabase = createServiceSupabaseClient();
  const range = getMonthRange(month);
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .gte("booking_date", range.start)
    .lte("booking_date", range.end)
    .order("booking_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return {
    range,
    orders: (data ?? []).map((item) => normalizeOrderRecord(item as Record<string, unknown>)),
  };
}

export async function getBookingCalendarSnapshot(month?: string): Promise<BookingCalendarSnapshot> {
  const supabase = createServiceSupabaseClient();
  const [{ range, orders }, upcomingRes] = await Promise.all([
    fetchOrdersRange(month),
    supabase
      .from("orders")
      .select("*")
      .gte("booking_date", new Date().toISOString().slice(0, 10))
      .order("booking_date", { ascending: true })
      .limit(8),
  ]);

  if (upcomingRes.error) {
    throw new Error(upcomingRes.error.message);
  }

  const events = orders.map(normalizeBookingEvent);
  const upcoming = (upcomingRes.data ?? [])
    .map((item) => normalizeOrderRecord(item as Record<string, unknown>))
    .map(normalizeBookingEvent);

  const summaryOrder: BookingDisplayStatus[] = ["مؤكد", "بانتظار الدفع", "مكتمل", "ملغي"];
  const summary = summaryOrder.map((status) => ({
    status,
    count: events.filter((event) => event.display_status === status).length,
  }));

  return {
    month: range.month,
    events,
    upcoming,
    summary,
  };
}

export async function listInventoryItems() {
  const supabase = createServiceSupabaseClient();
  const [itemsRes, movementRes] = await Promise.all([
    supabase.from("inventory_items").select("*").order("updated_at", { ascending: false }),
    supabase.from("inventory_movements").select("*").order("created_at", { ascending: false }).limit(120),
  ]);

  if (itemsRes.error) {
    throw new Error(itemsRes.error.message);
  }

  if (movementRes.error) {
    throw new Error(movementRes.error.message);
  }

  const movements = (movementRes.data ?? []).map((item) =>
    normalizeInventoryMovement(item as Record<string, unknown>),
  );

  return (itemsRes.data ?? []).map((item) => {
    const id = text((item as Record<string, unknown>).id);
    return normalizeInventoryItem(
      item as Record<string, unknown>,
      movements.filter((movement) => movement.item_id === id).slice(0, 5),
    );
  });
}

export async function createInventoryItem(input: InventoryItemInput) {
  const supabase = createServiceSupabaseClient();
  const payload = {
    ...input,
    unit: input.unit || "قطعة",
  };

  const { data, error } = await supabase.from("inventory_items").insert(payload).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInventoryItem(data as Record<string, unknown>, []);
}

export async function updateInventoryItem(id: string, input: InventoryItemInput) {
  const supabase = createServiceSupabaseClient();
  const payload = {
    ...input,
    unit: input.unit || "قطعة",
  };

  const { data, error } = await supabase
    .from("inventory_items")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInventoryItem(data as Record<string, unknown>, []);
}

export async function deleteInventoryItem(id: string) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("inventory_items").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createInventoryMovement(input: InventoryMovementInput) {
  const supabase = createServiceSupabaseClient();
  const { data: itemData, error: itemError } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", input.item_id)
    .single();

  if (itemError || !itemData) {
    throw new Error(itemError?.message || "المادة غير موجودة.");
  }

  const currentQuantity = numeric((itemData as Record<string, unknown>).quantity);
  const baseQuantity = Math.abs(input.quantity);
  const delta =
    input.movement_type === "purchase" || input.movement_type === "restock"
      ? baseQuantity
      : input.movement_type === "adjustment"
        ? input.quantity
        : -baseQuantity;

  const nextQuantity = currentQuantity + delta;

  if (nextQuantity < 0) {
    throw new Error("الكمية الحالية لا تكفي لتنفيذ الحركة.");
  }

  const { error: updateError } = await supabase
    .from("inventory_items")
    .update({ quantity: nextQuantity })
    .eq("id", input.item_id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { data, error } = await supabase
    .from("inventory_movements")
    .insert({
      item_id: input.item_id,
      movement_type: input.movement_type,
      quantity: input.movement_type === "adjustment" ? input.quantity : baseQuantity,
      unit_cost: input.unit_cost ?? 0,
      note: input.note ?? "",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInventoryMovement(data as Record<string, unknown>);
}

export async function getFinanceSnapshot(): Promise<FinanceSnapshotRecord> {
  const supabase = createServiceSupabaseClient();
  const [transactionsRes, ordersRes] = await Promise.all([
    supabase.from("cash_transactions").select("*").order("happened_at", { ascending: false }).limit(80),
    supabase.from("orders").select("remaining_amount"),
  ]);

  if (transactionsRes.error) {
    throw new Error(transactionsRes.error.message);
  }

  if (ordersRes.error) {
    throw new Error(ordersRes.error.message);
  }

  const transactions = (transactionsRes.data ?? []).map((item) =>
    normalizeCashTransaction(item as Record<string, unknown>),
  );

  const todayKey = new Date().toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);

  const summary = transactions.reduce(
    (acc, item) => {
      const dateKey = text(item.happened_at).slice(0, 10);
      const itemMonth = text(item.happened_at).slice(0, 7);
      const isIn = item.direction === "in";

      if (dateKey === todayKey) {
        if (isIn) acc.cashInToday += item.amount;
        else acc.cashOutToday += item.amount;
      }

      if (itemMonth === monthKey) {
        if (isIn) acc.cashInMonth += item.amount;
        else acc.cashOutMonth += item.amount;
      }

      acc.currentBalance += isIn ? item.amount : -item.amount;
      return acc;
    },
    {
      cashInToday: 0,
      cashOutToday: 0,
      cashInMonth: 0,
      cashOutMonth: 0,
      currentBalance: 0,
    },
  );

  const customerDebts = (ordersRes.data ?? []).reduce(
    (sum, item) => sum + numeric((item as Record<string, unknown>).remaining_amount),
    0,
  );

  return {
    ...summary,
    customerDebts,
    recentTransactions: transactions,
  };
}

export async function createCashTransaction(input: CashTransactionInput) {
  const supabase = createServiceSupabaseClient();
  const payload = {
    ...input,
    happened_at: input.happened_at || new Date().toISOString(),
  };

  const { data, error } = await supabase.from("cash_transactions").insert(payload).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeCashTransaction(data as Record<string, unknown>);
}

export async function deleteCashTransaction(id: string) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("cash_transactions").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listCustomerInsights(): Promise<CustomerInsightRecord[]> {
  const supabase = createServiceSupabaseClient();
  const [customersRes, addressesRes, bookingsRes, shopOrdersRes] = await Promise.all([
    supabase.from("customer_users").select("*"),
    supabase.from("customer_addresses").select("*").eq("is_default", true),
    supabase.from("orders").select("*"),
    supabase.from("shop_orders").select("*"),
  ]);

  if (customersRes.error) throw new Error(customersRes.error.message);
  if (addressesRes.error) throw new Error(addressesRes.error.message);
  if (bookingsRes.error) throw new Error(bookingsRes.error.message);
  if (shopOrdersRes.error) throw new Error(shopOrdersRes.error.message);

  const addressesByCustomer = new Map<string, string>();
  for (const row of addressesRes.data ?? []) {
    const raw = row as Record<string, unknown>;
    addressesByCustomer.set(
      text(raw.customer_id),
      [text(raw.province), text(raw.district), text(raw.address)].filter(Boolean).join(" | "),
    );
  }

  const map = new Map<string, CustomerInsightRecord>();

  for (const row of customersRes.data ?? []) {
    const raw = row as Record<string, unknown>;
    const id = text(raw.id);
    const phone = normalizePhone(text(raw.phone));
    const key = id || phone || text(raw.email);
    if (!key) continue;
    map.set(key, {
      id: id || key,
      full_name: text(raw.full_name) || "عميل",
      phone,
      email: text(raw.email),
      address: addressesByCustomer.get(id) ?? "",
      booking_count: 0,
      shop_order_count: 0,
      total_spent: 0,
      remaining_balance: 0,
      last_activity_at: text(raw.updated_at) || text(raw.created_at),
      notes: "",
    });
  }

  for (const row of bookingsRes.data ?? []) {
    const order = normalizeOrderRecord(row as Record<string, unknown>);
    const phone = normalizePhone(order.phone);
    const key = [...map.keys()].find((item) => map.get(item)?.phone === phone) ?? phone;
    const existing =
      map.get(key) ??
      ({
        id: key,
        full_name: order.name,
        phone,
        email: "",
        address: order.service_details.address,
        booking_count: 0,
        shop_order_count: 0,
        total_spent: 0,
        remaining_balance: 0,
        last_activity_at: order.updated_at,
        notes: "",
      } satisfies CustomerInsightRecord);

    existing.booking_count += 1;
    existing.total_spent += order.total_amount;
    existing.remaining_balance += order.remaining_amount;
    existing.last_activity_at =
      existing.last_activity_at > order.updated_at ? existing.last_activity_at : order.updated_at;
    if (!existing.address && order.service_details.address) {
      existing.address = order.service_details.address;
    }
    map.set(key, existing);
  }

  for (const row of shopOrdersRes.data ?? []) {
    const raw = row as Record<string, unknown>;
    const phone = normalizePhone(text(raw.phone));
    const key = [...map.keys()].find((item) => map.get(item)?.phone === phone) ?? phone;
    const existing =
      map.get(key) ??
      ({
        id: key,
        full_name: text(raw.customer_name) || "عميل",
        phone,
        email: "",
        address: text(raw.address),
        booking_count: 0,
        shop_order_count: 0,
        total_spent: 0,
        remaining_balance: 0,
        last_activity_at: text(raw.updated_at) || text(raw.created_at),
        notes: "",
      } satisfies CustomerInsightRecord);

    existing.shop_order_count += 1;
    existing.total_spent += numeric(raw.total);
    existing.last_activity_at =
      existing.last_activity_at > text(raw.updated_at) ? existing.last_activity_at : text(raw.updated_at);
    if (!existing.address && text(raw.address)) {
      existing.address = text(raw.address);
    }
    map.set(key, existing);
  }

  return [...map.values()].sort((a, b) => (a.last_activity_at < b.last_activity_at ? 1 : -1));
}

export async function listEmployeeProfiles(): Promise<EmployeeProfileRecord[]> {
  const supabase = createServiceSupabaseClient();
  const [profilesRes, attendanceRes, tasksRes] = await Promise.all([
    supabase.from("employee_profiles").select("*").order("updated_at", { ascending: false }),
    supabase.from("employee_attendance").select("*").order("attendance_date", { ascending: false }).limit(120),
    supabase.from("employee_tasks").select("*").order("created_at", { ascending: false }).limit(120),
  ]);

  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (attendanceRes.error) throw new Error(attendanceRes.error.message);
  if (tasksRes.error) throw new Error(tasksRes.error.message);

  const attendance = (attendanceRes.data ?? []).map((item) =>
    normalizeEmployeeAttendance(item as Record<string, unknown>),
  );
  const tasks = (tasksRes.data ?? []).map((item) => normalizeEmployeeTask(item as Record<string, unknown>));

  return (profilesRes.data ?? []).map((item) => {
    const id = text((item as Record<string, unknown>).id);
    return normalizeEmployeeProfile(
      item as Record<string, unknown>,
      attendance.filter((row) => row.employee_id === id).slice(0, 6),
      tasks.filter((row) => row.employee_id === id).slice(0, 6),
    );
  });
}

export async function createEmployeeProfile(input: EmployeeProfileInput) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("employee_profiles").insert(input).select("*").single();

  if (error) throw new Error(error.message);
  return normalizeEmployeeProfile(data as Record<string, unknown>, [], []);
}

export async function updateEmployeeProfile(id: string, input: EmployeeProfileInput) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("employee_profiles")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeEmployeeProfile(data as Record<string, unknown>, [], []);
}

export async function deleteEmployeeProfile(id: string) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("employee_profiles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createEmployeeAttendance(input: EmployeeAttendanceInput) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("employee_attendance").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return normalizeEmployeeAttendance(data as Record<string, unknown>);
}

export async function createEmployeeTask(input: EmployeeTaskInput) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("employee_tasks").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return normalizeEmployeeTask(data as Record<string, unknown>);
}

export async function updateEmployeeTaskStatus(input: EmployeeTaskStatusInput) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("employee_tasks")
    .update({ status: input.status })
    .eq("id", input.task_id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeEmployeeTask(data as Record<string, unknown>);
}

export async function getOperationsOverview(): Promise<OperationsOverviewRecord> {
  const supabase = createServiceSupabaseClient();
  const [ordersRes, shopOrdersRes, inventoryRes, customersRes, employeesRes, transactionsRes] = await Promise.all([
    supabase.from("orders").select("*").order("updated_at", { ascending: false }),
    supabase.from("shop_orders").select("id, customer_name, total, status, created_at"),
    supabase.from("inventory_items").select("*"),
    supabase.from("customer_users").select("id, full_name, phone, email, created_at, updated_at").order("updated_at", { ascending: false }).limit(8),
    supabase.from("employee_profiles").select("id, is_active"),
    supabase.from("cash_transactions").select("*").order("happened_at", { ascending: false }).limit(120),
  ]);

  if (ordersRes.error) throw new Error(ordersRes.error.message);
  if (shopOrdersRes.error) throw new Error(shopOrdersRes.error.message);
  if (inventoryRes.error) throw new Error(inventoryRes.error.message);
  if (customersRes.error) throw new Error(customersRes.error.message);
  if (employeesRes.error) throw new Error(employeesRes.error.message);
  if (transactionsRes.error) throw new Error(transactionsRes.error.message);

  const orders = (ordersRes.data ?? []).map((item) => normalizeOrderRecord(item as Record<string, unknown>));
  const inventoryItems = (inventoryRes.data ?? []).map((item) =>
    normalizeInventoryItem(item as Record<string, unknown>, []),
  );
  const transactions = (transactionsRes.data ?? []).map((item) =>
    normalizeCashTransaction(item as Record<string, unknown>),
  );

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const lastSixMonths = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  const revenueSeries = lastSixMonths.map((month) => {
    const bookingRevenue = orders
      .filter((order) => order.booking_date.slice(0, 7) === month)
      .reduce((sum, order) => sum + order.received_amount, 0);
    const shopRevenue = (shopOrdersRes.data ?? [])
      .filter((row) => text((row as Record<string, unknown>).created_at).slice(0, 7) === month)
      .reduce((sum, row) => sum + numeric((row as Record<string, unknown>).total), 0);
    const expenses = transactions
      .filter((item) => item.happened_at.slice(0, 7) === month && item.direction === "out")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      label: month,
      revenue: bookingRevenue + shopRevenue,
      expenses,
    };
  });

  const bookingStatusMap = new Map<string, number>();
  for (const order of orders) {
    const key = mapBookingDisplayStatus(order);
    bookingStatusMap.set(key, (bookingStatusMap.get(key) ?? 0) + 1);
  }

  const topServicesMap = new Map<string, number>();
  for (const order of orders) {
    const key = SERVICE_TYPE_LABELS[order.service_type];
    topServicesMap.set(key, (topServicesMap.get(key) ?? 0) + 1);
  }

  const recentCustomers: CustomerInsightRecord[] = (customersRes.data ?? []).map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      id: text(raw.id),
      full_name: text(raw.full_name),
      phone: normalizePhone(text(raw.phone)),
      email: text(raw.email),
      address: "",
      booking_count: 0,
      shop_order_count: 0,
      total_spent: 0,
      remaining_balance: 0,
      last_activity_at: text(raw.updated_at) || text(raw.created_at),
      notes: "",
    };
  });

  const monthlyRevenue = revenueSeries.at(-1)?.revenue ?? 0;
  const monthlyExpenses = revenueSeries.at(-1)?.expenses ?? 0;
  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyBookingRevenue = orders
    .filter((order) => order.booking_date === todayKey)
    .reduce((sum, order) => sum + order.received_amount, 0);
  const dailyShopRevenue = (shopOrdersRes.data ?? [])
    .filter((row) => text((row as Record<string, unknown>).created_at).slice(0, 10) === todayKey)
    .reduce((sum, row) => sum + numeric((row as Record<string, unknown>).total), 0);
  const pendingBookings = orders.filter((order) => mapBookingDisplayStatus(order) !== "مكتمل").length;
  const lowStock = inventoryItems.filter((item) => item.is_active && item.quantity <= item.min_quantity);

  return {
    stats: {
      totalBookings: orders.length,
      pendingBookings,
      monthlyRevenue,
      dailyRevenue: dailyBookingRevenue + dailyShopRevenue,
      totalCustomers: customersRes.data?.length ?? 0,
      lowStockItems: lowStock.length,
      activeEmployees: (employeesRes.data ?? []).filter((row) => bool((row as Record<string, unknown>).is_active)).length,
      monthlyExpenses,
    },
    revenueSeries,
    bookingStatusSeries: [...bookingStatusMap.entries()].map(([name, value]) => ({ name, value })),
    topServices: [...topServicesMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6),
    recentBookings: orders.slice(0, 6).map(normalizeBookingEvent),
    lowStock: lowStock.slice(0, 6),
    recentCustomers,
  };
}
