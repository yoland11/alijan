import { buildOrderCode, normalizeTrackingQuery } from "@/lib/utils";
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

  return (data ?? []) as OrderRecord[];
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

  return data as OrderRecord;
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

  return data as OrderRecord;
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

  console.log("findTrackingOrders query:", query);
  console.log("findTrackingOrders normalized:", normalized);

  if (!normalized) {
    return [] as OrderRecord[];
  }

  const supabase = createServiceSupabaseClient();

  try {
    if (normalized.startsWith("AJN-")) {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_code", normalized)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Supabase track by code error:", error);
        throw new Error(error.message);
      }

      return (data ?? []) as OrderRecord[];
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Supabase track by phone fetch error:", error);
      throw new Error(error.message);
    }

    const filtered = (data ?? []).filter((order) =>
      String(order.phone ?? "").endsWith(normalized)
    );

    return filtered as OrderRecord[];
  } catch (err) {
    console.error("TRACK ERROR FULL:", err);
    throw err;
  }
}