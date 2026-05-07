import clsx, { type ClassValue } from "clsx";

import {
  ALBUM_SESSION_TYPES,
  COMPLETION_READY_STATUSES,
  DEFAULT_ORDER_STATUS_STEPS,
  GRADUATION_ORDER_STATUS_STEPS,
  GRADUATION_PACKAGE_TYPES,
  GRADUATION_ROBE_TYPES,
  GRADUATION_SASH_TYPES,
  GRADUATION_WRITING_TYPES,
  KOSHAT_ORDER_STATUS_STEPS,
  KOSHAT_TYPES,
  RESEARCH_BINDING_TYPES,
  RESEARCH_INCLUDED_NOTES,
  RESEARCH_ORDER_STATUS_STEPS,
  SESSION_ORDER_STATUS_STEPS,
} from "@/lib/constants";
import type {
  AlbumSessionType,
  GraduationDetails,
  GraduationMeasurements,
  GraduationPackageType,
  GraduationRobeType,
  GraduationSashType,
  GraduationWritingType,
  KoshatType,
  OrderRecord,
  OrderStatus,
  ResearchBindingType,
  ResearchDetails,
  ResearchFileRecord,
  ServiceType,
} from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const ARABIC_TO_ENGLISH_DIGITS = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
} as const;

export function normalizeArabicDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => ARABIC_TO_ENGLISH_DIGITS[digit as keyof typeof ARABIC_TO_ENGLISH_DIGITS]);
}

