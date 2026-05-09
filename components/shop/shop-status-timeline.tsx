"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";

import { SHOP_ORDER_STATUS_STEPS } from "@/lib/shop-constants";
import type { ShopOrderStatus } from "@/lib/shop-types";
import { cn } from "@/lib/utils";

function getShopStatusIndex(status: ShopOrderStatus) {
  return SHOP_ORDER_STATUS_STEPS.findIndex((item) => item.value === status);
}

export function ShopOrderStatusBadge({ status }: { status: ShopOrderStatus }) {
  const tone =
    status === "تم التسليم"
      ? "border-ajn-gold/30 bg-ajn-gold/14 text-ajn-gold"
      : status === "ملغي"
        ? "border-red-400/25 bg-red-500/12 text-red-200"
        : status === "جاهز للتوصيل"
          ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-200"
          : "border-white/10 bg-white/[0.06] text-white";

  return (
    <span className={cn("inline-flex rounded-full border px-3.5 py-1.5 text-xs font-semibold", tone)}>
      {status}
    </span>
  );
}

export function ShopOrderProgressBar({ status }: { status: ShopOrderStatus }) {
  const currentIndex = Math.max(getShopStatusIndex(status), 0);
  const percentage = ((currentIndex + 1) / SHOP_ORDER_STATUS_STEPS.length) * 100;
  const barTone =
    status === "ملغي"
      ? "from-red-400 via-red-300 to-red-200"
      : "from-ajn-gold via-ajn-goldSoft to-white/90";

  return (
    <div className="h-2.5 overflow-hidden rounded-full border border-white/6 bg-white/8 shadow-[inset_0_1px_6px_rgba(0,0,0,0.25)]">
      <div
        className={cn("h-full rounded-full bg-gradient-to-l shadow-[0_0_18px_rgba(212,175,55,0.3)]", barTone)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function ShopStatusTimeline({ status }: { status: ShopOrderStatus }) {
  const currentIndex = getShopStatusIndex(status);

  return (
    <div className="surface-panel p-6 sm:p-7">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white">الحالة</h3>
      </div>

      <div className="relative space-y-6 before:absolute before:right-[18px] before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-white/10 after:absolute after:right-[18px] after:top-4 after:h-[calc(100%-2rem)] after:w-px after:timeline-glow-bar after:opacity-70">
        {SHOP_ORDER_STATUS_STEPS.map((item, index) => {
          const completed = index < currentIndex;
          const active = index === currentIndex;
          const cancelled = active && item.value === "ملغي";

          return (
            <motion.div
              key={`${item.value}-${index}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.28, ease: "easeOut" }}
              className="relative flex gap-4"
            >
              <div
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                  cancelled
                    ? "border-red-400/40 bg-red-500/12 text-red-200"
                    : completed || active
                      ? "border-ajn-gold bg-ajn-gold/15 text-ajn-gold shadow-[0_0_22px_rgba(212,175,55,0.16)]"
                      : "border-white/12 bg-white/[0.03] text-white/35",
                  active && !cancelled ? "timeline-current-pulse" : "",
                )}
              >
                {completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-4 w-4" />}
              </div>

              <div className="space-y-2 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className={cn("text-lg font-semibold", active || completed ? "text-white" : "text-white/60")}>
                    {item.label}
                  </h4>
                  {active ? (
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold shadow-[0_0_18px_rgba(212,175,55,0.12)]",
                        cancelled
                          ? "border border-red-400/30 bg-red-500/12 text-red-200"
                          : "border border-ajn-gold/30 bg-ajn-gold/15 text-ajn-gold",
                      )}
                    >
                      الحالة الحالية
                    </span>
                  ) : null}
                </div>
                <p className="max-w-2xl text-sm leading-7 text-ajn-muted">{item.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
