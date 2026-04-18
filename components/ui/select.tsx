import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-ajn-line bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-ajn-gold/50 focus:bg-white/[0.05]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = "Select";

