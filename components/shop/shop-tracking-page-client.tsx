"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, SearchX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ShopOrderTrackingView } from "@/components/shop/shop-order-tracking-view";
import { ShopOrderStatusBadge } from "@/components/shop/shop-status-timeline";
import { TrackingSearchForm } from "@/components/tracking/search-form";
import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { HomeLinkButton } from "@/components/ui/home-link-button";
import type { ShopOrderRecord } from "@/lib/shop-types";
import { formatDateTime, normalizeTrackingQuery } from "@/lib/utils";

export function ShopTrackingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery =
    searchParams.get("code") ?? searchParams.get("q") ?? searchParams.get("query") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState<ShopOrderRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrderRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [emptyState, setEmptyState] = useState(false);

  const runSearch = useCallback(async (rawQuery: string) => {
    const normalized = normalizeTrackingQuery(rawQuery);

    if (!normalized) {
      setResults([]);
      setSelectedOrder(null);
      setEmptyState(false);
      return;
    }

    setLoading(true);
    setEmptyState(false);

    try {
      const response = await fetch(`/api/shop/track?query=${encodeURIComponent(rawQuery)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as { message?: string; orders?: ShopOrderRecord[] };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر إتمام البحث.");
      }

      const orders = payload.orders ?? [];
      setResults(orders);
      setEmptyState(orders.length === 0);

      if (orders.length === 1) {
        setSelectedOrder(orders[0]);
        return;
      }

      setSelectedOrder((current) => {
        if (!current) {
          return null;
        }

        return orders.find((item) => item.id === current.id) ?? null;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إتمام البحث.");
      setResults([]);
      setSelectedOrder(null);
      setEmptyState(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery(urlQuery);

      if (urlQuery) {
        void runSearch(urlQuery);
      } else {
        setResults([]);
        setSelectedOrder(null);
        setEmptyState(false);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [runSearch, urlQuery]);

  useEffect(() => {
    if (!selectedOrder) {
      return;
    }

    const interval = window.setInterval(() => {
      void runSearch(selectedOrder.order_code);
    }, 20000);

    return () => {
      window.clearInterval(interval);
    };
  }, [runSearch, selectedOrder]);

  const handleSubmit = () => {
    const normalized = normalizeTrackingQuery(query);

    if (!normalized) {
      toast.error("أدخل رقم التتبع أو آخر 4 أرقام.");
      return;
    }

    if (normalized.startsWith("AJN-")) {
      router.push(`/shop-track?code=${encodeURIComponent(normalized)}`);
      return;
    }

    router.push(`/shop-track?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="page-shell pb-20 pt-6 sm:pb-24 sm:pt-10">
      <div className="section-shell space-y-7 sm:space-y-8">
        <HomeLinkButton />

        <AnimatedServicePanel className="sticky-shell surface-panel-strong noise-overlay p-5 sm:p-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white sm:text-5xl">تتبع طلبات المتجر</h1>
          </div>

          <TrackingSearchForm query={query} onQueryChange={setQuery} onSubmit={handleSubmit} loading={loading} />
        </AnimatedServicePanel>

        {results.length > 1 && !selectedOrder ? (
          <section className="surface-panel p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-2 text-ajn-gold">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-semibold">اختر الطلب</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {results.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className="rounded-[26px] border border-ajn-line bg-white/[0.03] p-5 text-right transition hover:border-ajn-gold/40 hover:bg-white/[0.05]"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{order.order_code}</p>
                      <p className="text-sm text-ajn-muted">{formatDateTime(order.created_at)}</p>
                    </div>
                    <ShopOrderStatusBadge status={order.status} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {loading && !selectedOrder ? (
          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="surface-panel p-6">
              <div className="shimmer-skeleton mb-4 h-6 w-36 rounded-full" />
              <div className="shimmer-skeleton mb-3 h-4 w-full rounded-full" />
              <div className="shimmer-skeleton mb-3 h-4 w-5/6 rounded-full" />
              <div className="shimmer-skeleton h-60 rounded-[28px]" />
            </div>
            <div className="surface-panel p-6">
              <div className="shimmer-skeleton mb-4 h-6 w-28 rounded-full" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="shimmer-skeleton h-14 rounded-[22px]" />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {selectedOrder ? <ShopOrderTrackingView order={selectedOrder} /> : null}

        {emptyState ? (
          <section className="luxury-empty">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] text-ajn-gold">
              <SearchX className="h-8 w-8" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">لا يوجد طلب مطابق</h2>
            <p className="mx-auto max-w-xl text-ajn-muted">تحقق من الرقم.</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
