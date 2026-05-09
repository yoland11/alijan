import { SHOP_DEFAULT_SETTINGS } from "@/lib/shop-constants";
import type {
  ProductRecord,
  ServiceCategoryRecord,
  ShopCatalogPayload,
  ShopOrderItemRecord,
  ShopOrderRecord,
  ShopSettingsRecord,
} from "@/lib/shop-types";
import {
  buildShopCategoryTree,
  normalizeProductRecord,
  normalizeServiceCategoryRecord,
  normalizeShopOrderItemRecord,
  normalizeShopOrderRecord,
  normalizeShopSettingsRecord,
} from "@/lib/shop-utils";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getLastFourDigits, normalizeTrackingQuery } from "@/lib/utils";
import type {
  CheckoutOrderSchema,
  ShopOrderAdminUpdateSchema,
  ProductSchema,
  ServiceCategorySchema,
  ShopOrderStatusSchema,
  ShopSettingsSchema,
} from "@/lib/shop-validators";

async function hydrateShopOrders(ordersData: Record<string, unknown>[]) {
  const supabase = createServiceSupabaseClient();
  const orderIds = ordersData.map((item) => String(item.id ?? ""));
  let itemsByOrder = new Map<string, ShopOrderItemRecord[]>();

  if (orderIds.length) {
    const { data: itemsData, error: itemsError } = await supabase
      .from("shop_order_items")
      .select("*")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    itemsByOrder = (itemsData ?? []).reduce((map, item) => {
      const normalized = normalizeShopOrderItemRecord(item as Record<string, unknown>);
      const list = map.get(normalized.order_id) ?? [];
      list.push(normalized);
      map.set(normalized.order_id, list);
      return map;
    }, new Map<string, ShopOrderItemRecord[]>());
  }

  return ordersData.map((raw) => {
    const id = String(raw.id ?? "");
    return normalizeShopOrderRecord(raw, itemsByOrder.get(id) ?? []);
  });
}

