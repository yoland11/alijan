"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import type { CustomerInsightRecord } from "@/lib/operations-types";
import { formatAmountWithCurrency } from "@/lib/utils";

export function CustomersManager() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerInsightRecord[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/ops/customers", { cache: "no-store" });
        const payload = (await response.json()) as { message?: string; customers?: CustomerInsightRecord[] };
        if (!response.ok) throw new Error(payload.message || "تعذر تحميل العملاء.");
        setCustomers(payload.customers ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر تحميل العملاء.");
      } finally {
        setLoading(false);
      }
    };

    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.full_name, customer.phone, customer.email, customer.address].join(" ").toLowerCase().includes(term),
    );
  }, [customers, search]);

  return (
    <div className="space-y-6">
      <section className="surface-panel p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">العملاء</h2>
            <p className="mt-1 text-sm text-ajn-muted">سجل الطلبات والحجوزات والمبالغ</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ajn-muted" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث" className="pr-11" />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="shimmer-skeleton h-44 rounded-[28px]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((customer) => (
              <div key={customer.id} className="rounded-[28px] border border-white/8 bg-black/20 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ajn-gold/18 bg-ajn-gold/10 text-ajn-gold">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-white">{customer.full_name}</h3>
                    <p className="text-sm text-ajn-muted">{customer.phone || customer.email}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniMetric label="الحجوزات" value={String(customer.booking_count)} />
                  <MiniMetric label="طلبات المتجر" value={String(customer.shop_order_count)} />
                  <MiniMetric label="إجمالي الصرف" value={formatAmountWithCurrency(customer.total_spent)} />
                  <MiniMetric label="الديون" value={formatAmountWithCurrency(customer.remaining_balance)} />
                </div>

                <div className="mt-4 space-y-2 text-sm text-ajn-muted">
                  <p>{customer.address || "لا يوجد عنوان"}</p>
                  <p>آخر نشاط: {customer.last_activity_at.slice(0, 10)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-black/25 px-3 py-3">
      <p className="text-xs text-ajn-goldSoft">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
