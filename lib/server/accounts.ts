import bcrypt from "bcryptjs";

import type { OrderRecord } from "@/lib/types";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type {
  CustomerAddressRecord,
  CustomerNotificationRecord,
  CustomerNotificationType,
  CustomerUserRecord,
  DeliveryAgentRecord,
  ProductRecord,
  ShopOrderItemRecord,
  ShopOrderRecord,
} from "@/lib/shop-types";
import type {
  CustomerAddressSchema,
  CustomerLoginSchema,
  CustomerNotificationAdminSchema,
  CustomerRegisterSchema,
  CustomerResetPasswordSchema,
  DeliveryAgentLoginSchema,
  DeliveryAgentSchema,
} from "@/lib/shop-validators";
import {
  normalizeCustomerAddressRecord,
  normalizeCustomerNotificationRecord,
  normalizeCustomerUserRecord,
  normalizeDeliveryAgentRecord,
  normalizeProductRecord,
  normalizeShopOrderItemRecord,
  normalizeShopOrderRecord,
} from "@/lib/shop-utils";
import { normalizeOrderRecord, normalizePhone } from "@/lib/utils";

async function hydrateShopOrders(rows: Record<string, unknown>[]) {
  const supabase = createServiceSupabaseClient();
  const orderIds = rows.map((item) => String(item.id ?? "")).filter(Boolean);
  const itemsByOrder = new Map<string, ShopOrderItemRecord[]>();

  if (orderIds.length) {
    const { data: itemsData, error: itemsError } = await supabase
      .from("shop_order_items")
      .select("*")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    (itemsData ?? []).forEach((row) => {
      const item = normalizeShopOrderItemRecord(row as Record<string, unknown>);
      const list = itemsByOrder.get(item.order_id) ?? [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    });
  }

  return rows.map((row) => {
    const id = String(row.id ?? "");
    return normalizeShopOrderRecord(row, itemsByOrder.get(id) ?? []);
  });
}

export async function getCustomerById(customerId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("customer_users")
    .select("*")
    .eq("id", customerId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeCustomerUserRecord(data as Record<string, unknown>) : null;
}

export async function findCustomerByIdentifier(identifier: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  if (!normalizedIdentifier) {
    return null;
  }

  const supabase = createServiceSupabaseClient();
  const isEmail = normalizedIdentifier.includes("@");
  const column = isEmail ? "email" : "phone";
  const value = isEmail ? normalizedIdentifier : normalizePhone(normalizedIdentifier);

  const { data, error } = await supabase
    .from("customer_users")
    .select("*")
    .eq(column, value)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data
    ? {
        customer: normalizeCustomerUserRecord(data as Record<string, unknown>),
        passwordHash: String((data as Record<string, unknown>).password_hash ?? ""),
      }
    : null;
}

export async function findCustomerByPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return null;
  }

  return findCustomerByIdentifier(normalizedPhone);
}

export async function createCustomerAccount(input: CustomerRegisterSchema) {
  const supabase = createServiceSupabaseClient();
  const passwordHash = await bcrypt.hash(input.password, 10);

  const { data, error } = await supabase
    .from("customer_users")
    .insert({
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      password_hash: passwordHash,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("الحساب موجود مسبقًا بهذا البريد أو الهاتف.");
    }

    throw new Error(error.message);
  }

  return normalizeCustomerUserRecord(data as Record<string, unknown>);
}

export async function verifyCustomerCredentials(input: CustomerLoginSchema) {
  const result = await findCustomerByIdentifier(input.identifier);

  if (!result) {
    return null;
  }

  const isValid = await bcrypt.compare(input.password, result.passwordHash);
  return isValid ? result.customer : null;
}

export async function resetCustomerPassword(input: CustomerResetPasswordSchema) {
  const supabase = createServiceSupabaseClient();
  const normalizedPhone = normalizePhone(input.phone);
  const { data, error } = await supabase
    .from("customer_users")
    .select("*")
    .eq("email", input.email)
    .eq("phone", normalizedPhone)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("لم يتم العثور على حساب مطابق.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const { data: updated, error: updateError } = await supabase
    .from("customer_users")
    .update({ password_hash: passwordHash })
    .eq("id", String((data as Record<string, unknown>).id ?? ""))
    .select("*")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  return normalizeCustomerUserRecord(updated as Record<string, unknown>);
}

export async function listCustomerAddresses(customerId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => normalizeCustomerAddressRecord(item as Record<string, unknown>));
}

