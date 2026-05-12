import {
  PORTFOLIO_CATEGORIES,
  SHOP_CUSTOMIZATION_FIELDS,
  SHOP_DEFAULT_DELIVERY_REGIONS,
  SHOP_DEFAULT_SETTINGS,
  SHOP_PAYMENT_METHOD_LABELS,
  SHOP_PRODUCT_COLOR_LIBRARY,
  SHOP_PRODUCT_IMAGE_FITS,
  SHOP_PRODUCT_IMAGE_POSITIONS,
} from "@/lib/shop-constants";
import type {
  CustomerAddressRecord,
  CustomerNotificationRecord,
  CustomerUserRecord,
  DeliveryRegionConfig,
  DeliveryAgentRecord,
  PortfolioCategory,
  PortfolioEntryRecord,
  ProductColorOption,
  ProductCustomizationOptions,
  ProductCustomizationPayload,
  ProductImageFit,
  ProductImagePosition,
  ProductPreviewImage,
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
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(normalizeArabicDigits(value).replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeRequiredInteger(value: unknown, fallback = 0) {
  return normalizeInteger(value) ?? fallback;
}

function normalizeHexColor(value: unknown) {
  const normalized = normalizeShopText(value).replace(/[^#a-fA-F0-9]/g, "");

  if (!normalized) {
    return "";
  }

  const withHash = normalized.startsWith("#") ? normalized : `#${normalized}`;
  const candidate = withHash.toUpperCase();

  if (/^#[0-9A-F]{6}$/.test(candidate) || /^#[0-9A-F]{3}$/.test(candidate)) {
    return candidate;
  }

  return "";
}

export function getShopProductColorByHex(value: unknown): ProductColorOption | null {
  const normalized = normalizeHexColor(value);

  if (!normalized) {
    return null;
  }

  const match = SHOP_PRODUCT_COLOR_LIBRARY.find((item) => item.color_hex === normalized);
  return match ? { ...match } : null;
}

export function getShopProductColorByName(value: unknown): ProductColorOption | null {
  const normalized = normalizeShopText(value);

  if (!normalized) {
    return null;
  }

  const match = SHOP_PRODUCT_COLOR_LIBRARY.find((item) => item.color_name === normalized);
  return match ? { ...match } : null;
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
    thumbnail_url: normalizeShopText(raw.thumbnail_url),
    is_active: normalizeBoolean(raw.is_active),
    sort_order: normalizeRequiredInteger(raw.sort_order),
    created_at: normalizeShopText(raw.created_at),
    updated_at: normalizeShopText(raw.updated_at),
  };
}

export function normalizeProductCustomizationOptions(value: unknown): ProductCustomizationOptions {
  const raw = (value ?? {}) as Record<string, unknown>;

  return {
    enable_name: normalizeBoolean(raw.enable_name),
    enable_message: normalizeBoolean(raw.enable_message),
    enable_wrapping_note: normalizeBoolean(raw.enable_wrapping_note),
    enable_special_color: normalizeBoolean(raw.enable_special_color),
    enable_occasion_date: normalizeBoolean(raw.enable_occasion_date),
    enable_customer_image: normalizeBoolean(raw.enable_customer_image),
  };
}

export function normalizeProductCustomizationPayload(
  value: unknown,
  options?: ProductCustomizationOptions,
): ProductCustomizationPayload {
  const raw = (value ?? {}) as Record<string, unknown>;
  const normalized: ProductCustomizationPayload = {
    custom_name: normalizeShopText(raw.custom_name),
    gift_message: normalizeShopText(raw.gift_message),
    wrapping_note: normalizeShopText(raw.wrapping_note),
    special_color: normalizeShopText(raw.special_color),
    occasion_date: normalizeShopText(raw.occasion_date),
    customer_image_url: normalizeShopText(raw.customer_image_url),
  };

  if (!options) {
    return normalized;
  }

  return {
    custom_name: options.enable_name ? normalized.custom_name : "",
    gift_message: options.enable_message ? normalized.gift_message : "",
    wrapping_note: options.enable_wrapping_note ? normalized.wrapping_note : "",
    special_color: options.enable_special_color ? normalized.special_color : "",
    occasion_date: options.enable_occasion_date ? normalized.occasion_date : "",
    customer_image_url: options.enable_customer_image ? normalized.customer_image_url : "",
  };
}

export function hasProductCustomizationOptions(value: ProductCustomizationOptions) {
  return Object.values(value).some(Boolean);
}

export function getCustomizationSummaryEntries(value: ProductCustomizationPayload) {
  const entries: { label: string; value: string }[] = [];

  if (value.custom_name) {
    entries.push({ label: "الاسم", value: value.custom_name });
  }
  if (value.gift_message) {
    entries.push({ label: "الرسالة", value: value.gift_message });
  }
  if (value.wrapping_note) {
    entries.push({ label: "ملاحظة التغليف", value: value.wrapping_note });
  }
  if (value.special_color) {
    entries.push({ label: "اللون الخاص", value: value.special_color });
  }
  if (value.occasion_date) {
    entries.push({ label: "التاريخ", value: value.occasion_date });
  }
  if (value.customer_image_url) {
    entries.push({ label: "صورة مرفوعة", value: "مرفقة" });
  }

  return entries;
}

export function normalizeProductRecord(raw: Record<string, unknown>): ProductRecord {
  return {
    id: normalizeShopText(raw.id),
    category_id: normalizeShopText(raw.category_id),
    name: normalizeShopText(raw.name),
    description: normalizeShopText(raw.description),
    price: parseAmountValue(raw.price as string | number | null | undefined),
    image_url: normalizeShopText(raw.image_url),
    thumbnail_url: normalizeShopText(raw.thumbnail_url),
    image_fit: normalizeProductImageFit(raw.image_fit),
    image_position: normalizeProductImagePosition(raw.image_position),
    image_zoom: normalizeProductImageZoom(raw.image_zoom),
    color_options: normalizeProductColorOptions(raw.color_options),
    preview_images: normalizeProductPreviewImages(raw.preview_images),
    video_url: normalizeShopText(raw.video_url),
    stock_quantity: normalizeInteger(raw.stock_quantity),
    customization_options: normalizeProductCustomizationOptions(raw.customization_options),
    is_active: normalizeBoolean(raw.is_active),
    sort_order: normalizeRequiredInteger(raw.sort_order),
    created_at: normalizeShopText(raw.created_at),
    updated_at: normalizeShopText(raw.updated_at),
  };
}

export function normalizeDeliveryRegions(value: unknown): DeliveryRegionConfig[] {
  const source = Array.isArray(value) && value.length ? value : SHOP_DEFAULT_DELIVERY_REGIONS;

  return source
    .map((item, index) => {
      const raw = (item ?? {}) as Record<string, unknown>;
      const province = normalizeShopText(raw.province);

      if (!province) {
        return null;
      }

      return {
        id: normalizeShopText(raw.id) || slugifyStoreText(province),
        province,
        fee: parseAmountValue(raw.fee as string | number | null | undefined),
        eta_text: normalizeShopText(raw.eta_text) || "حسب المنطقة",
        delivery_type: normalizeShopText(raw.delivery_type) || "توصيل",
        sort_order: normalizeRequiredInteger(raw.sort_order, index),
        is_active: raw.is_active === undefined ? true : normalizeBoolean(raw.is_active),
      };
    })
    .filter((item): item is DeliveryRegionConfig => Boolean(item))
    .sort((a, b) => a.sort_order - b.sort_order || a.province.localeCompare(b.province, "ar"));
}

export function getDeliveryRegionByProvince(
  regions: DeliveryRegionConfig[],
  province: string,
): DeliveryRegionConfig | null {
  const normalized = normalizeShopText(province);
  if (!normalized) {
    return null;
  }

  const activeRegions = regions.filter((item) => item.is_active);
  return (
    activeRegions.find((item) => item.province === normalized) ??
    activeRegions.find((item) => item.province === "باقي المحافظات") ??
    null
  );
}

export function normalizeShopSettingsRecord(raw: Record<string, unknown> | null | undefined): ShopSettingsRecord {
  return {
    id: normalizeShopText(raw?.id),
    mastercard_qr_url: normalizeShopText(raw?.mastercard_qr_url),
    wrapping_price: parseAmountValue(raw?.wrapping_price as string | number | null | undefined),
    delivery_fee: parseAmountValue(raw?.delivery_fee as string | number | null | undefined),
    delivery_time_text:
      normalizeShopText(raw?.delivery_time_text) || SHOP_DEFAULT_SETTINGS.delivery_time_text,
    delivery_regions: normalizeDeliveryRegions(raw?.delivery_regions),
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
    selected_color_name: normalizeShopText(raw.selected_color_name),
    selected_color_hex: normalizeHexColor(raw.selected_color_hex),
    customization: normalizeProductCustomizationPayload(raw.customization),
    quantity: Math.max(1, normalizeRequiredInteger(raw.quantity, 1)),
    price: parseAmountValue(raw.price as string | number | null | undefined),
    total: parseAmountValue(raw.total as string | number | null | undefined),
    created_at: normalizeShopText(raw.created_at),
  };
}

export function normalizePortfolioEntryRecord(raw: Record<string, unknown>): PortfolioEntryRecord {
  const category = normalizeShopText(raw.category) as PortfolioCategory;
  const mediaType = normalizeShopText(raw.media_type) === "video" ? "video" : "image";

  return {
    id: normalizeShopText(raw.id),
    title: normalizeShopText(raw.title),
    category: PORTFOLIO_CATEGORIES.includes(category) ? category : PORTFOLIO_CATEGORIES[0],
    media_type: mediaType,
    media_url: normalizeShopText(raw.media_url),
    thumbnail_url: normalizeShopText(raw.thumbnail_url),
    is_active: normalizeBoolean(raw.is_active),
    sort_order: normalizeRequiredInteger(raw.sort_order),
    created_at: normalizeShopText(raw.created_at),
    updated_at: normalizeShopText(raw.updated_at),
  };
}

export function normalizeProductColorOptions(value: unknown): ProductColorOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const raw = (item ?? {}) as Record<string, unknown>;
      return getShopProductColorByHex(raw.color_hex) ?? getShopProductColorByName(raw.color_name);
    })
    .filter((item): item is ProductColorOption => Boolean(item))
    .filter((item, index, array) => array.findIndex((entry) => entry.id === item.id) === index)
    .sort((a, b) => a.sort_order - b.sort_order || a.color_name.localeCompare(b.color_name, "ar"));
}

