"use client";

import { BarChart3, PackageSearch, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import type { ShopAnalyticsRecord } from "@/lib/shop-types";
import { formatAmountWithCurrency, formatDateTime } from "@/lib/utils";

export function ShopAnalyticsManager() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ShopAnalyticsRecord | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/shop/analytics", { cache: "no-store" });
        const payload = (await response.json()) as { message?: string; analytics?: ShopAnalyticsRecord };

        if (!response.ok) {
          throw new Error(payload.message || "تعذر تحميل الإحصائيات.");
        }

        setAnalytics(payload.analytics ?? null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر تحميل الإحصائيات.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="shimmer-skeleton h-36 rounded-[28px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <AnalyticsCard title="أرباح اليوم" value={formatAmountWithCurrency(analytics.dailyRevenue)} icon={<TrendingUp className="h-5 w-5 text-ajn-gold" />} />
        <AnalyticsCard title="أرباح الشهر" value={formatAmountWithCurrency(analytics.monthlyRevenue)} icon={<TrendingUp className="h-5 w-5 text-ajn-gold" />} />
        <AnalyticsCard title="طلبات المتجر" value={String(analytics.totalShopOrders)} icon={<BarChart3 className="h-5 w-5 text-ajn-gold" />} />
        <AnalyticsCard title="الحجوزات" value={String(analytics.totalBookings)} icon={<PackageSearch className="h-5 w-5 text-ajn-gold" />} />
        <AnalyticsCard title="المكتملة" value={String(analytics.completedShopOrders)} icon={<BarChart3 className="h-5 w-5 text-ajn-gold" />} />
        <AnalyticsCard title="الملغية" value={String(analytics.cancelledShopOrders)} icon={<BarChart3 className="h-5 w-5 text-ajn-gold" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-panel p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-white">الأكثر مبيعاً</h2>
          <div className="space-y-3">
            {analytics.topProducts.map((product) => (
              <div key={product.product_id || product.product_name} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{product.product_name}</p>
                  <span className="text-sm font-semibold text-ajn-gold">{product.quantity}</span>
                </div>
                <p className="mt-2 text-sm text-ajn-muted">{formatAmountWithCurrency(product.total)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-white">المحافظات الأعلى</h2>
          <div className="space-y-3">
            {analytics.topProvinces.map((province) => (
              <div key={province.province} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{province.province}</p>
                  <span className="text-sm font-semibold text-ajn-gold">{province.count}</span>
                </div>
                <p className="mt-2 text-sm text-ajn-muted">{formatAmountWithCurrency(province.total)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="surface-panel p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-white">آخر الطلبات</h2>
          <div className="space-y-3">
            {analytics.recentShopOrders.map((order) => (
              <div key={order.id} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{order.order_code}</p>
                  <span className="text-xs text-ajn-gold">{order.status}</span>
                </div>
                <p className="mt-2 text-sm text-ajn-muted">{order.customer_name}</p>
                <p className="mt-1 text-xs text-white/60">{formatDateTime(order.created_at)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-white">المنتجات النافذة</h2>
          <div className="space-y-3">
            {analytics.outOfStockProducts.length ? (
              analytics.outOfStockProducts.map((product) => (
                <div key={product.id} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                  <p className="font-semibold text-white">{product.name}</p>
                  <p className="mt-2 text-sm text-ajn-muted">{product.stock_quantity ?? 0}</p>
                </div>
              ))
            ) : (
              <div className="luxury-empty">لا توجد منتجات نافذة.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AnalyticsCard({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return (
    <div className="surface-panel p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ajn-goldSoft">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
