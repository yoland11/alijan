import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-2xl border border-ajn-line bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-ajn-muted focus:border-ajn-gold/50 focus:bg-white/[0.05]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

