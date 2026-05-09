import { SHOP_DEFAULT_SETTINGS, SHOP_PAYMENT_METHOD_LABELS } from "@/lib/shop-constants";
import type {
  ProductRecord,
  ServiceCategoryRecord,
  ShopCategoryNode,
  ShopOrderItemRecord,
  ShopOrderRecord,
  ShopPaymentMethod,
  ShopSettingsRecord,
} from "@/lib/shop-types";
import {
  getLastFourDigits,
  normalizeArabicDigits,
  normalizePhone,
  normalizeWhatsAppPhone,
  parseAmountValue,
  stripTrailingSlash,
} from "@/lib/utils";

function normalizeShopText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
}

function normalizeInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(normalizeArabicDigits(value).replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function slugifyStoreText(value: string) {
  const normalized = normalizeArabicDigits(value)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || `item-${Date.now()}`;
}

export function normalizeServiceCategoryRecord(raw: Record<string, unknown>): ServiceCategoryRecord {
  return {
    id: normalizeShopText(raw.id),
    name: normalizeShopText(raw.name),
    slug: normalizeShopText(raw.slug),
    parent_id: normalizeShopText(raw.parent_id) || null,
    image_url: normalizeShopText(raw.image_url),
    is_active: normalizeBoolean(raw.is_active),
    sort_order: normalizeInteger(raw.sort_order),
    created_at: normalizeShopText(raw.created_at),
    updated_at: normalizeShopText(raw.updated_at),
  };
}

export function normalizeProductRecord(raw: Record<string, unknown>): ProductRecord {
  return {
    id: normalizeShopText(raw.id),
    category_id: normalizeShopText(raw.category_id),
    name: normalizeShopText(raw.name),
    description: normalizeShopText(raw.description),
    price: parseAmountValue(raw.price as string | number | null | undefined),
    image_url: normalizeShopText(raw.image_url),
    is_active: normalizeBoolean(raw.is_active),
    sort_order: normalizeInteger(raw.sort_order),
    created_at: normalizeShopText(raw.created_at),
    updated_at: normalizeShopText(raw.updated_at),
  };
}

export function normalizeShopSettingsRecord(raw: Record<string, unknown> | null | undefined): ShopSettingsRecord {
  return {
    id: normalizeShopText(raw?.id),
    mastercard_qr_url: normalizeShopText(raw?.mastercard_qr_url),
    wrapping_price: parseAmountValue(raw?.wrapping_price as string | number | null | undefined),
    delivery_fee: parseAmountValue(raw?.delivery_fee as string | number | null | undefined),
    delivery_time_text:
      normalizeShopText(raw?.delivery_time_text) || SHOP_DEFAULT_SETTINGS.delivery_time_text,
    updated_at: normalizeShopText(raw?.updated_at),
  };
}

export function normalizeShopOrderItemRecord(raw: Record<string, unknown>): ShopOrderItemRecord {
  return {
    id: normalizeShopText(raw.id),
    order_id: normalizeShopText(raw.order_id),
    product_id: normalizeShopText(raw.product_id) || null,
    product_name: normalizeShopText(raw.product_name),
    product_image: normalizeShopText(raw.product_image),
    quantity: Math.max(1, normalizeInteger(raw.quantity)),
    price: parseAmountValue(raw.price as string | number | null | undefined),
    total: parseAmountValue(raw.total as string | number | null | undefined),
    created_at: normalizeShopText(raw.created_at),
  };
}

export function normalizeShopOrderRecord(
  raw: Record<string, unknown>,
  items: ShopOrderItemRecord[] = [],
): ShopOrderRecord {
  return {
    id: normalizeShopText(raw.id),
    order_code: normalizeShopText(raw.order_code),
    phone_last4: normalizeShopText(raw.phone_last4) || getLastFourDigits(normalizeShopText(raw.phone)),
    customer_name: normalizeShopText(raw.customer_name),
    phone: normalizePhone(normalizeShopText(raw.phone)),
    city: normalizeShopText(raw.city),
    address: normalizeShopText(raw.address),
    driver_notes: normalizeShopText(raw.driver_notes),
    location_lat:
      raw.location_lat === null || raw.location_lat === undefined
        ? null
        : parseAmountValue(raw.location_lat as string | number | null | undefined),
    location_lng:
      raw.location_lng === null || raw.location_lng === undefined
        ? null
        : parseAmountValue(raw.location_lng as string | number | null | undefined),
    google_maps_url: normalizeShopText(raw.google_maps_url),
    payment_method:
      normalizeShopText(raw.payment_method) === "mastercard" ? "mastercard" : "cash",
    wrapping_enabled: normalizeBoolean(raw.wrapping_enabled),
    wrapping_price: parseAmountValue(raw.wrapping_price as string | number | null | undefined),
    delivery_fee: parseAmountValue(raw.delivery_fee as string | number | null | undefined),
    subtotal: parseAmountValue(raw.subtotal as string | number | null | undefined),
    total: parseAmountValue(raw.total as string | number | null | undefined),
    status: normalizeShopText(raw.status) as ShopOrderRecord["status"],
    print_status:
      normalizeShopText(raw.print_status) === "printed"
        ? "printed"
        : normalizeShopText(raw.print_status) === "failed"
          ? "failed"
          : "pending",
    printed_at: normalizeShopText(raw.printed_at) || null,
    print_attempts: Math.max(0, normalizeInteger(raw.print_attempts)),
    created_at: normalizeShopText(raw.created_at),
    updated_at: normalizeShopText(raw.updated_at),
    items,
  };
}

export function buildShopCategoryTree(
  categories: ServiceCategoryRecord[],
  products: ProductRecord[],
  activeOnly = false,
) {
  const filteredCategories = activeOnly ? categories.filter((item) => item.is_active) : categories;
  const filteredProducts = activeOnly ? products.filter((item) => item.is_active) : products;
  const byParent = new Map<string | null, ServiceCategoryRecord[]>();

  filteredCategories.forEach((category) => {
    const key = category.parent_id ?? null;
    const list = byParent.get(key) ?? [];
    list.push(category);
    byParent.set(key, list);
  });

  for (const list of byParent.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ar"));
  }

  const buildNode = (category: ServiceCategoryRecord): ShopCategoryNode => {
    const children = (byParent.get(category.id) ?? []).map(buildNode);
    const nodeProducts = filteredProducts
      .filter((item) => item.category_id === category.id)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ar"));

    return {
      ...category,
      children,
      products: nodeProducts,
    };
  };

  return (byParent.get(null) ?? []).map(buildNode);
}

export function findCategoryBySlug(
  categories: ShopCategoryNode[],
  slug?: string | null,
): ShopCategoryNode | null {
  if (!slug) {
    return null;
  }

  for (const category of categories) {
    if (category.slug === slug) {
      return category;
    }

    const found: ShopCategoryNode | null = findCategoryBySlug(category.children, slug);
    if (found) {
      return found;
    }
  }

  return null;
}

export function buildGoogleMapsUrl(lat?: number | null, lng?: number | null) {
  if (typeof lat !== "number" || typeof lng !== "number") {
    return "";
  }

  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function normalizeGoogleMapsUrl(url: string) {
  const trimmed = url.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.toString();
  } catch {
    return "";
  }
}

export function getShopPaymentMethodLabel(method: ShopPaymentMethod) {
  return SHOP_PAYMENT_METHOD_LABELS[method];
}

export function buildProductImageProxyUrl(imageUrl: string) {
  if (!imageUrl) {
    return "";
  }

  return `/api/media?src=${encodeURIComponent(imageUrl)}`;
}

export function getPublicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    return stripTrailingSlash(configured);
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return stripTrailingSlash(window.location.origin);
  }

  return "https://ali-jan1.vercel.app";
}

export function buildShopOrderTrackingLink(orderCode: string) {
  return `${getPublicSiteUrl()}/shop-track?code=${encodeURIComponent(orderCode)}`;
}

export function buildShopInvoiceLink(orderCode: string, autoPrint = false) {
  const suffix = autoPrint ? "?print=1" : "";
  return `${getPublicSiteUrl()}/shop-invoice/${encodeURIComponent(orderCode)}${suffix}`;
}

export function buildShopOrderWhatsAppUrl(order: ShopOrderRecord) {
  const number = normalizeWhatsAppPhone(order.phone);

  if (!number) {
    return null;
  }

  const trackingLink = buildShopOrderTrackingLink(order.order_code);
  const message = encodeURIComponent(
    `تم استلام طلبك

رقم التتبع: ${order.order_code}

${trackingLink}`,
  );

  return `https://wa.me/${number}?text=${message}`;
}

export function getShopOrderSearchableText(order: ShopOrderRecord) {
  return [
    order.order_code,
    order.phone_last4,
    order.customer_name,
    order.phone,
    order.city,
    order.address,
    order.driver_notes,
    order.status,
    order.payment_method,
    ...order.items.map((item) => item.product_name),
  ]
    .join(" ")
    .toLowerCase();
}