export function normalizeProductPreviewImages(value: unknown): ProductPreviewImage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .map((item, index) => {
      const raw = (item ?? {}) as Record<string, unknown>;
      const url = normalizeShopText(raw.url);

      if (!url) {
        return null;
      }

      return {
        id: normalizeShopText(raw.id) || crypto.randomUUID(),
        url,
        thumbnail_url: normalizeShopText(raw.thumbnail_url) || url,
        sort_order: normalizeRequiredInteger(raw.sort_order, index),
        is_primary: normalizeBoolean(raw.is_primary),
      };
    })
    .filter((item): item is ProductPreviewImage => Boolean(item))
    .sort((a, b) => a.sort_order - b.sort_order);

  if (!normalized.length) {
    return [];
  }

  const hasPrimary = normalized.some((item) => item.is_primary);
  return normalized.map((item, index) => ({
    ...item,
    is_primary: hasPrimary ? item.is_primary : index === 0,
  }));
}

export function normalizeShopOrderRecord(
  raw: Record<string, unknown>,
  items: ShopOrderItemRecord[] = [],
): ShopOrderRecord {
  return {
    id: normalizeShopText(raw.id),
    order_code: normalizeShopText(raw.order_code),
    phone_last4: normalizeShopText(raw.phone_last4) || getLastFourDigits(normalizeShopText(raw.phone)),
    customer_user_id: normalizeShopText(raw.customer_user_id) || null,
    customer_name: normalizeShopText(raw.customer_name),
    phone: normalizePhone(normalizeShopText(raw.phone)),
    city: normalizeShopText(raw.city),
    province: normalizeShopText(raw.province) || normalizeShopText(raw.city),
    district: normalizeShopText(raw.district),
    address: normalizeShopText(raw.address),
    delivery_type: normalizeShopText(raw.delivery_type),
    delivery_eta: normalizeShopText(raw.delivery_eta),
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
    stock_restored: normalizeBoolean(raw.stock_restored),
    assigned_driver_id: normalizeShopText(raw.assigned_driver_id) || null,
    assigned_driver_name: normalizeShopText(raw.assigned_driver_name),
    assigned_at: normalizeShopText(raw.assigned_at) || null,
    print_status:
      normalizeShopText(raw.print_status) === "printed"
        ? "printed"
        : normalizeShopText(raw.print_status) === "failed"
          ? "failed"
          : "pending",
    printed_at: normalizeShopText(raw.printed_at) || null,
    print_attempts: Math.max(0, normalizeRequiredInteger(raw.print_attempts)),
    created_at: normalizeShopText(raw.created_at),
    updated_at: normalizeShopText(raw.updated_at),
    items,
  };
}

