import { CheckCircle2, Circle } from "lucide-react";

import { ORDER_STATUSES, STATUS_DESCRIPTIONS } from "@/lib/constants";
import type { OrderStatusHistoryEntry } from "@/lib/types";
import { cn, getStatusIndex } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function StatusTimeline({
  status,
  history = [],
}: {
  status: OrderStatus;
  history?: OrderStatusHistoryEntry[];
}) {
  const currentIndex = getStatusIndex(status);
  const historyMap = new Map(history.map((item) => [item.status, item]));

  return (
    <div className="surface-panel p-6 sm:p-7">
      <div className="mb-6">
        <p className="mb-2 text-sm text-ajn-goldSoft">خط سير الطلب</p>
        <h3 className="text-2xl font-bold text-white">الجدول الزمني للحالة</h3>
      </div>

      <div className="relative space-y-6 before:absolute before:right-[18px] before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-white/10">
        {ORDER_STATUSES.map((item, index) => {
          const completed = index < currentIndex;
          const active = index === currentIndex;
          const historyEntry = historyMap.get(item);

          return (
            <div key={item} className="relative flex gap-4">
              <div
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                  completed || active
                    ? "border-ajn-gold bg-ajn-gold/15 text-ajn-gold"
                    : "border-white/12 bg-white/[0.03] text-white/35",
                )}
              >
                {completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-4 w-4" />}
              </div>

              <div className="space-y-2 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className={cn(
                      "text-lg font-semibold",
                      active || completed ? "text-white" : "text-white/60",
                    )}
                  >
                    {item}
                  </h4>
                  {active ? (
                    <span className="rounded-full bg-ajn-gold/15 px-3 py-1 text-xs font-semibold text-ajn-gold">
                      الحالة الحالية
                    </span>
                  ) : null}
                </div>
                <p className="max-w-2xl text-sm leading-7 text-ajn-muted">
                  {STATUS_DESCRIPTIONS[item]}
                </p>
                {historyEntry ? (
                  <p className="text-xs text-ajn-goldSoft">{formatDateTime(historyEntry.timestamp)}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
