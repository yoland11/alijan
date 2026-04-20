import { buildOrderCode, normalizeOrderRecord, normalizeTrackingQuery } from "@/lib/utils";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { OrderRecord } from "@/lib/types";
import type { OrderSchema } from "@/lib/validators";

export async function listOrders() {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((order) => normalizeOrderRecord(order as Record<string, unknown>));
}

export async function getOrderById(id: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeOrderRecord(data as Record<string, unknown>);
}

export async function createOrder(input: OrderSchema) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      ...input,
      notes: input.notes ?? "",
      images: input.images ?? [],
      order_code: buildOrderCode(input.phone),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeOrderRecord(data as Record<string, unknown>);
}

export async function updateOrder(id: string, input: OrderSchema) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      ...input,
      notes: input.notes ?? "",
      images: input.images ?? [],
      order_code: buildOrderCode(input.phone),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeOrderRecord(data as Record<string, unknown>);
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
      .eq("order_code", normalized)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((order) => normalizeOrderRecord(order as Record<string, unknown>));
  }

  const { data, error } = await supabase.from("orders").select("*").order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((order) => normalizeOrderRecord(order as Record<string, unknown>))
    .filter((order) => String(order.phone ?? "").endsWith(normalized));
}
