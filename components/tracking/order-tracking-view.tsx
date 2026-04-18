"use client";

import {
  CalendarDays,
  Clock3,
  Copy,
  Images,
  MessageCircleMore,
  Phone,
  RefreshCcw,
  ScrollText,
  Share2,
  Sparkles,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { StatusTimeline } from "@/components/tracking/status-timeline";
import { StatusBadge, StatusProgressBar } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { PORTAL_EMPTY_DELIVERY_DETAILS, PORTAL_EMPTY_MESSAGE, SERVICE_TYPE_LABELS } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";
import {
  buildTrackingPath,
  buildWhatsAppUrl,
  formatDateOnly,
  formatDateTime,
  formatOptionalDate,
  getStatusProgress,
  maskPhone,
} from "@/lib/utils";

export function OrderTrackingView({
  order,
  onRefresh,
}: {
  order: OrderRecord;
  onRefresh?: () => void;
}) {
  const whatsappUrl = buildWhatsAppUrl(order);
  const progress = getStatusProgress(order.status);
  const portalMessage = order.portal_message || order.notes || PORTAL_EMPTY_MESSAGE;
  const deliveryDetails = order.delivery_details || PORTAL_EMPTY_DELIVERY_DETAILS;

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("تعذر النسخ حاليًا.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <div className="surface-panel p-6 sm:p-7">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm text-ajn-goldSoft">تفاصيل الطلب</p>
              <h2 className="text-3xl font-bold text-white">{order.order_code}</h2>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="space-y-5">
            <StatusProgressBar status={order.status} />
            <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="mb-2 text-sm text-ajn-goldSoft">مؤشر الإنجاز</p>
                  <p className="text-3xl font-bold text-white">{progress}%</p>
                </div>
                <div className="rounded-full bg-ajn-gold/12 px-4 py-2 text-sm font-semibold text-ajn-gold">
                  {order.status}
                </div>
              </div>
              <p className="text-sm leading-7 text-ajn-muted">
                هذه البوابة تعرض لك آخر حالة، الرسائل المخصصة من AJN، وسجل التحديثات بالكامل.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              <InfoCard icon={<Phone className="h-4 w-4" />} label="العميل" value={order.name} />
              <InfoCard icon={<Phone className="h-4 w-4" />} label="الهاتف" value={maskPhone(order.phone)} />
              <InfoCard
                icon={<Images className="h-4 w-4" />}
                label="الخدمة"
                value={SERVICE_TYPE_LABELS[order.service_type]}
              />
              <InfoCard
                icon={<CalendarDays className="h-4 w-4" />}
                label="تاريخ الحجز"
                value={formatDateOnly(order.booking_date)}
              />
              <InfoCard
                icon={<Clock3 className="h-4 w-4" />}
                label="آخر تحديث"
                value={formatDateTime(order.updated_at)}
                className="sm:col-span-2"
              />
              <InfoCard
                icon={<Truck className="h-4 w-4" />}
                label="التسليم المتوقع"
                value={formatOptionalDate(order.estimated_delivery_date)}
              />
              <InfoCard
                icon={<Images className="h-4 w-4" />}
                label="عدد الوسائط"
                value={`${order.images.length} ملف`}
              />
            </div>

            <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5">
              <p className="mb-2 flex items-center gap-2 text-sm text-ajn-goldSoft">
                <Sparkles className="h-4 w-4" />
                رسالة AJN لك
              </p>
              <p className="leading-8 text-ajn-ivory">{portalMessage}</p>
            </div>

            <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5">
              <p className="mb-2 flex items-center gap-2 text-sm text-ajn-goldSoft">
                <Truck className="h-4 w-4" />
                تعليمات التسليم أو الاستلام
              </p>
              <p className="leading-8 text-ajn-ivory">{deliveryDetails}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-ajn-gold px-5 text-sm font-semibold text-black transition hover:bg-ajn-goldSoft"
                >
                  <MessageCircleMore className="h-4 w-4" />
                  التواصل عبر واتساب
                </a>
              ) : null}

              <Button
                variant="secondary"
                onClick={() => copyText(order.order_code, "تم نسخ كود الطلب.")}
              >
                <Copy className="h-4 w-4" />
                نسخ الكود
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  copyText(
                    `${window.location.origin}${buildTrackingPath(order.order_code)}`,
                    "تم نسخ رابط بوابة العميل.",
                  )
                }
              >
                <Share2 className="h-4 w-4" />
                نسخ الرابط
              </Button>

              {onRefresh ? (
                <Button variant="secondary" onClick={onRefresh}>
                  <RefreshCcw className="h-4 w-4" />
                  تحديث الآن
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="surface-panel p-6 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-full bg-ajn-gold/15 p-3 text-ajn-gold">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <p className="mb-2 text-sm text-ajn-goldSoft">سجل التحديثات</p>
              <h3 className="text-2xl font-bold text-white">كل تغيير على الطلب</h3>
            </div>
          </div>

          <div className="space-y-4">
            {[...order.status_history].reverse().map((item) => (
              <div
                key={`${item.status}-${item.timestamp}`}
                className="rounded-[24px] border border-ajn-line bg-white/[0.03] p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-ajn-goldSoft">{formatDateTime(item.timestamp)}</span>
                </div>
                <p className="leading-7 text-ajn-ivory">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel p-6 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-sm text-ajn-goldSoft">الوسائط المرفوعة</p>
              <h3 className="text-2xl font-bold text-white">معاينة الطلب</h3>
            </div>
            <span className="rounded-full border border-ajn-line px-3 py-1 text-xs text-ajn-muted">
              {order.images.length} ملف
            </span>
          </div>

          {order.images.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {order.images.map((imageUrl) => (
                <div key={imageUrl} className="group overflow-hidden rounded-[26px] border border-ajn-line">
                  <div className="relative aspect-[1/1] bg-white/5">
                    <Image
                      src={imageUrl}
                      alt={order.order_code}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-ajn-line bg-white/[0.02] p-8 text-center text-sm leading-7 text-ajn-muted">
              لم يتم رفع صور لهذا الطلب بعد. سيتم عرض الصور هنا فور إضافتها من لوحة الإدارة.
            </div>
          )}
        </div>
      </div>

      <StatusTimeline status={order.status} history={order.status_history} />
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-ajn-line bg-white/[0.03] p-5 ${className ?? ""}`}>
      <div className="mb-3 flex items-center gap-2 text-sm text-ajn-goldSoft">
        {icon}
        {label}
      </div>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}