export function normalizeCustomerUserRecord(raw: Record<string, unknown>): CustomerUserRecord {
  return {
    id: normalizeShopText(raw.id),
    full_name: normalizeShopText(raw.full_name),
    email: normalizeShopText(raw.email),
    phone: normalizePhone(normalizeShopText(raw.phone)),
    created_at: normalizeShopText(raw.created_at),
    updated_at: normalizeShopText(raw.updated_at),
  };
}

export function normalizeCustomerAddressRecord(raw: Record<string, unknown>): CustomerAddressRecord {
  return {
    id: normalizeShopText(raw.id),
    customer_id: normalizeShopText(raw.customer_id),
    label: normalizeShopText(raw.label),
    province: normalizeShopText(raw.province),
    district: normalizeShopText(raw.district),
    address: normalizeShopText(raw.address),
    phone: normalizePhone(normalizeShopText(raw.phone)),
    location_lat:
      raw.location_lat === null || raw.location_lat === undefined
        ? null
        : parseAmountValue(raw.location_lat as string | number | null | undefined),
    location_lng:
      raw.location_lng === null || raw.location_lng === undefined
        ? null
        : parseAmountValue(raw.location_lng as string | number | null | undefined),
    google_maps_url: normalizeShopText(raw.google_maps_url),
    is_default: normalizeBoolean(raw.is_default),
    created_at: normalizeShopText(raw.created_at),
    updated_at: normalizeShopText(raw.updated_at),
  };
}

