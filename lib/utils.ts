import clsx, { type ClassValue } from "clsx";

import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";

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

export function getStatusIndex(status: OrderRecord["status"]) {
  return ORDER_STATUSES.findIndex((item) => item === status);
}

export function normalizeOrderRecord(rawOrder: Record<string, unknown>) {
  return {
    ...rawOrder,
    total_amount: parseAmountValue(rawOrder.total_amount as string | number | null | undefined),
    received_amount: parseAmountValue(rawOrder.received_amount as string | number | null | undefined),
    remaining_amount: parseAmountValue(rawOrder.remaining_amount as string | number | null | undefined),
  } as OrderRecord;
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
