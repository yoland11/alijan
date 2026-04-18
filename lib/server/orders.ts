import { ORDER_STATUSES } from "@/lib/constants";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { OrderRecord, OrderStatus, OrderStatusHistoryEntry } from "@/lib/types";
import { buildOrderCode, normalizeTrackingQuery } from "@/lib/utils";
import type { OrderSchema } from "@/lib/validators";

function toHistoryEntry(status: OrderStatus, note: string): OrderStatusHistoryEntry {
  return {
    status,
    note,
    timestamp: new Date().toISOString(),
  };
}

function parseStatusHistory(input: unknown): OrderStatusHistoryEntry[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;

    if (
      typeof candidate.status !== "string" ||
      !ORDER_STATUSES.includes(candidate.status as OrderStatus) ||
      typeof candidate.timestamp !== "string"
    ) {
      return [];
    }

    return [
      {
        status: candidate.status as OrderStatus,
        note: typeof candidate.note === "string" ? candidate.note : "",
        timestamp: candidate.timestamp,
      },
    ];
  });
}

function mapOrderRecord(raw: Record<string, unknown>): OrderRecord {
  return {
    id: String(raw.id),
    order_code: String(raw.order_code),
    name: String(raw.name),
    phone: String(raw.phone),
    service_type: raw.service_type as OrderRecord["service_type"],
    booking_date: String(raw.booking_date),
    status: raw.status as OrderStatus,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    images: Array.isArray(raw.images) ? raw.images.map((item) => String(item)) : [],
    portal_message: typeof raw.portal_message === "string" ? raw.portal_message : "",
    delivery_details: typeof raw.delivery_details === "string" ? raw.delivery_details : "",
    estimated_delivery_date:
      typeof raw.estimated_delivery_date === "string" ? raw.estimated_delivery_date : null,
    archived_at: typeof raw.archived_at === "string" ? raw.archived_at : null,
    last_notification_at:
      typeof raw.last_notification_at === "string" ? raw.last_notification_at : null,
    last_notification_status:
      typeof raw.last_notification_status === "string" &&
      ORDER_STATUSES.includes(raw.last_notification_status as OrderStatus)
        ? (raw.last_notification_status as OrderStatus)
        : null,
    status_history: parseStatusHistory(raw.status_history),
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
  };
}

function buildStatusHistoryForCreate(status: OrderStatus) {
  return [toHistoryEntry(status, "تم إنشاء الطلب واعتماد حالته الأولى داخل النظام.")];
}

function buildStatusHistoryForUpdate(
  previousHistory: OrderStatusHistoryEntry[],
  previousStatus: OrderStatus,
  nextStatus: OrderStatus,
) {
  if (!previousHistory.length) {
    return buildStatusHistoryForCreate(nextStatus);
  }

  if (previousStatus === nextStatus) {
    return previousHistory;
  }

  return [
    ...previousHistory,
    toHistoryEntry(nextStatus, `تم نقل الطلب من ${previousStatus} إلى ${nextStatus}.`),
  ];
}

function buildOrderPayload(
  input: OrderSchema,
  statusHistory: OrderStatusHistoryEntry[],
) {
  return {
    name: input.name,
    phone: input.phone,
    service_type: input.service_type,
    booking_date: input.booking_date,
    status: input.status,
    notes: input.notes ?? "",
    images: input.images ?? [],
    portal_message: input.portal_message ?? "",
    delivery_details: input.delivery_details ?? "",
    estimated_delivery_date: input.estimated_delivery_date ?? null,
    status_history: statusHistory,
    order_code: buildOrderCode(input.phone),
  };
}

export async function listOrders() {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => mapOrderRecord(item as Record<string, unknown>));
}

export async function getOrderById(id: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapOrderRecord(data as Record<string, unknown>);
}

export async function createOrder(input: OrderSchema) {
  const supabase = createServiceSupabaseClient();
  const payload = buildOrderPayload(input, buildStatusHistoryForCreate(input.status));

  const { data, error } = await supabase.from("orders").insert(payload).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return mapOrderRecord(data as Record<string, unknown>);
}

export async function updateOrder(id: string, input: OrderSchema, previousOrder?: OrderRecord | null) {
  const existingOrder = previousOrder ?? (await getOrderById(id));

  if (!existingOrder) {
    throw new Error("الطلب غير موجود.");
  }

  const supabase = createServiceSupabaseClient();
  const payload = buildOrderPayload(
    input,
    buildStatusHistoryForUpdate(existingOrder.status_history, existingOrder.status, input.status),
  );

  const { data, error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapOrderRecord(data as Record<string, unknown>);
}

export async function archiveOrder(id: string, archived: boolean) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      archived_at: archived ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapOrderRecord(data as Record<string, unknown>);
}

export async function markOrderNotificationSent(id: string, status: OrderStatus) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      last_notification_at: new Date().toISOString(),
      last_notification_status: status,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapOrderRecord(data as Record<string, unknown>);
}

export async function deleteOrder(id: string) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function findTrackingOrders(query: string) {
  const normalized = normalizeTrackingQuery(query);

  if (!normalized) {
    return [] as OrderRecord[];
  }

  const supabase = createServiceSupabaseClient();

  if (normalized.startsWith("AJN-")) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .ilike("order_code", normalized)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => mapOrderRecord(item as Record<string, unknown>));
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .like("phone", `%${normalized}`)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => mapOrderRecord(item as Record<string, unknown>));
}
