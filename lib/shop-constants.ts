export const SHOP_MAIN_CATEGORY_SEED = [
  {
    name: "تجهيزات",
    slug: "تجهيزات",
    sort_order: 1,
    children: [
      { name: "تجهيزات الخطوبة", slug: "تجهيزات-الخطوبة", sort_order: 1 },
      { name: "تجهيزات حنة", slug: "تجهيزات-حنة", sort_order: 2 },
      { name: "تجهيزات عزوبية", slug: "تجهيزات-عزوبية", sort_order: 3 },
      { name: "تجهيزات أعياد ميلاد", slug: "تجهيزات-أعياد-ميلاد", sort_order: 4 },
      { name: "تجهيزات حج والعمرة", slug: "تجهيزات-حج-والعمرة", sort_order: 5 },
      { name: "تجهيزات التخرج", slug: "تجهيزات-التخرج", sort_order: 6 },
      { name: "DJ", slug: "dj", sort_order: 7 },
      { name: "كارت دعوة", slug: "كارت-دعوة", sort_order: 8 },
    ],
  },
  {
    name: "ورود طبيعية",
    slug: "ورود-طبيعية",
    sort_order: 2,
    children: [
      { name: "باقات طبيعية", slug: "باقات-طبيعية", sort_order: 1 },
      { name: "باقات غير طبيعية", slug: "باقات-غير-طبيعية", sort_order: 2 },
    ],
  },
  {
    name: "هدايا",
    slug: "هدايا-متجر",
    sort_order: 3,
    children: [
      { name: "رجالي", slug: "رجالي", sort_order: 1 },
      { name: "نسائي", slug: "نسائي", sort_order: 2 },
      { name: "ساعات", slug: "ساعات", sort_order: 3 },
    ],
  },
  {
    name: "كوزمتك",
    slug: "كوزمتك",
    sort_order: 4,
    children: [
      { name: "عطور", slug: "عطور", sort_order: 1 },
      { name: "مكياج", slug: "مكياج", sort_order: 2 },
    ],
  },
] as const;

export const SHOP_PAYMENT_METHODS = ["cash", "mastercard"] as const;

export const SHOP_PRODUCT_IMAGE_FITS = ["contain", "cover", "custom"] as const;

export const SHOP_PRODUCT_IMAGE_POSITIONS = [
  "center center",
  "center top",
  "center bottom",
  "right center",
  "left center",
] as const;

export const SHOP_PAYMENT_METHOD_LABELS: Record<(typeof SHOP_PAYMENT_METHODS)[number], string> = {
  cash: "نقداً",
  mastercard: "ماستر كارد",
};

export const SHOP_ORDER_STATUSES = [
  "طلب جديد",
  "قيد التجهيز",
  "جاهز للتوصيل",
  "تم التسليم",
  "ملغي",
] as const;

export const SHOP_ORDER_STATUS_STEPS = [
  {
    value: "طلب جديد",
    label: "طلب جديد",
    description: "تم استلام الطلب.",
  },
  {
    value: "قيد التجهيز",
    label: "قيد التجهيز",
    description: "يتم تجهيز الطلب.",
  },
  {
    value: "جاهز للتوصيل",
    label: "جاهز للتوصيل",
    description: "الطلب جاهز للتوصيل.",
  },
  {
    value: "تم التسليم",
    label: "تم التسليم",
    description: "تم تسليم الطلب.",
  },
  {
    value: "ملغي",
    label: "ملغي",
    description: "تم إلغاء الطلب.",
  },
] as const;

