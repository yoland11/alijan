import { CalendarDays, Clock3, Images, MessageCircleMore, Phone } from "lucide-react";
import Image from "next/image";

import { StatusTimeline } from "@/components/tracking/status-timeline";
import { StatusBadge, StatusProgressBar } from "@/components/ui/status-badge";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";
import {
  buildOrderImageProxyUrl,
  buildWhatsAppUrl,
  formatAmountWithCurrency,
  formatDateOnly,
  formatDateTime,
  maskPhone,
} from "@/lib/utils";

export function OrderTrackingView({ order }: { order: OrderRecord }) {
  const whatsappUrl = buildWhatsAppUrl(order);

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

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

            <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5">
              <p className="mb-2 text-sm text-ajn-goldSoft">الملاحظات</p>
              <p className="leading-8 text-ajn-ivory">
                {order.notes || "لا توجد ملاحظات مضافة على هذا الطلب حتى الآن."}
              </p>
            </div>

            <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5">
              <p className="mb-4 text-sm text-ajn-goldSoft">الحالة المالية</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoCard
                  icon={<span className="text-xs font-semibold">IQD</span>}
                  label="المبلغ الكلي"
                  value={formatAmountWithCurrency(order.total_amount)}
                />
                <InfoCard
                  icon={<span className="text-xs font-semibold">IQD</span>}
                  label="المبلغ الواصل"
                  value={formatAmountWithCurrency(order.received_amount)}
                />
                <InfoCard
                  icon={<span className="text-xs font-semibold">IQD</span>}
                  label="المبلغ المتبقي"
                  value={formatAmountWithCurrency(order.remaining_amount)}
                />
              </div>
            </div>

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
                      src={buildOrderImageProxyUrl(imageUrl)}
                      alt={order.order_code}
                      fill
                      unoptimized
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

      <StatusTimeline status={order.status} />
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
