import clsx, { type ClassValue } from "clsx";

import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
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
  return /^AJN-\d{4}$/i.test(query.trim());
}

export function normalizeTrackingQuery(query: string) {
  const trimmed = query.trim();

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
    `عزيزنا العميل، تم تسجيل طلبك بنجاح.
يمكنك الآن متابعة حالة الطلب عبر الرابط التالي:

${trackingLink}

شكراً لاختيارك مجموعة علي جان نهاد لتنظيم المناسبات،
نسعد بخدمتكم دائماً.`
  );

  return `https://wa.me/${number}?text=${message}`;
}