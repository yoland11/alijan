import {
  CalendarDays,
  Camera,
  Clock3,
  FileText,
  Images,
  MessageCircleMore,
  Package,
  Phone,
  Ruler,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

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
  getOrderServiceDetailItems,
  getResearchCopyLabel,
  getResearchIncludedNotes,
  getStaffFieldLabel,
  maskPhone,
} from "@/lib/utils";

export function OrderTrackingView({ order }: { order: OrderRecord }) {
  const whatsappUrl = buildWhatsAppUrl(order);
  const researchNotes = getResearchIncludedNotes();
  const isResearch = order.service_type === "Research";
  const isGraduation = order.service_type === "Graduation";
  const serviceDetailItems = getOrderServiceDetailItems(order);
  const hasServiceMeta =
    order.photographer ||
    (order.service_type === "Album" && order.session_type) ||
    (order.service_type === "Koshat" && order.koshat_type) ||
    isResearch ||
    isGraduation ||
    serviceDetailItems.length;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <div className="surface-panel glass-hover p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">{order.order_code}</h2>
            </div>
            <StatusBadge status={order.status} serviceType={order.service_type} />
          </div>

          <div className="space-y-5">
            <StatusProgressBar status={order.status} serviceType={order.service_type} />

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
              {order.photographer ? (
                <InfoCard
                  icon={<Camera className="h-4 w-4" />}
                  label={getStaffFieldLabel(order.service_type)}
                  value={order.photographer}
                />
              ) : null}
              {order.service_type === "Album" && order.session_type ? (
                <InfoCard icon={<Images className="h-4 w-4" />} label="نوع الجلسة" value={order.session_type} />
              ) : null}
              {order.service_type === "Koshat" && order.koshat_type ? (
                <InfoCard icon={<Images className="h-4 w-4" />} label="نوع الكوشة" value={order.koshat_type} />
              ) : null}
              {isResearch ? (
                <>
                  <InfoCard
                    icon={<FileText className="h-4 w-4" />}
                    label="عنوان البحث"
                    value={order.research_details.title}
                  />
                  <InfoCard
                    icon={<FileText className="h-4 w-4" />}
                    label="اسم المشرف"
                    value={order.research_details.supervisor_name}
                  />
                  <InfoCard
                    icon={<CopyIcon />}
                    label="عدد النسخ"
                    value={getResearchCopyLabel(order.research_details.copy_count)}
                  />
                  <InfoCard
                    icon={<Package className="h-4 w-4" />}
                    label="التجليد / التغليف"
                    value={order.research_details.binding_type || "غير محدد"}
                  />
                </>
              ) : null}
              {isGraduation ? (
                <>
                  <InfoCard
                    icon={<Package className="h-4 w-4" />}
                    label="نوع التجهيز"
                    value={order.graduation_details.package_type || "غير محدد"}
                  />
                  <InfoCard
                    icon={<Package className="h-4 w-4" />}
                    label="الوشاح / الروب"
                    value={`${order.graduation_details.sash_type || "-"} / ${
                      order.graduation_details.robe_type || "-"
                    }`}
                  />
                  <InfoCard
                    icon={<FileText className="h-4 w-4" />}
                    label="نوع الكتابة"
                    value={order.graduation_details.writing_type || "غير محدد"}
                  />
                  <InfoCard
                    icon={<Package className="h-4 w-4" />}
                    label="القبعة"
                    value={order.graduation_details.has_cap ? "مضافة" : "غير مضافة"}
                  />
                </>
              ) : null}
              <InfoCard
                icon={<Clock3 className="h-4 w-4" />}
                label="آخر تحديث"
                value={formatDateTime(order.updated_at)}
                className={hasServiceMeta ? "" : "sm:col-span-2"}
              />
            </div>

            <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-2 text-sm text-ajn-goldSoft">الملاحظات</p>
              <p className="leading-8 text-ajn-ivory">
                {order.notes || "لا توجد ملاحظات."}
              </p>
            </div>

            {isResearch ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <DetailListPanel
                  title="تفاصيل البحث"
                  icon={<FileText className="h-4 w-4" />}
                  items={[
                    { label: "أسماء الطلبة", value: order.research_details.student_names || "غير مضافة" },
                    {
                      label: "الجامعة - الكلية - القسم",
                      value: order.research_details.academic_entity || "غير مضافة",
                    },
                    {
                      label: "تاريخ التسليم",
                      value: order.research_details.delivery_date
                        ? formatDateOnly(order.research_details.delivery_date)
                        : "غير محدد",
                    },
                    {
                      label: "حالة الطبع",
                      value: order.research_details.print_enabled
                        ? getResearchCopyLabel(order.research_details.copy_count)
                        : "بدون طبع",
                    },
                  ]}
                />

                <DetailListPanel
                  title="المزايا"
                  icon={<Package className="h-4 w-4" />}
                  items={researchNotes.map((note) => ({ label: "ملاحظة", value: note }))}
                />
              </div>
            ) : null}

            {isGraduation ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <DetailListPanel
                  title="القياسات"
                  icon={<Ruler className="h-4 w-4" />}
                  items={[
                    {
                      label: "طول وشاح",
                      value: order.graduation_details.measurements.sash_length || "غير مضاف",
                    },
                    {
                      label: "كتف",
                      value: order.graduation_details.measurements.shoulder || "غير مضاف",
                    },
                    {
                      label: "طول روب",
                      value: order.graduation_details.measurements.robe_length || "غير مضاف",
                    },
                    {
                      label: "اليد",
                      value: order.graduation_details.measurements.hand || "غير مضاف",
                    },
                  ]}
                />

                <DetailListPanel
                  title="تفاصيل التجهيز"
                  icon={<Package className="h-4 w-4" />}
                  items={[
                    {
                      label: "نوع التجهيز",
                      value: order.graduation_details.package_type || "غير محدد",
                    },
                    {
                      label: "الوشاح",
                      value: order.graduation_details.sash_type || "غير محدد",
                    },
                    {
                      label: "الروب",
                      value: order.graduation_details.robe_type || "غير محدد",
                    },
                    {
                      label: "نوع الكتابة",
                      value: order.graduation_details.writing_type || "غير محدد",
                    },
                  ]}
                />
              </div>
            ) : null}

            {serviceDetailItems.length ? (
              <DetailListPanel
                title="بيانات الخدمة"
                icon={<Package className="h-4 w-4" />}
                items={serviceDetailItems}
              />
            ) : null}

            <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-4 text-sm text-ajn-goldSoft">المبالغ</p>
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
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ajn-gold px-5 text-sm font-semibold text-black shadow-[0_0_26px_rgba(212,175,55,0.18)] transition hover:-translate-y-0.5 hover:bg-ajn-goldSoft sm:w-auto"
              >
                <MessageCircleMore className="h-4 w-4" />
                التواصل عبر واتساب
              </a>
            ) : null}
          </div>
        </div>

        {isResearch ? (
          <div className="surface-panel glass-hover p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white sm:text-2xl">ملفات PDF</h3>
              </div>
              <span className="rounded-full border border-ajn-line px-3 py-1 text-xs text-ajn-muted">
                {order.research_files.length} ملف
              </span>
            </div>

            {order.research_files.length ? (
              <div className="space-y-3">
                {order.research_files.map((file) => (
                  <div
                    key={file.url}
                    className="flex flex-col gap-3 rounded-[24px] border border-ajn-line bg-white/[0.03] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{file.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-ajn-gold px-4 text-sm font-semibold text-black transition hover:bg-ajn-goldSoft"
                      >
                        فتح الملف
                      </a>
                      <a
                        href={file.url}
                        download={file.name}
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                      >
                        تحميل
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-ajn-line bg-white/[0.02] p-8 text-center text-sm leading-7 text-ajn-muted">
                لا توجد ملفات.
              </div>
            )}
          </div>
        ) : null}

        <div className="surface-panel glass-hover p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white sm:text-2xl">الصور</h3>
            </div>
            <span className="rounded-full border border-ajn-line px-3 py-1 text-xs text-ajn-muted">
              {order.images.length} ملف
            </span>
          </div>

          {order.images.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {order.images.map((imageUrl) => (
                <div key={imageUrl} className="group overflow-hidden rounded-[26px] border border-ajn-line bg-white/[0.03]">
                  <div className="relative aspect-[1/1] bg-white/5">
                    <Image
                      src={buildOrderImageProxyUrl(imageUrl)}
                      alt={order.order_code}
                      fill
                      unoptimized
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-ajn-line bg-white/[0.02] p-8 text-center text-sm leading-7 text-ajn-muted">
              لا توجد صور.
            </div>
          )}
        </div>
      </div>

      <StatusTimeline status={order.status} serviceType={order.service_type} />
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-ajn-line bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-5 ${className ?? ""}`}>
      <div className="mb-3 flex items-center gap-2 text-sm text-ajn-goldSoft">
        {icon}
        {label}
      </div>
      <p className="break-words text-sm font-semibold text-white sm:text-base">{value}</p>
    </div>
  );
}

function DetailListPanel({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mb-4 flex items-center gap-2 text-sm text-ajn-goldSoft">
        {icon}
        {title}
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3"
          >
            <p className="text-xs text-ajn-goldSoft">{item.label}</p>
            <p className="mt-1 text-sm font-semibold leading-7 text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopyIcon() {
  return <span className="text-xs font-semibold">#</span>;
}
