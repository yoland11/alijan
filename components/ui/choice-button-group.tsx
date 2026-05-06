"use client";

import { cn } from "@/lib/utils";

interface ChoiceButtonGroupOption {
  value: string;
  title: string;
  description?: string;
}

interface ChoiceButtonGroupProps {
  options: ChoiceButtonGroupOption[];
  value: string;
  onChange: (value: string) => void;
  gridClassName?: string;
}

export function ChoiceButtonGroup({
  options,
  value,
  onChange,
  gridClassName,
}: ChoiceButtonGroupProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", gridClassName)}>
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "group rounded-[24px] border px-4 py-4 text-right transition duration-300",
              "hover:-translate-y-0.5 hover:border-ajn-gold/45 hover:bg-white/[0.06]",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ajn-gold/20",
              selected
                ? "border-ajn-gold bg-ajn-gold/[0.12] shadow-[0_12px_30px_rgba(212,175,55,0.14)]"
                : "border-ajn-line bg-white/[0.03]",
            )}
            onClick={() => onChange(option.value)}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  className={cn(
                    "text-base font-semibold transition",
                    selected ? "text-ajn-gold" : "text-white",
                  )}
                >
                  {option.title}
                </p>
              </div>
              <span
                className={cn(
                  "h-4 w-4 rounded-full border transition",
                  selected
                    ? "border-ajn-gold bg-ajn-gold shadow-[0_0_0_4px_rgba(212,175,55,0.15)]"
                    : "border-white/20 bg-white/[0.04] group-hover:border-ajn-gold/45",
                )}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
