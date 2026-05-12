import { z } from "zod";

import {
  PORTFOLIO_CATEGORIES,
  SHOP_DEFAULT_SETTINGS,
  SHOP_ORDER_STATUSES,
  SHOP_PAYMENT_METHODS,
  SHOP_PRODUCT_COLOR_LIBRARY,
  SHOP_PRODUCT_IMAGE_FITS,
  SHOP_PRODUCT_IMAGE_POSITIONS,
} from "@/lib/shop-constants";
import {
  buildGoogleMapsUrl,
  getShopProductColorByHex,
  getShopProductColorByName,
  normalizeGoogleMapsUrl,
  normalizeProductCustomizationOptions,
  normalizeProductCustomizationPayload,
  normalizeProductPreviewImages,
  slugifyStoreText,
} from "@/lib/shop-utils";
import { normalizeArabicDigits, normalizePhone, parseAmountValue } from "@/lib/utils";

const textField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : ""));

const requiredTextField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : ""))
  .refine((value) => value.length > 0, "هذا الحقل مطلوب.");

const amountField = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => parseAmountValue(value))
  .refine((value) => value >= 0, "يرجى إدخال مبلغ صحيح.");

const nullableIntegerField = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : null;
    }

    const parsed = Number.parseInt(normalizeArabicDigits(value).replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
  });

const sortOrderField = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? Math.trunc(value) : 0;
    }

    if (typeof value === "string") {
      const parsed = Number.parseInt(normalizeArabicDigits(value).replace(/[^\d-]/g, ""), 10);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  });

const booleanField = z
  .union([z.boolean(), z.string(), z.number(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      return ["true", "1", "yes", "on"].includes(value.toLowerCase());
    }

    return value === 1;
  });

const emailField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
  .refine((value) => /\S+@\S+\.\S+/.test(value), "البريد الإلكتروني غير صالح.");

const passwordField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : ""))
  .refine((value) => value.length >= 6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل.");

const imageFitField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : "contain"))
  .transform((value) =>
    SHOP_PRODUCT_IMAGE_FITS.includes(value as (typeof SHOP_PRODUCT_IMAGE_FITS)[number])
      ? (value as (typeof SHOP_PRODUCT_IMAGE_FITS)[number])
      : "contain",
  );

const imagePositionField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : "center center"))
  .transform((value) =>
    SHOP_PRODUCT_IMAGE_POSITIONS.includes(value as (typeof SHOP_PRODUCT_IMAGE_POSITIONS)[number])
      ? (value as (typeof SHOP_PRODUCT_IMAGE_POSITIONS)[number])
      : "center center",
  );

const imageZoomField = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === "") {
      return 1;
    }

    const parsed = parseAmountValue(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 1;
    }

    return Math.min(2.5, Math.max(0.5, parsed));
  });

const colorHexField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : ""))
  .transform((value) => {
    if (!value) {
      return "";
    }

    const normalized = value.startsWith("#") ? value : `#${value}`;
    const upper = normalized.toUpperCase();
    return /^#[0-9A-F]{6}$/.test(upper) || /^#[0-9A-F]{3}$/.test(upper) ? upper : "";
  });

const productColorOptionSchema = z.object({
  id: textField,
  color_name: textField,
  color_hex: colorHexField,
  sort_order: sortOrderField.default(0),
});

const previewImageSchema = z.object({
  id: textField,
  url: textField,
  thumbnail_url: textField,
  sort_order: sortOrderField.default(0),
  is_primary: booleanField.default(false),
});

const deliveryRegionSchema = z.object({
  id: textField,
  province: requiredTextField,
  fee: amountField.default(0),
  eta_text: requiredTextField,
  delivery_type: requiredTextField,
  sort_order: sortOrderField.default(0),
  is_active: booleanField.default(true),
});

