const { createClient } = require("@supabase/supabase-js");

function createSupabaseAdminClient(settings) {
  if (!settings.supabaseUrl || !settings.supabaseServiceRoleKey) {
    throw new Error("أكمل إعدادات Supabase أولاً.");
  }

  return createClient(settings.supabaseUrl, settings.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function countPendingOrders(client) {
  const { count, error } = await client
    .from("shop_orders")
    .select("id", { count: "exact", head: true })
    .eq("print_status", "pending")
    .is("printed_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function getNextPendingOrder(client) {
  const { data, error } = await client
    .from("shop_orders")
    .select("*")
    .eq("print_status", "pending")
    .is("printed_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

async function getOrderItems(client, orderId) {
  const { data, error } = await client
    .from("shop_order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function markOrderPrinted(client, orderId) {
  const printedAt = new Date().toISOString();
  const { error } = await client
    .from("shop_orders")
    .update({
      print_status: "printed",
      printed_at: printedAt,
    })
    .eq("id", orderId)
    .eq("print_status", "pending")
    .is("printed_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return printedAt;
}

async function markOrderFailed(client, order) {
  const nextAttempts = Number(order.print_attempts ?? 0) + 1;
  const { error } = await client
    .from("shop_orders")
    .update({
      print_status: "failed",
      print_attempts: nextAttempts,
    })
    .eq("id", order.id);

  if (error) {
    throw new Error(error.message);
  }
}

async function resetFailedOrders(client) {
  const { error } = await client
    .from("shop_orders")
    .update({
      print_status: "pending",
      printed_at: null,
    })
    .eq("print_status", "failed");

  if (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  createSupabaseAdminClient,
  countPendingOrders,
  getNextPendingOrder,
  getOrderItems,
  markOrderPrinted,
  markOrderFailed,
  resetFailedOrders,
};
