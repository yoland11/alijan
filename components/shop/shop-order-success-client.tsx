"use client";

import { Copy, Receipt, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { HomeLinkButton } from "@/components/ui/home-link-button";

export function ShopOrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("code") ?? "";

  const copyCode = async () => {
    if (!orderCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(orderCode);
      toast.success("تم نسخ الرقم.");
    } catch {
      toast.error("تعذر النسخ.");
    }
  };

  return (
    <div className="page-shell pb-24 pt-8 sm:pt-12">
      <div className="section-shell space-y-6">
        <HomeLinkButton />

        <section className="surface-panel-strong noise-overlay mx-auto max-w-2xl p-6 text-center sm:p-10">
          <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">تم استلام طلبك</h1>

          {orderCode ? (
            <>
              <div className="mx-auto mb-6 inline-flex rounded-[26px] border border-ajn-gold/30 bg-ajn-gold/[0.08] px-6 py-4 text-xl font-bold tracking-[0.12em] text-ajn-gold">
                {orderCode}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="secondary" className="w-full" onClick={() => void copyCode()}>
                  <Copy className="h-4 w-4" />
                  نسخ الرقم
                </Button>

                <Link
                  href={`/shop-track?code=${encodeURIComponent(orderCode)}`}
                  className="inline-flex h-[3.125rem] w-full items-center justify-center gap-2 rounded-2xl border border-ajn-gold/30 bg-gradient-to-l from-ajn-gold via-ajn-goldSoft to-ajn-gold px-5 text-sm font-semibold text-black transition duration-300 hover:brightness-105"
                >
                  <Search className="h-4 w-4" />
                  تتبع الطلب
                </Link>

                <Link
                  href={`/shop-receipt/${encodeURIComponent(orderCode)}`}
                  className="inline-flex h-[3.125rem] w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-5 text-sm font-semibold text-white transition duration-300 hover:bg-white/[0.08]"
                >
                  <Receipt className="h-4 w-4" />
                  الفاتورة
                </Link>

                <Link
                  href="/account"
                  className="inline-flex h-[3.125rem] w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-5 text-sm font-semibold text-white transition duration-300 hover:bg-white/[0.08]"
                >
                  حسابي
                </Link>
              </div>
            </>
          ) : (
            <p className="text-ajn-muted">لم يتم العثور على رقم التتبع.</p>
          )}
        </section>
      </div>
    </div>
  );
}
