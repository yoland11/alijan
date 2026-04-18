"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-ajn-gold text-black hover:bg-ajn-goldSoft focus-visible:ring-ajn-gold/50 shadow-gold",
  secondary:
    "border border-ajn-line bg-white/[0.05] text-white hover:bg-white/[0.08] focus-visible:ring-white/15",
  ghost: "text-ajn-ivory hover:bg-white/[0.06] focus-visible:ring-white/15",
  danger:
    "border border-red-400/35 bg-red-500/10 text-red-200 hover:bg-red-500/16 focus-visible:ring-red-500/30",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition duration-300 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