async function generateUniqueShopOrderCode(phoneLast4: string) {
  const supabase = createServiceSupabaseClient();
  const baseCode = `AJN-${phoneLast4}`;
  const { data, error } = await supabase
    .from("shop_orders")
    .select("order_code")
    .like("order_code", `${baseCode}%`);

  if (error) {
    throw new Error(error.message);
  }

  const existingCodes = new Set(
    (data ?? [])
      .map((item) => String((item as Record<string, unknown>).order_code ?? ""))
      .filter(Boolean),
  );

  if (!existingCodes.has(baseCode)) {
    return baseCode;
  }

  let suffix = 2;
  while (existingCodes.has(`${baseCode}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseCode}-${suffix}`;
}

async function fetchCategories(activeOnly = false) {
  const supabase = createServiceSupabaseClient();
  let query = supabase.from("service_categories").select("*").order("sort_order", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => normalizeServiceCategoryRecord(item as Record<string, unknown>));
}

async function fetchProducts(activeOnly = false) {
  const supabase = createServiceSupabaseClient();
  let query = supabase.from("products").select("*").order("sort_order", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => normalizeProductRecord(item as Record<string, unknown>));
}

export async function getOrCreateShopSettings() {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("settings").select("*").order("updated_at", { ascending: false }).limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const first = data?.[0];

  if (first) {
    return normalizeShopSettingsRecord(first as Record<string, unknown>);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("settings")
    .insert({
      ...SHOP_DEFAULT_SETTINGS,
    })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return normalizeShopSettingsRecord(inserted as Record<string, unknown>);
}

export async function listShopCatalog(): Promise<ShopCatalogPayload> {
  const [categories, products, settings] = await Promise.all([
    fetchCategories(true),
    fetchProducts(true),
    getOrCreateShopSettings(),
  ]);

  return {
    categories: buildShopCategoryTree(categories, products, true),
    settings,
  };
}

export async function listAdminCatalog() {
  const [categories, products, settings] = await Promise.all([
    fetchCategories(false),
    fetchProducts(false),
    getOrCreateShopSettings(),
  ]);

  return {
    categories,
    products,
    settings,
  };
}

export async function createServiceCategory(input: ServiceCategorySchema) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("service_categories")
    .insert({
      ...input,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeServiceCategoryRecord(data as Record<string, unknown>);
}

export async function updateServiceCategory(id: string, input: ServiceCategorySchema) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("service_categories")
    .update({
      ...input,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeServiceCategoryRecord(data as Record<string, unknown>);
}

export async function deleteServiceCategory(id: string) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("service_categories").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createProduct(input: ProductSchema) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      ...input,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeProductRecord(data as Record<string, unknown>);
}

export async function updateProduct(id: string, input: ProductSchema) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      ...input,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeProductRecord(data as Record<string, unknown>);
}

export async function deleteProduct(id: string) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateShopSettings(input: ShopSettingsSchema) {
  const supabase = createServiceSupabaseClient();
  const current = await getOrCreateShopSettings();
  const { data, error } = await supabase
    .from("settings")
    .update({
      ...input,
    })
    .eq("id", current.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeShopSettingsRecord(data as Record<string, unknown>);
}

export async function listShopOrders() {
  const supabase = createServiceSupabaseClient();
  const { data: ordersData, error: ordersError } = await supabase
    .from("shop_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  return hydrateShopOrders((ordersData ?? []) as Record<string, unknown>[]);
}

export async function getShopOrderByCode(orderCode: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("shop_orders")
    .select("*")
    .eq("order_code", orderCode)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [order] = await hydrateShopOrders([data as Record<string, unknown>]);
  return order ?? null;
}

export async function searchShopOrders(query: string) {
  const normalized = normalizeTrackingQuery(query);

  if (!normalized) {
    return [];
  }

  const supabase = createServiceSupabaseClient();
  let search = supabase.from("shop_orders").select("*").order("created_at", { ascending: false });

  if (normalized.startsWith("AJN-")) {
    search = search.eq("order_code", normalized);
  } else {
    search = search.eq("phone_last4", normalized);
  }

  const { data, error } = await search;

  if (error) {
    throw new Error(error.message);
  }

  return hydrateShopOrders((data ?? []) as Record<string, unknown>[]);
}

export async function updateShopOrderStatus(id: string, input: ShopOrderStatusSchema) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("shop_orders")
    .update({
      status: input.status,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from("shop_order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const items = (itemsData ?? []).map((item) => normalizeShopOrderItemRecord(item as Record<string, unknown>));
  return normalizeShopOrderRecord(data as Record<string, unknown>, items);
}

export async function updateShopOrderAdminState(id: string, input: ShopOrderAdminUpdateSchema) {
  const supabase = createServiceSupabaseClient();
  const existing = await getShopOrderById(id);

  if (!existing) {
    throw new Error("الطلب غير موجود.");
  }

  const nextAttempts = input.increment_print_attempts
    ? existing.print_attempts + 1
    : existing.print_attempts;

  const payload: Record<string, unknown> = {
    print_attempts: nextAttempts,
  };

  if (input.status !== undefined) {
    payload.status = input.status;
  }

  if (input.print_status !== undefined) {
    payload.print_status = input.print_status;
  }

  if (input.reset_printed_at) {
    payload.printed_at = null;
  } else if (input.printed_at !== undefined) {
    payload.printed_at = input.printed_at;
  }

  const { data, error } = await supabase
    .from("shop_orders")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from("shop_order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const items = (itemsData ?? []).map((item) => normalizeShopOrderItemRecord(item as Record<string, unknown>));
  return normalizeShopOrderRecord(data as Record<string, unknown>, items);
}

export async function deleteShopOrder(id: string) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("shop_orders").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createShopOrder(input: CheckoutOrderSchema) {
  const supabase = createServiceSupabaseClient();
  const settings = await getOrCreateShopSettings();
  const phoneLast4 = getLastFourDigits(input.phone);
  const productIds = input.items.map((item) => item.product_id);
  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("is_active", true);

  if (productsError) {
    throw new Error(productsError.message);
  }

  const products = (productsData ?? []).map((item) => normalizeProductRecord(item as Record<string, unknown>));
  const productMap = new Map(products.map((item) => [item.id, item]));

  const itemsPayload = input.items.map((item) => {
    const product = productMap.get(item.product_id);

    if (!product) {
      throw new Error("أحد المنتجات لم يعد متاحًا.");
    }

    const quantity = Math.max(1, item.quantity);
    const total = product.price * quantity;

    return {
      product,
      quantity,
      total,
    };
  });

  const subtotal = itemsPayload.reduce((sum, item) => sum + item.total, 0);
  const wrappingPrice = input.wrapping_enabled ? settings.wrapping_price : 0;
  const deliveryFee = settings.delivery_fee;
  const total = subtotal + wrappingPrice + deliveryFee;
  let orderData: Record<string, unknown> | null = null;
  let orderId = "";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderCode = await generateUniqueShopOrderCode(phoneLast4);
    const { data, error } = await supabase
      .from("shop_orders")
      .insert({
        order_code: orderCode,
        phone_last4: phoneLast4,
        customer_name: input.customer_name,
        phone: input.phone,
        city: input.city,
        address: input.address,
        driver_notes: input.driver_notes,
        location_lat: input.location_lat,
        location_lng: input.location_lng,
        google_maps_url: input.google_maps_url,
        payment_method: input.payment_method,
        wrapping_enabled: input.wrapping_enabled,
        wrapping_price: wrappingPrice,
        delivery_fee: deliveryFee,
      subtotal,
      total,
      status: "طلب جديد",
      print_status: "pending",
      printed_at: null,
      print_attempts: 0,
    })
    .select("*")
    .single();

    if (!error) {
      orderData = data as Record<string, unknown>;
      orderId = String((orderData as Record<string, unknown>).id ?? "");
      break;
    }

    if (error.code === "23505" && attempt < 4) {
      continue;
    }

    throw new Error(error.message);
  }

  if (!orderData || !orderId) {
    throw new Error("تعذر إنشاء الطلب.");
  }
  const { data: itemsData, error: itemsError } = await supabase
    .from("shop_order_items")
    .insert(
      itemsPayload.map((item) => ({
        order_id: orderId,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image_url,
        quantity: item.quantity,
        price: item.product.price,
        total: item.total,
      })),
    )
    .select("*");

  if (itemsError) {
    await supabase.from("shop_orders").delete().eq("id", orderId);
    throw new Error(itemsError.message);
  }

  const normalizedItems = (itemsData ?? []).map((item) =>
    normalizeShopOrderItemRecord(item as Record<string, unknown>),
  );

  return normalizeShopOrderRecord(orderData, normalizedItems);
}

async function getShopOrderById(id: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("shop_orders")
    .select("*")
    .eq("id", id)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return normalizeShopOrderRecord(data as Record<string, unknown>);
}
