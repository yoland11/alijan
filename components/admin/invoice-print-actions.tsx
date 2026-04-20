"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function InvoicePrintActions({
  orderId,
  autoPrint = false,
}: {
  orderId: string;
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.print();
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [autoPrint]);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link
        href="/admin"
        className="inline-flex h-12 items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
      >
        العودة إلى لوحة الإدارة
      </Link>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/admin/invoices/${orderId}`}
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          عرض الفاتورة
        </Link>
        <Button onClick={() => window.print()}>طباعة / حفظ PDF</Button>
      </div>
    </div>
  );
}