const customizationOptionsSchema = z.object({
  enable_name: booleanField.default(false),
  enable_message: booleanField.default(false),
  enable_wrapping_note: booleanField.default(false),
  enable_special_color: booleanField.default(false),
  enable_occasion_date: booleanField.default(false),
  enable_customer_image: booleanField.default(false),
});

const customizationPayloadSchema = z.object({
  custom_name: textField,
  gift_message: textField,
  wrapping_note: textField,
  special_color: textField,
  occasion_date: textField,
  customer_image_url: textField,
});

export const serviceCategorySchema = z
  .object({
    name: z.string().min(1, "اسم القسم مطلوب."),
    slug: textField,
    parent_id: textField,
    image_url: textField,
    thumbnail_url: textField,
    is_active: booleanField.default(true),
    sort_order: sortOrderField.default(0),
  })
  .transform((value) => ({
    ...value,
    slug: value.slug || slugifyStoreText(value.name),
    parent_id: value.parent_id || null,
    thumbnail_url: value.thumbnail_url || value.image_url || "",
  }));

export const productSchema = z
  .object({
    category_id: z.string().min(1, "يرجى اختيار القسم."),
    name: z.string().min(1, "اسم المنتج مطلوب."),
    description: textField,
    price: amountField,
    image_url: textField,
    thumbnail_url: textField,
    image_fit: imageFitField.default("contain"),
    image_position: imagePositionField.default("center center"),
    image_zoom: imageZoomField.default(1),
    color_options: z.array(productColorOptionSchema).optional().default([]),
    preview_images: z.array(previewImageSchema).optional().default([]),
    video_url: textField,
    stock_quantity: nullableIntegerField,
    customization_options: customizationOptionsSchema.optional().default({
      enable_name: false,
      enable_message: false,
      enable_wrapping_note: false,
      enable_special_color: false,
      enable_occasion_date: false,
      enable_customer_image: false,
    }),
    is_active: booleanField.default(true),
    sort_order: sortOrderField.default(0),
  })
  .transform((value) => ({
    ...value,
    thumbnail_url: value.thumbnail_url || value.image_url || "",
    color_options: value.color_options
      .map((item) => getShopProductColorByHex(item.color_hex) ?? getShopProductColorByName(item.color_name))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter((item, index, array) => array.findIndex((entry) => entry.id === item.id) === index)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item, index) => ({
        id: item.id,
        color_name: item.color_name,
        color_hex: item.color_hex,
        sort_order: index,
      })),
    preview_images: normalizeProductPreviewImages(value.preview_images),
    customization_options: normalizeProductCustomizationOptions(value.customization_options),
  }));

export const shopSettingsSchema = z.object({
  mastercard_qr_url: textField,
  wrapping_price: amountField.default(SHOP_DEFAULT_SETTINGS.wrapping_price),
  delivery_fee: amountField.default(SHOP_DEFAULT_SETTINGS.delivery_fee),
  delivery_time_text: requiredTextField,
  delivery_regions: z.array(deliveryRegionSchema).optional().default([]),
});

export const shopOrderStatusSchema = z.object({
  status: z.enum(SHOP_ORDER_STATUSES, {
    error: "يرجى اختيار الحالة.",
  }),
});

export const shopOrderAdminUpdateSchema = z
  .object({
    status: z.enum(SHOP_ORDER_STATUSES).optional(),
    assigned_driver_id: z
      .union([z.string(), z.null(), z.undefined()])
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return undefined;
        }

        return typeof value === "string" ? value.trim() : "";
      }),
    print_status: z.enum(["pending", "printed", "failed"]).optional(),
    printed_at: z.string().nullable().optional(),
    reset_printed_at: booleanField.optional(),
    increment_print_attempts: booleanField.optional(),
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.assigned_driver_id !== undefined ||
      value.print_status !== undefined ||
      value.printed_at !== undefined ||
      value.reset_printed_at === true ||
      value.increment_print_attempts === true,
    "لا يوجد تحديث صالح.",
  );

