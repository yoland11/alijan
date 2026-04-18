import { ORDER_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const toneMap: Record<OrderStatus, string> = {
  "تم الحجز": "bg-white/8 text-white",
  "قيد التنفيذ": "bg-sky-500/16 text-sky-200",
  "جاري التجهيز": "bg-violet-500/16 text-violet-200",
  "جاري التصوير": "bg-amber-500/16 text-amber-200",
  المونتاج: "bg-fuchsia-500/16 text-fuchsia-200",
  مكتمل: "bg-emerald-500/16 text-emerald-200",
  "تم التسليم": "bg-ajn-gold/18 text-ajn-goldSoft",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneMap[status],
      )}
    >
      {status}
    </span>
  );
}

export function StatusProgressBar({ status }: { status: OrderStatus }) {
  const currentIndex = ORDER_STATUSES.findIndex((item) => item === status);
  const percentage = ((currentIndex + 1) / ORDER_STATUSES.length) * 100;

  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/8">
      <div
        className="h-full rounded-full bg-gradient-to-l from-ajn-gold to-ajn-goldSoft"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