export function normalizeCustomerNotificationRecord(raw: Record<string, unknown>): CustomerNotificationRecord {
  const type = normalizeShopText(raw.type) as CustomerNotificationRecord["type"];
  return {
    id: normalizeShopText(raw.id),
    customer_id: normalizeShopText(raw.customer_id),
    order_id: normalizeShopText(raw.order_id) || null,
    shop_order_id: normalizeShopText(raw.shop_order_id) || null,
    title: normalizeShopText(raw.title),
    body: normalizeShopText(raw.body),
    type: type || "general",
    is_read: normalizeBoolean(raw.is_read),
    created_at: normalizeShopText(raw.created_at),
  };
}

export function normalizeDeliveryAgentRecord(raw: Record<string, unknown>): DeliveryAgentRecord {
  return {
    id: normalizeShopText(raw.id),
    name: normalizeShopText(raw.name),
    phone: normalizePhone(normalizeShopText(raw.phone)),
    username: normalizeShopText(raw.username),
    is_active: normalizeBoolean(raw.is_active),
    created_at: normalizeShopText(raw.created_at),
    updated_at: normalizeShopText(raw.updated_at),
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

export function getPrimaryPreviewImage(product: {
  image_url?: string;
  thumbnail_url?: string;
  preview_images?: ProductPreviewImage[];
}) {
  const previewImages = normalizeProductPreviewImages(product.preview_images);
  const primary = previewImages.find((item) => item.is_primary) ?? previewImages[0] ?? null;

  if (primary) {
    return primary;
  }

  const fallbackUrl = normalizeShopText(product.image_url);

  if (!fallbackUrl) {
    return null;
  }

  return {
    id: "primary",
    url: fallbackUrl,
    thumbnail_url: normalizeShopText(product.thumbnail_url) || fallbackUrl,
    sort_order: 0,
    is_primary: true,
  } satisfies ProductPreviewImage;
}

export function normalizeProductImageFit(value: unknown): ProductImageFit {
  const normalized = normalizeShopText(value);

  if (SHOP_PRODUCT_IMAGE_FITS.includes(normalized as ProductImageFit)) {
    return normalized as ProductImageFit;
  }

  return "contain";
}

export function normalizeProductImagePosition(value: unknown): ProductImagePosition {
  const normalized = normalizeShopText(value);

  if (SHOP_PRODUCT_IMAGE_POSITIONS.includes(normalized as ProductImagePosition)) {
    return normalized as ProductImagePosition;
  }

  return "center center";
}

export function normalizeProductImageZoom(value: unknown) {
  const parsed = parseAmountValue(value as string | number | null | undefined);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }

  return Math.min(2.5, Math.max(0.5, parsed));
}

export function getProductImagePresentation(product: {
  image_fit?: unknown;
  image_position?: unknown;
  image_zoom?: unknown;
}) {
  const fit = normalizeProductImageFit(product.image_fit);
  const position = normalizeProductImagePosition(product.image_position);
  const zoom = normalizeProductImageZoom(product.image_zoom);

  return {
    fit,
    position,
    zoom,
    objectFit: fit === "contain" ? "contain" : "cover",
    objectPosition: position,
    transform: `scale(${zoom})`,
    transformOrigin: position,
  } as const;
}

export function isProductSoldOut(product: { stock_quantity?: number | null }) {
  return typeof product.stock_quantity === "number" && product.stock_quantity <= 0;
}

export function getProductStockLabel(product: { stock_quantity?: number | null }) {
  if (isProductSoldOut(product)) {
    return "نفذت الكمية";
  }

  if (typeof product.stock_quantity === "number") {
    return `${product.stock_quantity} متوفر`;
  }

  return "متوفر";
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

export function buildShopCartItemKey(
  productId: string,
  selectedColorHex = "",
  selectedColorName = "",
  customization?: ProductCustomizationPayload,
) {
  const suffix = selectedColorHex || selectedColorName || "default";
  const customizationSignature = customization
    ? [
        customization.custom_name,
        customization.gift_message,
        customization.wrapping_note,
        customization.special_color,
        customization.occasion_date,
        customization.customer_image_url,
      ]
        .filter(Boolean)
        .join("|")
    : "";

  return `${productId}::${suffix}::${customizationSignature || "plain"}`;
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
    order.province,
    order.district,
    order.address,
    order.driver_notes,
    order.status,
    order.payment_method,
    ...order.items.map((item) => item.product_name),
  ]
    .join(" ")
    .toLowerCase();
}

export function isDirectVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export function getVideoEmbedUrl(url: string) {
  if (!url) {
    return "";
  }

  if (isDirectVideoUrl(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace(/\//g, "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (parsed.hostname.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean).pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }

    return url;
  } catch {
    return url;
  }
}

export function getPortfolioCategories() {
  return [...PORTFOLIO_CATEGORIES];
}

export function getCustomizationFieldDefinitions() {
  return [...SHOP_CUSTOMIZATION_FIELDS];
}
