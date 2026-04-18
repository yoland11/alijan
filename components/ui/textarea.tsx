import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-2xl border border-ajn-line bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-ajn-muted focus:border-ajn-gold/50 focus:bg-white/[0.05]",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

