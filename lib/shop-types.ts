import type {
  SHOP_ORDER_STATUSES,
  SHOP_PAYMENT_METHODS,
  SHOP_PRODUCT_IMAGE_FITS,
  SHOP_PRODUCT_IMAGE_POSITIONS,
} from "@/lib/shop-constants";

export type ShopPaymentMethod = (typeof SHOP_PAYMENT_METHODS)[number];
export type ShopOrderStatus = (typeof SHOP_ORDER_STATUSES)[number];
export type ShopPrintStatus = "pending" | "printed" | "failed";
export type ProductImageFit = (typeof SHOP_PRODUCT_IMAGE_FITS)[number];
export type ProductImagePosition = (typeof SHOP_PRODUCT_IMAGE_POSITIONS)[number];

export interface ServiceCategoryRecord {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductRecord {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  image_fit: ProductImageFit;
  image_position: ProductImagePosition;
  image_zoom: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ShopCategoryNode extends ServiceCategoryRecord {
  children: ShopCategoryNode[];
  products: ProductRecord[];
}

export interface ShopSettingsRecord {
  id: string;
  mastercard_qr_url: string;
  wrapping_price: number;
  delivery_fee: number;
  delivery_time_text: string;
  updated_at: string;
}

export interface ShopOrderItemRecord {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

export interface ShopOrderRecord {
  id: string;
  order_code: string;
  phone_last4: string;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  driver_notes: string;
  location_lat: number | null;
  location_lng: number | null;
  google_maps_url: string;
  payment_method: ShopPaymentMethod;
  wrapping_enabled: boolean;
  wrapping_price: number;
  delivery_fee: number;
  subtotal: number;
  total: number;
  status: ShopOrderStatus;
  print_status: ShopPrintStatus;
  printed_at: string | null;
  print_attempts: number;
  created_at: string;
  updated_at: string;
  items: ShopOrderItemRecord[];
}

export interface ShopCartItem {
  product_id: string;
  name: string;
  image_url: string;
  image_fit: ProductImageFit;
  image_position: ProductImagePosition;
  image_zoom: number;
  price: number;
  quantity: number;
}

export interface ShopCatalogPayload {
  categories: ShopCategoryNode[];
  settings: ShopSettingsRecord;
}

export const SHOP_SETTINGS_DEFAULTS: Pick<
  ShopSettingsRecord,
  "mastercard_qr_url" | "wrapping_price" | "delivery_fee" | "delivery_time_text"
> = {
  mastercard_qr_url: "",
  wrapping_price: 0,
  delivery_fee: 0,
  delivery_time_text: "40 - 50 دقائق",
};
