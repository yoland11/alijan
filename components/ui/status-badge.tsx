import {
  cn,
  getOrderStatusLabel,
  getOrderStatusSteps,
  getStatusIndex,
  normalizeStatusForService,
} from "@/lib/utils";
import type { OrderStatus, ServiceType } from "@/lib/types";

const toneMap: Record<OrderStatus, string> = {
  "تم الحجز": "bg-white/8 text-white",
  "قيد التنفيذ": "bg-sky-500/16 text-sky-200",
  "جاري التجهيز": "bg-violet-500/16 text-violet-200",
  "جاري التصوير": "bg-amber-500/16 text-amber-200",
  المونتاج: "bg-fuchsia-500/16 text-fuchsia-200",
  مكتمل: "bg-emerald-500/16 text-emerald-200",
  "تم التسليم": "bg-ajn-gold/18 text-ajn-goldSoft",
  "تم استلام الحجز": "bg-white/8 text-white",
  "جاري إعداد وكتابة البحث": "bg-sky-500/16 text-sky-200",
  "قيد التدقيق والمراجعة": "bg-violet-500/16 text-violet-200",
  "اكتمال النسخة الأولية": "bg-amber-500/16 text-amber-200",
  "مراجعة المشرف العلمي": "bg-fuchsia-500/16 text-fuchsia-200",
  "تنفيذ التعديلات المطلوبة": "bg-cyan-500/16 text-cyan-200",
  "اكتمال البحث النهائي": "bg-emerald-500/16 text-emerald-200",
  "جاري المتابعة والتنسيق": "bg-sky-500/16 text-sky-200",
  "جاري الخياطة والتجهيز": "bg-violet-500/16 text-violet-200",
  "أثناء الطباعة والتغليف": "bg-amber-500/16 text-amber-200",
  "تم اكتمال الطلب": "bg-emerald-500/16 text-emerald-200",
};

export function StatusBadge({
  status,
  serviceType = "Album",
}: {
  status: OrderStatus;
  serviceType?: ServiceType;
}) {
  const toneStatus = normalizeStatusForService(status, serviceType);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border border-white/10 px-3.5 py-1.5 text-center text-xs font-semibold leading-5 shadow-[0_0_20px_rgba(255,255,255,0.02)]",
        toneMap[toneStatus],
      )}
    >
      {getOrderStatusLabel(status, serviceType)}
    </span>
  );
}

export function StatusProgressBar({
  status,
  serviceType = "Album",
}: {
  status: OrderStatus;
  serviceType?: ServiceType;
}) {
  const steps = getOrderStatusSteps(serviceType);
  const currentIndex = getStatusIndex(status, serviceType);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const percentage = ((safeIndex + 1) / steps.length) * 100;

  return (
    <div className="h-2.5 overflow-hidden rounded-full border border-white/6 bg-white/8 shadow-[inset_0_1px_6px_rgba(0,0,0,0.25)]">
      <div
        className="h-full rounded-full bg-gradient-to-l from-ajn-gold via-ajn-goldSoft to-white/90 shadow-[0_0_18px_rgba(212,175,55,0.3)]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
