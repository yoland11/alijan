"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityControl({
  value,
  onChange,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex min-w-[154px] items-center justify-between gap-3 rounded-[22px] border border-ajn-gold/30 bg-black/35 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ${className}`}
    >
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-white transition hover:border-ajn-gold/45 hover:bg-white/[0.14] hover:text-ajn-gold"
        aria-label="تنقيص الكمية"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus className="h-4.5 w-4.5" />
      </button>

      <span className="inline-flex min-w-[3rem] justify-center rounded-2xl bg-white/[0.04] px-3 py-2 text-base font-bold text-white">
        {value}
      </span>

      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ajn-gold/35 bg-ajn-gold/14 text-ajn-gold transition hover:bg-ajn-gold/20 hover:text-ajn-goldSoft"
        aria-label="زيادة الكمية"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
