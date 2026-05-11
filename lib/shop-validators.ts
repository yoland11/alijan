import { z } from "zod";

import {
  SHOP_DEFAULT_SETTINGS,
  SHOP_ORDER_STATUSES,
  SHOP_PAYMENT_METHODS,
  SHOP_PRODUCT_IMAGE_FITS,
  SHOP_PRODUCT_IMAGE_POSITIONS,
} from "@/lib/shop-constants";
import { buildGoogleMapsUrl, normalizeGoogleMapsUrl, slugifyStoreText } from "@/lib/shop-utils";
import { normalizeArabicDigits, normalizePhone, parseAmountValue } from "@/lib/utils";

const textField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : ""));

const requiredTextField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : ""));

const amountField = z
  .union([z.string(), z.number()])
  .transform((value) => parseAmountValue(value))
  .refine((value) => value >= 0, "يرجى إدخال مبلغ صحيح.");

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

export const serviceCategorySchema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب."),
  slug: textField,
  parent_id: textField,
  image_url: textField,
  thumbnail_url: textField,
  is_active: booleanField.default(true),
  sort_order: sortOrderField.default(0),
}).transform((value) => ({
  ...value,
  slug: value.slug || slugifyStoreText(value.name),
  parent_id: value.parent_id || null,
  thumbnail_url: value.thumbnail_url || value.image_url || "",
}));

export const productSchema = z.object({
  category_id: z.string().min(1, "يرجى اختيار القسم."),
  name: z.string().min(1, "اسم المنتج مطلوب."),
  description: textField,
  price: amountField,
  image_url: textField,
  thumbnail_url: textField,
  image_fit: imageFitField.default("contain"),
  image_position: imagePositionField.default("center center"),
  image_zoom: imageZoomField.default(1),
  is_active: booleanField.default(true),
  sort_order: sortOrderField.default(0),
}).transform((value) => ({
  ...value,
  thumbnail_url: value.thumbnail_url || value.image_url || "",
}));

export const shopSettingsSchema = z.object({
  mastercard_qr_url: textField,
  wrapping_price: amountField.default(SHOP_DEFAULT_SETTINGS.wrapping_price),
  delivery_fee: amountField.default(SHOP_DEFAULT_SETTINGS.delivery_fee),
  delivery_time_text: requiredTextField.refine((value) => value.length > 0, "وقت التوصيل مطلوب."),
});

export const shopOrderStatusSchema = z.object({
  status: z.enum(SHOP_ORDER_STATUSES, {
    error: "يرجى اختيار الحالة.",
  }),
});

export const shopOrderAdminUpdateSchema = z
  .object({
    status: z
      .enum(SHOP_ORDER_STATUSES, {
        error: "يرجى اختيار الحالة.",
      })
      .optional(),
    print_status: z.enum(["pending", "printed", "failed"]).optional(),
    printed_at: z.string().nullable().optional(),
    reset_printed_at: booleanField.optional(),
    increment_print_attempts: booleanField.optional(),
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.print_status !== undefined ||
      value.printed_at !== undefined ||
      value.reset_printed_at === true ||
      value.increment_print_attempts === true,
    "لا يوجد تحديث صالح.",
  );

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
});

export const checkoutOrderSchema = z
  .object({
    customer_name: z.string().min(2, "الاسم مطلوب."),
    phone: z
      .string()
      .min(8, "رقم الهاتف غير صالح.")
      .transform((value) => normalizePhone(value))
      .refine((value) => value.length >= 8, "رقم الهاتف غير صالح."),
    city: z.string().min(1, "المحافظة / المدينة مطلوبة."),
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
    items: z.array(checkoutItemSchema).min(1, "السلة فارغة."),
  })
  .transform((value) => ({
    ...value,
    google_maps_url:
      normalizeGoogleMapsUrl(value.google_maps_url) ||
      buildGoogleMapsUrl(value.location_lat, value.location_lng),
  }));

export type ServiceCategorySchema = z.infer<typeof serviceCategorySchema>;
export type ProductSchema = z.infer<typeof productSchema>;
export type ShopSettingsSchema = z.infer<typeof shopSettingsSchema>;
export type ShopOrderStatusSchema = z.infer<typeof shopOrderStatusSchema>;
export type ShopOrderAdminUpdateSchema = z.infer<typeof shopOrderAdminUpdateSchema>;
export type CheckoutOrderSchema = z.infer<typeof checkoutOrderSchema>;

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
    description: body.description ?? "",
    mastercard_qr_url: body.mastercard_qr_url ?? "",
    driver_notes: body.driver_notes ?? "",
    google_maps_url: body.google_maps_url ?? "",
  };
}
