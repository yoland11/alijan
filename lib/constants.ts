export const SERVICE_TYPES = ["Album", "Session", "Koshat", "Gifts"] as const;

export const SERVICE_TYPE_LABELS: Record<(typeof SERVICE_TYPES)[number], string> = {
  Album: "ألبوم",
  Session: "جلسة تصوير",
  Koshat: "كوشات",
  Gifts: "هدايا",
};

export const ORDER_STATUSES = [
  "تم الحجز",
  "قيد التنفيذ",
  "جاري التجهيز",
  "جاري التصوير",
  "المونتاج",
  "مكتمل",
  "تم التسليم",
] as const;

export const STATUS_DESCRIPTIONS: Record<(typeof ORDER_STATUSES)[number], string> = {
  "تم الحجز": "تم تسجيل الطلب واعتماد بياناته الأساسية.",
  "قيد التنفيذ": "بدأ الفريق بتهيئة الطلب وتحديد مسار العمل.",
  "جاري التجهيز": "يتم تجهيز المواد والملفات المطلوبة للطلب.",
  "جاري التصوير": "مرحلة التنفيذ أو التصوير الفعلي للطلب.",
  "المونتاج": "يتم الآن تحرير الصور أو الفيديوهات وإخراج النسخة النهائية.",
  "مكتمل": "تم إنهاء التنفيذ بالكامل والطلب جاهز للمراجعة.",
  "تم التسليم": "تم تسليم الطلب للعميل بنجاح.",
};

export const COMPLETED_STATUSES = ["مكتمل", "تم التسليم"] as const;

export const DASHBOARD_STATUS_FILTERS = ["الكل", ...ORDER_STATUSES] as const;