export async function saveCustomerAddress(customerId: string, input: CustomerAddressSchema, addressId?: string) {
  const supabase = createServiceSupabaseClient();

  if (input.is_default) {
    await supabase.from("customer_addresses").update({ is_default: false }).eq("customer_id", customerId);
  }

  const payload = {
    customer_id: customerId,
    label: input.label,
    province: input.province,
    district: input.district,
    address: input.address,
    phone: input.phone,
    location_lat: input.location_lat,
    location_lng: input.location_lng,
    google_maps_url: input.google_maps_url,
    is_default: input.is_default,
  };

  const query = addressId
    ? supabase.from("customer_addresses").update(payload).eq("id", addressId)
    : supabase.from("customer_addresses").insert(payload);

  const { data, error } = await query.select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeCustomerAddressRecord(data as Record<string, unknown>);
}

export async function deleteCustomerAddress(customerId: string, addressId: string) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", customerId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listCustomerFavoriteProducts(customerId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("customer_favorites")
    .select("product_id, products(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => (row as Record<string, unknown>).products as Record<string, unknown> | null)
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .map((row) => normalizeProductRecord(row));
}

export async function listCustomerFavoriteIds(customerId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("customer_favorites")
    .select("product_id")
    .eq("customer_id", customerId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => String((row as Record<string, unknown>).product_id ?? ""))
    .filter(Boolean);
}

export async function toggleCustomerFavorite(customerId: string, productId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("customer_favorites")
    .select("id")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    const { error: removeError } = await supabase.from("customer_favorites").delete().eq("id", String((data as Record<string, unknown>).id ?? ""));
    if (removeError) {
      throw new Error(removeError.message);
    }

    return { active: false };
  }

  const { error: insertError } = await supabase.from("customer_favorites").insert({
    customer_id: customerId,
    product_id: productId,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { active: true };
}

export async function listCustomerNotifications(customerId: string, unreadOnly = false) {
  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("customer_notifications")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => normalizeCustomerNotificationRecord(item as Record<string, unknown>));
}

