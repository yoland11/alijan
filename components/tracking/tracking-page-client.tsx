"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, SearchX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { OrderTrackingView } from "@/components/tracking/order-tracking-view";
import { TrackingSearchForm } from "@/components/tracking/search-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { OrderRecord } from "@/lib/types";
import { formatDateOnly, maskPhone, normalizeTrackingQuery } from "@/lib/utils";

export function TrackingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery =
    searchParams.get("code") ?? searchParams.get("q") ?? searchParams.get("query") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState<OrderRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
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
      const response = await fetch(`/api/track?query=${encodeURIComponent(rawQuery)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as { message?: string; orders?: OrderRecord[] };

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
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
      toast.error(message);
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
  }, [urlQuery, runSearch]);

  useEffect(() => {
    if (!selectedOrder) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const interval = window.setInterval(() => {
      void runSearch(selectedOrder.order_code);
    }, 20000);

    const channel = supabase
      .channel(`ajn-order-${selectedOrder.id}`, {
        config: {
          broadcast: {
            self: true,
          },
        },
      })
      .on("broadcast", { event: "updated" }, (message) => {
        const incomingOrder = message.payload?.order as OrderRecord | undefined;

        if (!incomingOrder) {
          void runSearch(selectedOrder.order_code);
          return;
        }

        setSelectedOrder(incomingOrder);
        setResults((current) =>
          current.map((item) => (item.id === incomingOrder.id ? incomingOrder : item)),
        );
        toast.success("تم تحديث حالة الطلب لحظيًا.");
      })
      .subscribe();

    return () => {
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [selectedOrder, runSearch]);

  const handleSubmit = () => {
    const normalized = normalizeTrackingQuery(query);

    if (!normalized) {
      toast.error("أدخل كود الطلب أو آخر 4 أرقام من الهاتف.");
      return;
    }

    if (normalized.startsWith("AJN-")) {
      router.push(`/track?code=${encodeURIComponent(normalized)}`);
      return;
    }

    router.push(`/track?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="page-shell pb-24 pt-10">
      <div className="section-shell space-y-8">
        <header className="surface-panel-strong noise-overlay p-8 sm:p-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-3 font-display text-lg uppercase tracking-[0.35em] text-ajn-goldSoft">
                AJN Tracking
              </p>
              <h1 className="text-4xl font-bold text-white sm:text-5xl">تابع طلبك بكل وضوح</h1>
            </div>

            <div className="rounded-full border border-ajn-line bg-white/[0.03] px-4 py-2 text-sm text-ajn-muted">
              تحديثات فورية + عرض وسائط
            </div>
          </div>

          <TrackingSearchForm query={query} onQueryChange={setQuery} onSubmit={handleSubmit} loading={loading} />
        </header>

        {results.length > 1 && !selectedOrder ? (
          <section className="surface-panel p-6 sm:p-7">
            <div className="mb-5 flex items-center gap-2 text-ajn-gold">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-semibold">تم العثور على أكثر من طلب مطابق</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {results.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className="rounded-[26px] border border-ajn-line bg-white/[0.03] p-5 text-right transition hover:border-ajn-gold/40 hover:bg-white/[0.05]"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">{order.order_code}</p>
                      <p className="text-sm text-ajn-muted">{order.name}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="grid gap-2 text-sm text-ajn-muted sm:grid-cols-2">
                    <span>الخدمة: {SERVICE_TYPE_LABELS[order.service_type]}</span>
                    <span>الحجز: {formatDateOnly(order.booking_date)}</span>
                    <span>الهاتف: {maskPhone(order.phone)}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {selectedOrder ? <OrderTrackingView order={selectedOrder} /> : null}

        {emptyState ? (
          <section className="surface-panel p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] text-ajn-gold">
              <SearchX className="h-8 w-8" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">لا يوجد طلب مطابق</h2>
            <p className="mx-auto max-w-xl leading-8 text-ajn-muted">
              تأكد من كتابة الكود بصيغة <span className="text-white">AJN-1234</span> أو آخر 4 أرقام من الهاتف
              المسجل في الطلب.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
