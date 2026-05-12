import type {
  PORTFOLIO_CATEGORIES,
  SHOP_ORDER_STATUSES,
  SHOP_PAYMENT_METHODS,
  SHOP_PRODUCT_COLOR_LIBRARY,
  SHOP_PRODUCT_IMAGE_FITS,
  SHOP_PRODUCT_IMAGE_POSITIONS,
} from "@/lib/shop-constants";

export type ShopPaymentMethod = (typeof SHOP_PAYMENT_METHODS)[number];
export type ShopOrderStatus = (typeof SHOP_ORDER_STATUSES)[number];
export type ShopPrintStatus = "pending" | "printed" | "failed";
export type ProductImageFit = (typeof SHOP_PRODUCT_IMAGE_FITS)[number];
export type ProductImagePosition = (typeof SHOP_PRODUCT_IMAGE_POSITIONS)[number];
export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];
export type ProductColorLibraryItem = (typeof SHOP_PRODUCT_COLOR_LIBRARY)[number];

export interface ProductColorOption {
  id: string;
  color_name: string;
  color_hex: string;
  sort_order: number;
}

export interface ProductPreviewImage {
  id: string;
  url: string;
  thumbnail_url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface DeliveryRegionConfig {
  id: string;
  province: string;
  fee: number;
  eta_text: string;
  delivery_type: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProductCustomizationOptions {
  enable_name: boolean;
  enable_message: boolean;
  enable_wrapping_note: boolean;
  enable_special_color: boolean;
  enable_occasion_date: boolean;
  enable_customer_image: boolean;
}

export interface ProductCustomizationPayload {
  custom_name: string;
  gift_message: string;
  wrapping_note: string;
  special_color: string;
  occasion_date: string;
  customer_image_url: string;
}

export interface ServiceCategoryRecord {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string;
  thumbnail_url: string;
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
  thumbnail_url: string;
  image_fit: ProductImageFit;
  image_position: ProductImagePosition;
  image_zoom: number;
  color_options: ProductColorOption[];
  preview_images: ProductPreviewImage[];
  video_url: string;
  stock_quantity: number | null;
  customization_options: ProductCustomizationOptions;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioEntryRecord {
  id: string;
  title: string;
  category: PortfolioCategory;
  media_type: "image" | "video";
  media_url: string;
  thumbnail_url: string;
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
  delivery_regions: DeliveryRegionConfig[];
  updated_at: string;
}

export interface ShopOrderItemRecord {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string;
  selected_color_name: string;
  selected_color_hex: string;
  customization: ProductCustomizationPayload;
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
  province: string;
  district: string;
  address: string;
  delivery_type: string;
  delivery_eta: string;
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
  stock_restored: boolean;
  print_status: ShopPrintStatus;
  printed_at: string | null;
  print_attempts: number;
  created_at: string;
  updated_at: string;
  items: ShopOrderItemRecord[];
}

export interface ShopCartItem {
  cart_key: string;
  product_id: string;
  name: string;
  image_url: string;
  thumbnail_url: string;
  image_fit: ProductImageFit;
  image_position: ProductImagePosition;
  image_zoom: number;
  selected_color_name: string;
  selected_color_hex: string;
  customization: ProductCustomizationPayload;
  price: number;
  quantity: number;
}

export interface ShopCatalogPayload {
  categories: ShopCategoryNode[];
  settings: ShopSettingsRecord;
}

export const SHOP_SETTINGS_DEFAULTS: Pick<
  ShopSettingsRecord,
  "mastercard_qr_url" | "wrapping_price" | "delivery_fee" | "delivery_time_text" | "delivery_regions"
> = {
  mastercard_qr_url: "",
  wrapping_price: 0,
  delivery_fee: 0,
  delivery_time_text: "40 - 50 دقائق",
  delivery_regions: [],
};