export const customerRegisterSchema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب."),
  email: emailField,
  phone: z.string().min(8, "رقم الهاتف غير صالح.").transform((value) => normalizePhone(value)),
  password: passwordField,
});

export const customerLoginSchema = z.object({
  identifier: requiredTextField,
  password: passwordField,
});

export const customerResetPasswordSchema = z
  .object({
    email: emailField,
    phone: z.string().min(8, "رقم الهاتف غير صالح.").transform((value) => normalizePhone(value)),
    password: passwordField,
    confirm_password: passwordField,
  })
  .refine((value) => value.password === value.confirm_password, {
    message: "تأكيد كلمة المرور غير مطابق.",
    path: ["confirm_password"],
  });

export const customerAddressSchema = z.object({
  label: requiredTextField,
  province: requiredTextField,
  district: requiredTextField,
  address: requiredTextField,
  phone: z.string().min(8, "رقم الهاتف غير صالح.").transform((value) => normalizePhone(value)),
  location_lat: z.number().nullable().optional().default(null),
  location_lng: z.number().nullable().optional().default(null),
  google_maps_url: textField,
  is_default: booleanField.default(false),
});

export const customerNotificationAdminSchema = z.object({
  customer_id: requiredTextField,
  shop_order_id: textField,
  title: z.string().min(2, "العنوان مطلوب."),
  body: z.string().min(2, "محتوى الإشعار مطلوب."),
});

export const deliveryAgentSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب."),
  phone: z.string().min(8, "رقم الهاتف غير صالح.").transform((value) => normalizePhone(value)),
  username: z.string().min(3, "اسم المستخدم مطلوب."),
  password: passwordField.optional().default(""),
  is_active: booleanField.default(true),
});

export const deliveryAgentLoginSchema = z.object({
  username: requiredTextField,
  password: passwordField,
});

export const assignDriverSchema = z.object({
  driver_id: textField,
});

export const checkoutItemSchema = z.object({
  product_id: z.string().min(1, "المنتج غير صالح."),
  quantity: z
    .union([z.string(), z.number()])
    .transform((value) => {
      if (typeof value === "number") {
        return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1;
      }

      const parsed = Number.parseInt(normalizeArabicDigits(value).replace(/[^\d-]/g, ""), 10);
      return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
    }),
  selected_color_name: textField,
  selected_color_hex: colorHexField.refine(
    (value) => value === "" || SHOP_PRODUCT_COLOR_LIBRARY.some((item) => item.color_hex === value),
    "لون المنتج غير صالح.",
  ),
  customization: customizationPayloadSchema.optional().default({
    custom_name: "",
    gift_message: "",
    wrapping_note: "",
    special_color: "",
    occasion_date: "",
    customer_image_url: "",
  }),
});

export const checkoutOrderSchema = z
  .object({
    customer_user_id: textField,
    customer_name: z.string().min(2, "الاسم مطلوب."),
    phone: z
      .string()
      .min(8, "رقم الهاتف غير صالح.")
      .transform((value) => normalizePhone(value))
      .refine((value) => value.length >= 8, "رقم الهاتف غير صالح."),
    province: requiredTextField.refine((value) => value.length > 0, "المحافظة مطلوبة."),
    district: requiredTextField.refine((value) => value.length > 0, "المدينة / المنطقة مطلوبة."),
    address: z.string().min(1, "العنوان مطلوب."),
    driver_notes: textField,
    location_lat: z
      .union([z.string(), z.number(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === "") {
          return null;
        }

        const parsed = parseAmountValue(value);
        return Number.isFinite(parsed) ? parsed : null;
      }),
    location_lng: z
      .union([z.string(), z.number(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined || value === "") {
          return null;
        }

        const parsed = parseAmountValue(value);
        return Number.isFinite(parsed) ? parsed : null;
      }),
    google_maps_url: textField,
    payment_method: z.enum(SHOP_PAYMENT_METHODS, {
      error: "يرجى اختيار طريقة الدفع.",
    }),
    wrapping_enabled: booleanField.default(false),
    delivery_type: textField,
    delivery_eta: textField,
    items: z.array(checkoutItemSchema).min(1, "السلة فارغة."),
  })
  .transform((value) => ({
    ...value,
    city: value.province,
    google_maps_url:
      normalizeGoogleMapsUrl(value.google_maps_url) ||
      buildGoogleMapsUrl(value.location_lat, value.location_lng),
    items: value.items.map((item) => ({
      ...item,
      customization: normalizeProductCustomizationPayload(item.customization),
    })),
  }));

