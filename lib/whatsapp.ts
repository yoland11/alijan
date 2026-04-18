import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import type { OrderRecord, OrderStatus, WhatsAppAutomationResult } from "@/lib/types";
import { buildTrackingPath, formatDateTime, normalizePhone } from "@/lib/utils";

function getBaseUrl() {
  return process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
}

function getTrackingUrl(orderCode: string) {
  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    return null;
  }

  return new URL(buildTrackingPath(orderCode), baseUrl).toString();
}

function buildCreatedMessage(order: OrderRecord) {
  const trackingUrl = getTrackingUrl(order.order_code);
  const lines = [
    `مرحبًا ${order.name}`,
    "تم تسجيل طلبك بنجاح لدى AJN.",
    `كود الطلب: ${order.order_code}`,
    `الخدمة: ${SERVICE_TYPE_LABELS[order.service_type]}`,
    `الحالة الحالية: ${order.status}`,
  ];

  if (trackingUrl) {
    lines.push(`رابط التتبع: ${trackingUrl}`);
  }

  return lines.join("\n");
}

function buildStatusUpdateMessage(order: OrderRecord, previousStatus: OrderStatus) {
  const trackingUrl = getTrackingUrl(order.order_code);
  const lines = [
    `مرحبًا ${order.name}`,
    `لدينا تحديث جديد على طلبك ${order.order_code}.`,
    `الحالة السابقة: ${previousStatus}`,
    `الحالة الحالية: ${order.status}`,
    `آخر تحديث: ${formatDateTime(order.updated_at)}`,
  ];

  if (trackingUrl) {
    lines.push(`تابع الطلب هنا: ${trackingUrl}`);
  }

  return lines.join("\n");
}

function getWhatsAppConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";

  if (!phoneNumberId || !accessToken) {
    return null;
  }

  return { phoneNumberId, accessToken, apiVersion };
}

export function isWhatsAppAutomationConfigured() {
  return Boolean(getWhatsAppConfig());
}

async function sendTextMessage(to: string, body: string): Promise<WhatsAppAutomationResult> {
  const config = getWhatsAppConfig();

  if (!config) {
    return {
      attempted: false,
      sent: false,
      reason: "تكامل واتساب غير مفعّل داخل متغيرات البيئة.",
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          preview_url: false,
          body,
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    return {
      attempted: true,
      sent: false,
      reason: payload?.error?.message || "فشل إرسال رسالة واتساب.",
    };
  }

  return {
    attempted: true,
    sent: true,
  };
}

export async function sendOrderCreatedNotification(order: OrderRecord) {
  return sendTextMessage(normalizePhone(order.phone), buildCreatedMessage(order));
}

export async function sendOrderStatusChangedNotification(
  order: OrderRecord,
  previousStatus: OrderStatus,
) {
  return sendTextMessage(normalizePhone(order.phone), buildStatusUpdateMessage(order, previousStatus));
}