export const SHOP_PRODUCT_COLOR_LIBRARY = [
  { id: "black", color_name: "أسود", color_hex: "#000000", sort_order: 0 },
  { id: "white", color_name: "أبيض", color_hex: "#FFFFFF", sort_order: 1 },
  { id: "gold", color_name: "ذهبي", color_hex: "#D4AF37", sort_order: 2 },
  { id: "silver", color_name: "فضي", color_hex: "#C0C0C0", sort_order: 3 },
  { id: "classic-red", color_name: "أحمر كلاسيكي", color_hex: "#DC2626", sort_order: 4 },
  { id: "burgundy", color_name: "خمري", color_hex: "#7F1D1D", sort_order: 5 },
  { id: "light-pink", color_name: "وردي فاتح", color_hex: "#F9A8D4", sort_order: 6 },
  { id: "sand-pink", color_name: "وردي رملي", color_hex: "#D8B4A0", sort_order: 7 },
  { id: "royal-purple", color_name: "بنفسجي ملكي", color_hex: "#6D28D9", sort_order: 8 },
  { id: "royal-blue", color_name: "أزرق ملكي", color_hex: "#1D4ED8", sort_order: 9 },
  { id: "sky-blue", color_name: "سماوي", color_hex: "#38BDF8", sort_order: 10 },
  { id: "turquoise", color_name: "تركواز", color_hex: "#14B8A6", sort_order: 11 },
  { id: "emerald", color_name: "أخضر زمردي", color_hex: "#059669", sort_order: 12 },
  { id: "olive", color_name: "أخضر زيتي", color_hex: "#556B2F", sort_order: 13 },
  { id: "golden-yellow", color_name: "أصفر ذهبي", color_hex: "#FACC15", sort_order: 14 },
  { id: "orange", color_name: "برتقالي", color_hex: "#F97316", sort_order: 15 },
  { id: "chocolate", color_name: "بني شوكولاتة", color_hex: "#5C4033", sort_order: 16 },
  { id: "beige", color_name: "بيج", color_hex: "#E8D3B9", sort_order: 17 },
  { id: "dark-gray", color_name: "رمادي غامق", color_hex: "#374151", sort_order: 18 },
  { id: "navy", color_name: "كحلي", color_hex: "#0F172A", sort_order: 19 },
  { id: "off-white", color_name: "أوف وايت", color_hex: "#F8F5EF", sort_order: 20 },
  { id: "ivory", color_name: "عاجي", color_hex: "#FFFFF0", sort_order: 21 },
  { id: "champagne", color_name: "شامبين", color_hex: "#F7E7CE", sort_order: 22 },
  { id: "rose-gold", color_name: "روز قولد", color_hex: "#B76E79", sort_order: 23 },
  { id: "copper", color_name: "نحاسي", color_hex: "#B87333", sort_order: 24 },
  { id: "mauve", color_name: "موف", color_hex: "#C084FC", sort_order: 25 },
  { id: "lilac", color_name: "ليلكي", color_hex: "#C8A2C8", sort_order: 26 },
  { id: "fuchsia", color_name: "فوشي", color_hex: "#D946EF", sort_order: 27 },
  { id: "dark-red", color_name: "أحمر غامق", color_hex: "#991B1B", sort_order: 28 },
  { id: "light-sky-blue", color_name: "أزرق سماوي فاتح", color_hex: "#BAE6FD", sort_order: 29 },
  { id: "indigo", color_name: "نيلي", color_hex: "#312E81", sort_order: 30 },
  { id: "mint-green", color_name: "أخضر نعناعي", color_hex: "#A7F3D0", sort_order: 31 },
  { id: "light-green", color_name: "أخضر فاتح", color_hex: "#86EFAC", sort_order: 32 },
  { id: "dark-olive", color_name: "زيتي غامق", color_hex: "#3F6212", sort_order: 33 },
  { id: "light-yellow", color_name: "أصفر فاتح", color_hex: "#FEF08A", sort_order: 34 },
  { id: "caramel", color_name: "كراميل", color_hex: "#C68E17", sort_order: 35 },
  { id: "light-brown", color_name: "بني فاتح", color_hex: "#A47551", sort_order: 36 },
  { id: "light-gray", color_name: "رمادي فاتح", color_hex: "#D1D5DB", sort_order: 37 },
  { id: "lead-gray", color_name: "رصاصي", color_hex: "#6B7280", sort_order: 38 },
  { id: "creamy", color_name: "كريمي", color_hex: "#FFF7D6", sort_order: 39 },
] as const;

export const SHOP_DEFAULT_DELIVERY_REGIONS = [
  {
    id: "kirkuk",
    province: "كركوك",
    fee: 0,
    eta_text: "نفس اليوم",
    delivery_type: "مجاني",
    sort_order: 0,
    is_active: true,
  },
  {
    id: "erbil",
    province: "أربيل",
    fee: 5000,
    eta_text: "خلال 24 ساعة",
    delivery_type: "توصيل سريع",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "baghdad",
    province: "بغداد",
    fee: 7000,
    eta_text: "24 - 48 ساعة",
    delivery_type: "توصيل بين المحافظات",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "other-provinces",
    province: "باقي المحافظات",
    fee: 8000,
    eta_text: "حسب المنطقة",
    delivery_type: "توصيل خارجي",
    sort_order: 3,
    is_active: true,
  },
] as const;

export const SHOP_CUSTOMIZATION_FIELDS = [
  { key: "enable_name", label: "كتابة اسم على الهدية" },
  { key: "enable_message", label: "رسالة داخل البوكس" },
  { key: "enable_wrapping_note", label: "ملاحظة تغليف" },
  { key: "enable_special_color", label: "لون خاص" },
  { key: "enable_occasion_date", label: "تاريخ مناسبة" },
  { key: "enable_customer_image", label: "رفع صورة من الزبون" },
] as const;

export const PORTFOLIO_CATEGORIES = [
  "تجهيزات",
  "هدايا",
  "ورود",
  "كوشات",
  "تخرج",
  "مناسبات",
] as const;

export const SHOP_DEFAULT_SETTINGS = {
  mastercard_qr_url: "",
  wrapping_price: 0,
  delivery_fee: 0,
  delivery_time_text: "40 - 50 دقائق",
  delivery_regions: SHOP_DEFAULT_DELIVERY_REGIONS,
} as const;