export const portfolioEntrySchema = z.object({
  title: z.string().min(1, "العنوان مطلوب."),
  category: z.enum(PORTFOLIO_CATEGORIES, {
    error: "يرجى اختيار التصنيف.",
  }),
  media_type: z.enum(["image", "video"]),
  media_url: requiredTextField,
  thumbnail_url: textField,
  is_active: booleanField.default(true),
  sort_order: sortOrderField.default(0),
});

export type ServiceCategorySchema = z.infer<typeof serviceCategorySchema>;
export type ProductSchema = z.infer<typeof productSchema>;
export type ShopSettingsSchema = z.infer<typeof shopSettingsSchema>;
export type ShopOrderStatusSchema = z.infer<typeof shopOrderStatusSchema>;
export type ShopOrderAdminUpdateSchema = z.infer<typeof shopOrderAdminUpdateSchema>;
export type CustomerRegisterSchema = z.infer<typeof customerRegisterSchema>;
export type CustomerLoginSchema = z.infer<typeof customerLoginSchema>;
export type CustomerResetPasswordSchema = z.infer<typeof customerResetPasswordSchema>;
export type CustomerAddressSchema = z.infer<typeof customerAddressSchema>;
export type CustomerNotificationAdminSchema = z.infer<typeof customerNotificationAdminSchema>;
export type DeliveryAgentSchema = z.infer<typeof deliveryAgentSchema>;
export type DeliveryAgentLoginSchema = z.infer<typeof deliveryAgentLoginSchema>;
export type AssignDriverSchema = z.infer<typeof assignDriverSchema>;
export type CheckoutOrderSchema = z.infer<typeof checkoutOrderSchema>;
export type PortfolioEntrySchema = z.infer<typeof portfolioEntrySchema>;

export function normalizeShopOptionalTextPayload<T extends Record<string, unknown>>(body: T) {
  return {
    ...body,
    slug: body.slug ?? "",
    parent_id: body.parent_id ?? "",
    image_url: body.image_url ?? "",
    thumbnail_url: body.thumbnail_url ?? "",
    image_fit: body.image_fit ?? "contain",
    image_position: body.image_position ?? "center center",
    image_zoom: body.image_zoom ?? 1,
    color_options: Array.isArray(body.color_options) ? body.color_options : [],
    preview_images: Array.isArray(body.preview_images) ? body.preview_images : [],
    customization_options:
      typeof body.customization_options === "object" && body.customization_options !== null
        ? body.customization_options
        : {},
    customization:
      typeof body.customization === "object" && body.customization !== null ? body.customization : {},
    delivery_regions: Array.isArray(body.delivery_regions) ? body.delivery_regions : [],
    description: body.description ?? "",
    mastercard_qr_url: body.mastercard_qr_url ?? "",
    driver_notes: body.driver_notes ?? "",
    google_maps_url: body.google_maps_url ?? "",
    video_url: body.video_url ?? "",
    stock_quantity: body.stock_quantity ?? null,
    delivery_type: body.delivery_type ?? "",
    delivery_eta: body.delivery_eta ?? "",
    assigned_driver_id: body.assigned_driver_id ?? "",
    province: body.province ?? "",
    district: body.district ?? "",
    city: body.city ?? "",
    comment: body.comment ?? "",
    image_url_review: body.image_url_review ?? "",
  };
}
