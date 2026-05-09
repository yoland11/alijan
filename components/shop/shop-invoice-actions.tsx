"use client";

import { useEffect, useRef } from "react";
import { Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export function ShopInvoiceActions() {
  const searchParams = useSearchParams();
  const autoPrintedRef = useRef(false);

  useEffect(() => {
    if (searchParams.get("print") !== "1" || autoPrintedRef.current) {
      return;
    }

    autoPrintedRef.current = true;
    const timer = window.setTimeout(() => {
      window.print();
    }, 380);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="no-print mb-5 flex justify-end">
      <Button className="h-11 px-5" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        طباعة الفاتورة
      </Button>
    </div>
  );
}
