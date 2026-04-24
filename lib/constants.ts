export const SERVICE_TYPES = ["Album", "Session", "Koshat", "Gifts", "Research"] as const;

export const PHOTOGRAPHER_OPTIONS = [
  "احمد تحسين",
  "محمد ايدن",
  "احمد مراد",
  "حسن علي",
  "كرار محمد",
] as const;

export const SERVICE_TYPE_LABELS: Record<(typeof SERVICE_TYPES)[number], string> = {
  Album: "ألبوم",
  Session: "جلسة تصوير",
  Koshat: "كوشات",
  Gifts: "هدايا",
  Research: "بحوث",
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

export const DEFAULT_ORDER_STATUS_STEPS = [
  {
    value: "تم الحجز",
    label: "تم الحجز",
    description: "تم تسجيل الطلب واعتماد بياناته الأساسية.",
  },
  {
    value: "قيد التنفيذ",
    label: "قيد التنفيذ",
    description: "بدأ الفريق بتهيئة الطلب وتحديد مسار العمل.",
  },
  {
    value: "جاري التجهيز",
    label: "جاري التجهيز",
    description: "يتم تجهيز المواد والملفات المطلوبة للطلب.",
  },
  {
    value: "جاري التصوير",
    label: "جاري التصوير",
    description: "مرحلة التنفيذ أو التصوير الفعلي للطلب.",
  },
  {
    value: "المونتاج",
    label: "المونتاج",
    description: "يتم الآن تحرير الصور أو الفيديوهات وإخراج النسخة النهائية.",
  },
  {
    value: "مكتمل",
    label: "مكتمل",
    description: "تم إنهاء التنفيذ بالكامل والطلب جاهز للمراجعة.",
  },
  {
    value: "تم التسليم",
    label: "تم التسليم",
    description: "تم تسليم الطلب للعميل بنجاح.",
  },
] as const;

export const SESSION_ORDER_STATUS_STEPS = [
  {
    value: "تم الحجز",
    label: "تم الحجز",
    description: "تم تأكيد حجزك بنجاح، شكراً لاختيارك خدماتنا 📸",
  },
  {
    value: "قيد التنفيذ",
    label: "جاري المتابعة",
    description: "نعمل حالياً على تجهيز كافة التفاصيل لضمان تجربة تصوير مميزة ⏳",
  },
  {
    value: "جاري التصوير",
    label: "أثناء التصوير",
    description: "نقوم الآن بتوثيق لحظاتك بأفضل جودة واحترافية 🎥",
  },
  {
    value: "المونتاج",
    label: "قيد المونتاج",
    description: "يتم حالياً معالجة الصور/الفيديو وإضافة اللمسات الإبداعية 🎬",
  },
  {
    value: "مكتمل",
    label: "جاهز للتسليم",
    description: "تم تجهيز العمل بالكامل وهو الآن جاهز للتسليم 📦",
  },
  {
    value: "تم التسليم",
    label: "تم التسليم",
    description: "تم تسليم العمل بنجاح، نتمنى أن ينال إعجابك ✨",
  },
] as const;

export const COMPLETED_STATUSES = ["مكتمل", "تم التسليم"] as const;

export const DASHBOARD_STATUS_FILTERS = [
  "الكل",
  "الطلبات النشطة",
  "تم الاكتمال",
  ...ORDER_STATUSES,
] as const;
