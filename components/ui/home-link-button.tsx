"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function HomeLinkButton({
  className,
  label = "الرئيسية",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex h-10 w-fit items-center gap-2 whitespace-nowrap rounded-2xl border border-ajn-line bg-white/[0.04] px-4 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-ajn-gold/40 hover:bg-white/[0.08] hover:text-ajn-gold",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