export function normalizePhone(phone: string) {
  return normalizeArabicDigits(phone).replace(/\D/g, "");
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

export function supportsStaffField(serviceType: ServiceType = "Album") {
  return serviceType === "Album" || serviceType === "Session";
}

export function supportsAlbumSessionType(serviceType: ServiceType = "Album") {
  return serviceType === "Album";
}

export function supportsKoshatType(serviceType: ServiceType = "Album") {
  return serviceType === "Koshat";
}

export function supportsResearchDetails(serviceType: ServiceType = "Album") {
  return serviceType === "Research";
}

export function supportsGraduationDetails(serviceType: ServiceType = "Album") {
  return serviceType === "Graduation";
}

export function getStaffFieldLabel(serviceType: ServiceType = "Album") {
  return serviceType === "Session" ? "كادر التصوير" : "اسم الكادر";
}

export function normalizeAlbumSessionType(value: unknown): AlbumSessionType | "" {
  if (typeof value !== "string") {
    return "";
  }

  return ALBUM_SESSION_TYPES.includes(value as AlbumSessionType)
    ? (value as AlbumSessionType)
    : "";
}

export function normalizeKoshatType(value: unknown): KoshatType | "" {
  if (typeof value !== "string") {
    return "";
  }

  return KOSHAT_TYPES.includes(value as KoshatType) ? (value as KoshatType) : "";
}

export function normalizeResearchBindingType(value: unknown): ResearchBindingType | "" {
  if (typeof value !== "string") {
    return "";
  }

  return RESEARCH_BINDING_TYPES.includes(value as ResearchBindingType)
    ? (value as ResearchBindingType)
    : "";
}

export function normalizeGraduationPackageType(value: unknown): GraduationPackageType | "" {
  if (typeof value !== "string") {
    return "";
  }

  return GRADUATION_PACKAGE_TYPES.includes(value as GraduationPackageType)
    ? (value as GraduationPackageType)
    : "";
}

export function normalizeGraduationSashType(value: unknown): GraduationSashType | "" {
  if (typeof value !== "string") {
    return "";
  }

  return GRADUATION_SASH_TYPES.includes(value as GraduationSashType)
    ? (value as GraduationSashType)
    : "";
}

export function normalizeGraduationRobeType(value: unknown): GraduationRobeType | "" {
  if (typeof value !== "string") {
    return "";
  }

  return GRADUATION_ROBE_TYPES.includes(value as GraduationRobeType)
    ? (value as GraduationRobeType)
    : "";
}

export function normalizeGraduationWritingType(value: unknown): GraduationWritingType | "" {
  if (typeof value !== "string") {
    return "";
  }

  return GRADUATION_WRITING_TYPES.includes(value as GraduationWritingType)
    ? (value as GraduationWritingType)
    : "";
}

export function createEmptyResearchDetails(): ResearchDetails {
  return {
    title: "",
    student_names: "",
    supervisor_name: "",
    academic_entity: "",
    delivery_date: "",
    print_enabled: false,
    copy_count: 0,
    binding_type: "",
  };
}

export function createEmptyGraduationMeasurements(): GraduationMeasurements {
  return {
    sash_length: "",
    shoulder: "",
    robe_length: "",
    hand: "",
  };
}

export function createEmptyGraduationDetails(): GraduationDetails {
  return {
    package_type: "",
    sash_type: "",
    robe_type: "",
    writing_type: "",
    measurements: createEmptyGraduationMeasurements(),
    has_cap: false,
  };
}

export function getResearchIncludedNotes() {
  return [...RESEARCH_INCLUDED_NOTES];
}

export function parseAmountValue(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = normalizeArabicDigits(value)
    .replace(/[,\s٬]/g, "")
    .replace(/٫/g, ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatAmountInputValue(value: string | number | null | undefined) {
  const amount = parseAmountValue(value);

  if (amount === 0) {
    return "0";
  }

  return amount.toFixed(2).replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

export function calculateRemainingAmount(
  totalAmount: string | number | null | undefined,
  receivedAmount: string | number | null | undefined,
) {
  return Math.max(parseAmountValue(totalAmount) - parseAmountValue(receivedAmount), 0);
}

export function formatAmount(value: string | number | null | undefined) {
  const amount = parseAmountValue(value);
  const hasFraction = !Number.isInteger(amount);

  return new Intl.NumberFormat("ar-IQ-u-nu-arab", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatAmountWithCurrency(value: string | number | null | undefined) {
  return `${formatAmount(value)} د.ع`;
}

export function normalizeWhatsAppPhone(phone: string) {
  const digits = normalizePhone(phone);

  if (!digits) {
    return "";
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith("964")) {
    return digits;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `964${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith("7")) {
    return `964${digits}`;
  }

  return digits;
}

export function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return stripTrailingSlash(configuredUrl);
  }

  if (
    typeof window !== "undefined" &&
    window.location.origin &&
    !/localhost|127\.0\.0\.1/i.test(window.location.origin)
  ) {
    return stripTrailingSlash(window.location.origin);
  }

  return "https://ali-jan1.vercel.app";
}

export function buildOrderTrackingLink(orderCode: string) {
  return `${getPublicAppUrl()}/track?code=${encodeURIComponent(orderCode)}`;
}

export function buildOrderImageProxyUrl(imageRef: string) {
  return `/api/media?src=${encodeURIComponent(imageRef)}`;
}

export function getLastFourDigits(phone: string) {
  const normalized = normalizePhone(phone);
  return normalized.slice(-4).padStart(4, "0");
}

export function buildOrderCode(phone: string) {
  return `AJN-${getLastFourDigits(phone)}`;
}

export function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatDateOnly(date: string) {
  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function maskPhone(phone: string) {
  const normalized = normalizePhone(phone);
  const lastFour = normalized.slice(-4).padStart(4, "0");
  return `*** *** ${lastFour}`;
}

export function isOrderCode(query: string) {
  return /^AJN-\d{4}$/i.test(normalizeArabicDigits(query).trim());
}

export function normalizeTrackingQuery(query: string) {
  const trimmed = normalizeArabicDigits(query).trim();

  if (isOrderCode(trimmed)) {
    return trimmed.toUpperCase();
  }

  const digits = normalizePhone(trimmed);

  if (digits.length >= 4) {
    return digits.slice(-4);
  }

  return "";
}

function normalizeTextField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCopyCount(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.min(6, Math.trunc(value))) : 0;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(normalizeArabicDigits(value).replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(6, parsed)) : 0;
  }

  return 0;
}

export function normalizeResearchFileRecords(value: unknown): ResearchFileRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const raw = item as Record<string, unknown>;
      const name = normalizeTextField(raw.name);
      const url = normalizeTextField(raw.url);

      if (!name || !url) {
        return null;
      }

      return { name, url };
    })
    .filter((item): item is ResearchFileRecord => Boolean(item));
}

export function normalizeResearchDetails(value: unknown): ResearchDetails {
  if (!value || typeof value !== "object") {
    return createEmptyResearchDetails();
  }

  const raw = value as Record<string, unknown>;

  return {
    title: normalizeTextField(raw.title),
    student_names: normalizeTextField(raw.student_names),
    supervisor_name: normalizeTextField(raw.supervisor_name),
    academic_entity: normalizeTextField(raw.academic_entity),
    delivery_date: normalizeTextField(raw.delivery_date),
    print_enabled: normalizeBoolean(raw.print_enabled),
    copy_count: normalizeCopyCount(raw.copy_count),
    binding_type: normalizeResearchBindingType(raw.binding_type),
  };
}

export function normalizeGraduationDetails(value: unknown): GraduationDetails {
  if (!value || typeof value !== "object") {
    return createEmptyGraduationDetails();
  }

  const raw = value as Record<string, unknown>;
  const measurements =
    raw.measurements && typeof raw.measurements === "object"
      ? (raw.measurements as Record<string, unknown>)
      : {};

  return {
    package_type: normalizeGraduationPackageType(raw.package_type),
    sash_type: normalizeGraduationSashType(raw.sash_type),
    robe_type: normalizeGraduationRobeType(raw.robe_type),
    writing_type: normalizeGraduationWritingType(raw.writing_type),
    measurements: {
      sash_length: normalizeTextField(measurements.sash_length),
      shoulder: normalizeTextField(measurements.shoulder),
      robe_length: normalizeTextField(measurements.robe_length),
      hand: normalizeTextField(measurements.hand),
    },
    has_cap: normalizeBoolean(raw.has_cap),
  };
}

export function getOrderStatusSteps(serviceType: ServiceType = "Album") {
  if (serviceType === "Session") {
    return SESSION_ORDER_STATUS_STEPS;
  }

  if (serviceType === "Koshat") {
    return KOSHAT_ORDER_STATUS_STEPS;
  }

  if (serviceType === "Research") {
    return RESEARCH_ORDER_STATUS_STEPS;
  }

  if (serviceType === "Graduation") {
    return GRADUATION_ORDER_STATUS_STEPS;
  }

  return DEFAULT_ORDER_STATUS_STEPS;
}

function toBaseStatus(status: OrderStatus): OrderStatus {
  switch (status) {
    case "تم استلام الحجز":
      return "تم الحجز";
    case "جاري إعداد وكتابة البحث":
    case "جاري المتابعة والتنسيق":
      return "قيد التنفيذ";
    case "قيد التدقيق والمراجعة":
    case "جاري الخياطة والتجهيز":
      return "جاري التجهيز";
    case "اكتمال النسخة الأولية":
    case "أثناء الطباعة والتغليف":
      return "جاري التصوير";
    case "مراجعة المشرف العلمي":
    case "تنفيذ التعديلات المطلوبة":
      return "المونتاج";
    case "اكتمال البحث النهائي":
    case "تم اكتمال الطلب":
      return "مكتمل";
    default:
      return status;
  }
}

export function getInitialStatusForService(serviceType: ServiceType = "Album"): OrderStatus {
  return getOrderStatusSteps(serviceType)[0]?.value ?? "تم الحجز";
}

export function normalizeStatusForService(
  status: OrderStatus,
  serviceType: ServiceType = "Album",
) {
  const serviceSteps = getOrderStatusSteps(serviceType);

  if (serviceSteps.some((step) => step.value === status)) {
    return status;
  }

  const baseStatus = toBaseStatus(status);

  if (serviceType === "Session") {
    if (baseStatus === "جاري التجهيز") {
      return "قيد التنفيذ";
    }

    return serviceSteps.some((step) => step.value === baseStatus)
      ? baseStatus
      : getInitialStatusForService(serviceType);
  }

  if (serviceType === "Koshat") {
    if (baseStatus === "المونتاج" || baseStatus === "تم التسليم") {
      return "مكتمل";
    }

    return serviceSteps.some((step) => step.value === baseStatus)
      ? baseStatus
      : getInitialStatusForService(serviceType);
  }

  if (serviceType === "Research") {
    switch (baseStatus) {
      case "تم الحجز":
        return "تم استلام الحجز";
      case "قيد التنفيذ":
        return "جاري إعداد وكتابة البحث";
      case "جاري التجهيز":
        return "قيد التدقيق والمراجعة";
      case "جاري التصوير":
        return "اكتمال النسخة الأولية";
      case "المونتاج":
        return "مراجعة المشرف العلمي";
      case "مكتمل":
        return "اكتمال البحث النهائي";
      case "تم التسليم":
        return "تم التسليم";
      default:
        return getInitialStatusForService(serviceType);
    }
  }

  if (serviceType === "Graduation") {
    switch (baseStatus) {
      case "تم الحجز":
        return "تم استلام الحجز";
      case "قيد التنفيذ":
        return "جاري المتابعة والتنسيق";
      case "جاري التجهيز":
        return "جاري الخياطة والتجهيز";
      case "جاري التصوير":
      case "المونتاج":
        return "أثناء الطباعة والتغليف";
      case "مكتمل":
        return "تم اكتمال الطلب";
      case "تم التسليم":
        return "تم التسليم";
      default:
        return getInitialStatusForService(serviceType);
    }
  }

  return baseStatus;
}

export function getOrderStatusLabel(
  status: OrderStatus,
  serviceType: ServiceType = "Album",
) {
  const normalizedStatus = normalizeStatusForService(status, serviceType);
  const matchedStep = getOrderStatusSteps(serviceType).find((item) => item.value === normalizedStatus);

  return matchedStep?.label ?? status;
}

export function getOrderStatusDescription(
  status: OrderStatus,
  serviceType: ServiceType = "Album",
) {
  const normalizedStatus = normalizeStatusForService(status, serviceType);
  const matchedStep = getOrderStatusSteps(serviceType).find((item) => item.value === normalizedStatus);

  return matchedStep?.description ?? "";
}

export function getStatusIndex(
  status: OrderRecord["status"],
  serviceType: ServiceType = "Album",
) {
  const normalizedStatus = normalizeStatusForService(status, serviceType);
  return getOrderStatusSteps(serviceType).findIndex((item) => item.value === normalizedStatus);
}

export function isCompletionReadyStatus(status: OrderStatus) {
  return COMPLETION_READY_STATUSES.includes(
    status as (typeof COMPLETION_READY_STATUSES)[number],
  );
}

export function normalizeOrderRecord(rawOrder: Record<string, unknown>) {
  return {
    ...rawOrder,
    photographer: typeof rawOrder.photographer === "string" ? rawOrder.photographer : "",
    session_type: normalizeAlbumSessionType(rawOrder.session_type),
    koshat_type: normalizeKoshatType(rawOrder.koshat_type),
    research_details: normalizeResearchDetails(rawOrder.research_details),
    research_files: normalizeResearchFileRecords(rawOrder.research_files),
    graduation_details: normalizeGraduationDetails(rawOrder.graduation_details),
    total_amount: parseAmountValue(rawOrder.total_amount as string | number | null | undefined),
    received_amount: parseAmountValue(rawOrder.received_amount as string | number | null | undefined),
    remaining_amount: parseAmountValue(rawOrder.remaining_amount as string | number | null | undefined),
  } as OrderRecord;
}

export function getResearchCopyLabel(count: number) {
  if (count <= 0) {
    return "بدون طبع";
  }

  return count === 1 ? "نسخة 1" : `${count} نسخ`;
}

export function getOrderSearchableText(order: OrderRecord) {
  return [
    order.name,
    order.phone,
    order.order_code,
    order.photographer,
    order.session_type,
    order.koshat_type,
    order.notes,
    order.total_amount,
    order.received_amount,
    order.remaining_amount,
    order.research_details.title,
    order.research_details.student_names,
    order.research_details.supervisor_name,
    order.research_details.academic_entity,
    order.research_details.binding_type,
    order.research_details.copy_count,
    ...order.research_files.map((file) => file.name),
    order.graduation_details.package_type,
    order.graduation_details.sash_type,
    order.graduation_details.robe_type,
    order.graduation_details.writing_type,
    order.graduation_details.measurements.sash_length,
    order.graduation_details.measurements.shoulder,
    order.graduation_details.measurements.robe_length,
    order.graduation_details.measurements.hand,
    order.graduation_details.has_cap ? "قبعة" : "",
  ]
    .join(" ")
    .toLowerCase();
}

export function buildWhatsAppUrl(order: OrderRecord) {
  const number = normalizePhone(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "");

  if (!number) {
    return null;
  }

  const message = encodeURIComponent(
    `مرحبًا، أود الاستفسار عن حالة طلبي ${order.order_code} باسم ${order.name}.`,
  );

  return `https://wa.me/${number}?text=${message}`;
}

export function buildCustomerOrderWhatsAppUrl(order: OrderRecord) {
  const number = normalizeWhatsAppPhone(order.phone);

  if (!number) {
    return null;
  }

  const trackingLink = buildOrderTrackingLink(order.order_code);

  const message = encodeURIComponent(
    `📸 مرحبًا عزيزي ${order.name}،

تم تسجيل طلبك بنجاح ✅

يمكنك متابعة حالة طلبك من هنا:
${trackingLink}

شكراً لاختيارك مجموعة علي جان نهاد لتنظيم المناسبات 💙`
  );

  return `https://wa.me/${number}?text=${message}`;
}

export function buildCompletedOrderWhatsAppUrl(order: OrderRecord) {
  const number = normalizeWhatsAppPhone(order.phone);

  if (!number) {
    return null;
  }

  const trackingLink = buildOrderTrackingLink(order.order_code);
  const message = encodeURIComponent(
    `عميلنا العزيز ${order.name}
طلبك تم بنجاح وتم تجهيزه بالكامل، وتكدر تستلمه بأي وقت مناسب إلك.

تقدر تتابع تفاصيل الطلب من خلال الرابط:
${trackingLink}

نشكرك على ثقتك بمجموعة علي جان نهاد لتنظيم المناسبات`,
  );

  return `https://wa.me/${number}?text=${message}`;
}
