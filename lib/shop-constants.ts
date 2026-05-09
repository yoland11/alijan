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

export const SHOP_DEFAULT_SETTINGS = {
  mastercard_qr_url: "",
  wrapping_price: 0,
  delivery_fee: 0,
  delivery_time_text: "40 - 50 دقائق",
} as const;