export async function markCustomerNotificationsRead(customerId: string, ids?: string[]) {
  const supabase = createServiceSupabaseClient();
  let query = supabase
    .from("customer_notifications")
    .update({ is_read: true })
    .eq("customer_id", customerId);

  if (ids?.length) {
    query = query.in("id", ids);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}

export async function createCustomerNotification(input: {
  customerId: string;
  title: string;
  body: string;
  type?: CustomerNotificationType;
  orderId?: string | null;
  shopOrderId?: string | null;
}) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("customer_notifications")
    .insert({
      customer_id: input.customerId,
      order_id: input.orderId ?? null,
      shop_order_id: input.shopOrderId ?? null,
      title: input.title,
      body: input.body,
      type: input.type ?? "general",
      is_read: false,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeCustomerNotificationRecord(data as Record<string, unknown>);
}

export async function createManualCustomerNotification(input: CustomerNotificationAdminSchema) {
  return createCustomerNotification({
    customerId: input.customer_id,
    title: input.title,
    body: input.body,
    type: "manual",
    shopOrderId: input.shop_order_id || null,
  });
}

export async function resolveCustomerIdForShopOrder(order: ShopOrderRecord) {
  if (order.customer_user_id) {
    return order.customer_user_id;
  }

  const byPhone = await findCustomerByPhone(order.phone);
  return byPhone?.customer.id ?? null;
}

export async function listDeliveryAgents() {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("delivery_agents").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => normalizeDeliveryAgentRecord(item as Record<string, unknown>));
}

export async function createDeliveryAgent(input: DeliveryAgentSchema) {
  const supabase = createServiceSupabaseClient();
  const password = input.password || Math.random().toString(36).slice(2, 10);
  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("delivery_agents")
    .insert({
      name: input.name,
      phone: input.phone,
      username: input.username,
      password_hash: passwordHash,
      is_active: input.is_active,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("اسم المستخدم مستخدم مسبقًا.");
    }

    throw new Error(error.message);
  }

  return {
    agent: normalizeDeliveryAgentRecord(data as Record<string, unknown>),
    generatedPassword: input.password ? null : password,
  };
}

export async function updateDeliveryAgent(agentId: string, input: DeliveryAgentSchema) {
  const supabase = createServiceSupabaseClient();
  const payload: Record<string, unknown> = {
    name: input.name,
    phone: input.phone,
    username: input.username,
    is_active: input.is_active,
  };

  if (input.password) {
    payload.password_hash = await bcrypt.hash(input.password, 10);
  }

  const { data, error } = await supabase
    .from("delivery_agents")
    .update(payload)
    .eq("id", agentId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeDeliveryAgentRecord(data as Record<string, unknown>);
}

export async function deleteDeliveryAgent(agentId: string) {
  const supabase = createServiceSupabaseClient();
  await supabase
    .from("shop_orders")
    .update({ assigned_driver_id: null, assigned_driver_name: "", assigned_at: null })
    .eq("assigned_driver_id", agentId);

  const { error } = await supabase.from("delivery_agents").delete().eq("id", agentId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function verifyDeliveryAgentCredentials(input: DeliveryAgentLoginSchema) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("delivery_agents")
    .select("*")
    .eq("username", input.username)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const passwordHash = String((data as Record<string, unknown>).password_hash ?? "");
  const valid = await bcrypt.compare(input.password, passwordHash);
  return valid ? normalizeDeliveryAgentRecord(data as Record<string, unknown>) : null;
}

export async function listDriverAssignedOrders(driverId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("shop_orders")
    .select("*")
    .eq("assigned_driver_id", driverId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateShopOrders((data ?? []) as Record<string, unknown>[]);
}

export async function getCustomerAccountDashboard(customerId: string) {
  const supabase = createServiceSupabaseClient();
  const customer = await getCustomerById(customerId);

  if (!customer) {
    throw new Error("الحساب غير موجود.");
  }

  const [addresses, favorites, notifications, shopOrderRows, bookingRows] = await Promise.all([
    listCustomerAddresses(customerId),
    listCustomerFavoriteProducts(customerId),
    listCustomerNotifications(customerId),
    supabase
      .from("shop_orders")
      .select("*")
      .or(`customer_user_id.eq.${customerId},phone.eq.${customer.phone}`)
      .order("created_at", { ascending: false }),
    supabase.from("orders").select("*").eq("phone", customer.phone).order("created_at", { ascending: false }),
  ]);

  if (shopOrderRows.error) {
    throw new Error(shopOrderRows.error.message);
  }

  if (bookingRows.error) {
    throw new Error(bookingRows.error.message);
  }

  const shopOrders = await hydrateShopOrders((shopOrderRows.data ?? []) as Record<string, unknown>[]);
  const bookingOrders = (bookingRows.data ?? []).map((item) => normalizeOrderRecord(item as Record<string, unknown>));

  return {
    customer,
    addresses,
    favorites,
    notifications,
    shopOrders,
    bookingOrders,
  };
}

export async function getShopAnalyticsSnapshot() {
  const supabase = createServiceSupabaseClient();
  const [shopOrdersRes, bookingOrdersRes, productsRes] = await Promise.all([
    supabase.from("shop_orders").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("*").order("sort_order", { ascending: true }),
  ]);

  if (shopOrdersRes.error) throw new Error(shopOrdersRes.error.message);
  if (bookingOrdersRes.error) throw new Error(bookingOrdersRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);

  const shopOrders = await hydrateShopOrders((shopOrdersRes.data ?? []) as Record<string, unknown>[]);
  const bookingOrders = (bookingOrdersRes.data ?? []).map((item) => normalizeOrderRecord(item as Record<string, unknown>));
  const products = (productsRes.data ?? []).map((item) => normalizeProductRecord(item as Record<string, unknown>));

  const today = new Date();
  const dayKey = today.toISOString().slice(0, 10);
  const monthKey = dayKey.slice(0, 7);
  const completedStatuses = new Set(["تم التسليم"]);
  const activeRevenueOrders = shopOrders.filter((order) => completedStatuses.has(order.status));

  const dailyRevenue = activeRevenueOrders
    .filter((order) => order.created_at.slice(0, 10) === dayKey)
    .reduce((sum, order) => sum + order.total, 0);
  const monthlyRevenue = activeRevenueOrders
    .filter((order) => order.created_at.slice(0, 7) === monthKey)
    .reduce((sum, order) => sum + order.total, 0);

  const topProductsMap = new Map<string, { product_id: string | null; product_name: string; quantity: number; total: number }>();
  shopOrders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.product_id || item.product_name;
      const current = topProductsMap.get(key) ?? {
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: 0,
        total: 0,
      };
      current.quantity += item.quantity;
      current.total += item.total;
      topProductsMap.set(key, current);
    });
  });

  const topProvincesMap = new Map<string, { province: string; count: number; total: number }>();
  shopOrders.forEach((order) => {
    const key = order.province || order.city || "غير محدد";
    const current = topProvincesMap.get(key) ?? { province: key, count: 0, total: 0 };
    current.count += 1;
    current.total += order.total;
    topProvincesMap.set(key, current);
  });

  return {
    totalShopOrders: shopOrders.length,
    totalBookings: bookingOrders.length,
    completedShopOrders: shopOrders.filter((order) => order.status === "تم التسليم").length,
    cancelledShopOrders: shopOrders.filter((order) => order.status === "ملغي").length,
    dailyRevenue,
    monthlyRevenue,
    topProducts: [...topProductsMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    topProvinces: [...topProvincesMap.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    outOfStockProducts: products.filter((item) => typeof item.stock_quantity === "number" && item.stock_quantity <= 0),
    recentShopOrders: shopOrders.slice(0, 6),
  };
}
