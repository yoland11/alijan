"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityControl({
  value,
  onChange,
  className = "",
  size = "default",
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  size?: "default" | "compact";
}) {
  const compact = size === "compact";

  return (
    <div
      className={`inline-flex items-center justify-between rounded-[22px] border border-ajn-gold/30 bg-black/35 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ${
        compact ? "min-w-[126px] gap-2 p-1" : "min-w-[154px] gap-3 p-1.5"
      } ${className}`}
    >
      <button
        type="button"
        className={`inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-white transition hover:border-ajn-gold/45 hover:bg-white/[0.14] hover:text-ajn-gold ${
          compact ? "h-9 w-9" : "h-11 w-11"
        }`}
        aria-label="تنقيص الكمية"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus className={compact ? "h-4 w-4" : "h-4.5 w-4.5"} />
      </button>

      <span
        className={`inline-flex justify-center rounded-2xl bg-white/[0.04] font-bold text-white ${
          compact ? "min-w-[2.45rem] px-2.5 py-1.5 text-sm" : "min-w-[3rem] px-3 py-2 text-base"
        }`}
      >
        {value}
      </span>

      <button
        type="button"
        className={`inline-flex items-center justify-center rounded-2xl border border-ajn-gold/35 bg-ajn-gold/14 text-ajn-gold transition hover:bg-ajn-gold/20 hover:text-ajn-goldSoft ${
          compact ? "h-9 w-9" : "h-11 w-11"
        }`}
        aria-label="زيادة الكمية"
        onClick={() => onChange(value + 1)}
      >
        <Plus className={compact ? "h-4 w-4" : "h-4.5 w-4.5"} />
      </button>
    </div>
  );
}
