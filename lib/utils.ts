import clsx, { type ClassValue } from "clsx";

import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
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

export function formatOptionalDate(date?: string | null) {
  if (!date) {
    return "غير محدد";
  }

  return formatDateOnly(date);
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

export function getStatusProgress(status: OrderRecord["status"]) {
  const currentIndex = getStatusIndex(status);
  return Math.round(((currentIndex + 1) / ORDER_STATUSES.length) * 100);
}

export function isArchivedOrder(order: Pick<OrderRecord, "archived_at">) {
  return Boolean(order.archived_at);
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

export function buildTrackingPath(orderCode: string) {
  return `/track?q=${encodeURIComponent(orderCode)}`;
}

export function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const normalized = String(value ?? "");
  return `"${normalized.replaceAll('"', '""')}"`;
}
