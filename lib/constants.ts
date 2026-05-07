export const SERVICE_TYPES = [
  "Album",
  "Session",
  "Koshat",
  "Gifts",
  "Research",
  "Graduation",
] as const;

export const ALBUM_SESSION_TYPES = ["داخلي", "خارجي"] as const;
export const KOSHAT_TYPES = ["اعتيادي", "ملكي VIP"] as const;
export const RESEARCH_BINDING_TYPES = ["تجليد", "تغليف"] as const;
export const RESEARCH_COPY_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
export const RESEARCH_INCLUDED_NOTES = [
  "طباعة نسخة من النموذج ضمن الحساب",
  "قرص CD هدية 🎁",
] as const;
export const GRADUATION_PACKAGE_TYPES = ["الاعتيادي", "الملكي", "الأمريكي"] as const;
export const GRADUATION_SASH_TYPES = ["عادي", "ملكي", "امريكي"] as const;
export const GRADUATION_ROBE_TYPES = ["عادي", "انكليزي"] as const;
export const GRADUATION_WRITING_TYPES = ["طبع", "تطريز"] as const;

export const PHOTOGRAPHER_OPTIONS = [
  "احمد تحسين",
  "محمد ايدن",
  "احمد مراد",
  "حسن علي",
  "كرار محمد",
] as const;

export const SERVICE_TYPE_LABELS: Record<(typeof SERVICE_TYPES)[number], string> = {
  Album: "ألبومات",
  Session: "التصوير",
  Koshat: "كوشات",
  Gifts: "هدايا",
  Research: "بحوث",
  Graduation: "تجهيزات تخرج",
};

export const ORDER_STATUSES = [
  "تم الحجز",
  "قيد التنفيذ",
  "جاري التجهيز",
  "جاري التصوير",
  "المونتاج",
  "مكتمل",
  "تم التسليم",
  "تم استلام الحجز",
  "جاري إعداد وكتابة البحث",
  "قيد التدقيق والمراجعة",
  "اكتمال النسخة الأولية",
  "مراجعة المشرف العلمي",
  "تنفيذ التعديلات المطلوبة",
  "اكتمال البحث النهائي",
  "جاري المتابعة والتنسيق",
  "جاري الخياطة والتجهيز",
  "أثناء الطباعة والتغليف",
  "تم اكتمال الطلب",
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

export const KOSHAT_ORDER_STATUS_STEPS = [
  {
    value: "تم الحجز",
    label: "تم الحجز",
    description: "تم تأكيد حجز الكوشة بنجاح، شكراً لاختياركم خدماتنا 🌸",
  },
  {
    value: "قيد التنفيذ",
    label: "قيد المتابعة",
    description: "نقوم بمتابعة تفاصيل الطلب والتأكد من تنفيذه حسب رغبتكم 📋",
  },
  {
    value: "جاري التجهيز",
    label: "جارِ التجهيز",
    description: "يتم حالياً تجهيز الكوشة وتحضير كافة التفاصيل المطلوبة 🎀",
  },
  {
    value: "جاري التصوير",
    label: "جاري التنصيب",
    description: "فريقنا متواجد في الموقع ويعمل على تنصيب الكوشة بأفضل شكل ✨",
  },
  {
    value: "مكتمل",
    label: "مكتمل",
    description: "تم تنفيذ الكوشة بالكامل، نتمنى أن تنال إعجابكم 💐",
  },
] as const;

export const RESEARCH_ORDER_STATUS_STEPS = [
  {
    value: "تم استلام الحجز",
    label: "تم استلام الحجز",
    description: "تم استلام الطلب.",
  },
  {
    value: "جاري إعداد وكتابة البحث",
    label: "جاري إعداد وكتابة البحث",
    description: "جاري إعداد البحث.",
  },
  {
    value: "قيد التدقيق والمراجعة",
    label: "قيد التدقيق والمراجعة",
    description: "جاري التدقيق.",
  },
  {
    value: "اكتمال النسخة الأولية",
    label: "اكتمال النسخة الأولية",
    description: "النسخة الأولية جاهزة.",
  },
  {
    value: "مراجعة المشرف العلمي",
    label: "مراجعة المشرف العلمي",
    description: "بانتظار المراجعة.",
  },
  {
    value: "تنفيذ التعديلات المطلوبة",
    label: "تنفيذ التعديلات المطلوبة",
    description: "جاري تنفيذ التعديلات.",
  },
  {
    value: "اكتمال البحث النهائي",
    label: "اكتمال البحث النهائي",
    description: "البحث النهائي جاهز.",
  },
  {
    value: "تم التسليم",
    label: "تم التسليم",
    description: "تم التسليم.",
  },
] as const;

export const GRADUATION_ORDER_STATUS_STEPS = [
  {
    value: "تم استلام الحجز",
    label: "تم استلام الحجز",
    description: "تم استلام الطلب.",
  },
  {
    value: "جاري المتابعة والتنسيق",
    label: "جاري المتابعة والتنسيق",
    description: "جاري التنسيق.",
  },
  {
    value: "جاري الخياطة والتجهيز",
    label: "جاري الخياطة والتجهيز",
    description: "جاري التجهيز.",
  },
  {
    value: "أثناء الطباعة والتغليف",
    label: "أثناء الطباعة والتغليف",
    description: "جاري الطباعة والتغليف.",
  },
  {
    value: "تم اكتمال الطلب",
    label: "تم اكتمال الطلب",
    description: "الطلب جاهز.",
  },
  {
    value: "تم التسليم",
    label: "تم التسليم",
    description: "تم التسليم.",
  },
] as const;

export const COMPLETION_READY_STATUSES = [
  "مكتمل",
  "اكتمال البحث النهائي",
  "تم اكتمال الطلب",
] as const;

export const COMPLETED_STATUSES = [...COMPLETION_READY_STATUSES, "تم التسليم"] as const;

export const DASHBOARD_STATUS_FILTERS = [
  "الكل",
  "الطلبات النشطة",
  "تم الاكتمال",
  ...ORDER_STATUSES,
] as const;
