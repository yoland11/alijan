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
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
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
    <div className="h-2 overflow-hidden rounded-full bg-white/8">
      <div
        className="h-full rounded-full bg-gradient-to-l from-ajn-gold to-ajn-goldSoft"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
