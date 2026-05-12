"use client";

import { ExternalLink, LogOut, MapPinned, Phone, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { Button } from "@/components/ui/button";
import { HomeLinkButton } from "@/components/ui/home-link-button";
import type { ShopOrderRecord } from "@/lib/shop-types";
import { formatAmountWithCurrency, formatDateTime } from "@/lib/utils";

const DRIVER_STATUSES = ["استلمت الطلب", "بالطريق", "تم التسليم"] as const;

export function DeliveryAgentDashboardClient({
  driverName,
}: {
  driverName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ShopOrderRecord[]>([]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/driver/orders", { cache: "no-store" });

      if (response.status === 401) {
        router.replace("/driver/login");
        return;
      }

      const payload = (await response.json()) as { message?: string; orders?: ShopOrderRecord[] };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحميل الطلبات.");
      }

      setOrders(payload.orders ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل الطلبات.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadOrders]);

  const logout = async () => {
    await fetch("/api/driver/logout", { method: "POST" });
    toast.success("تم تسجيل الخروج.");
    router.push("/");
    router.refresh();
  };

  const updateStatus = async (orderId: string, status: (typeof DRIVER_STATUSES)[number]) => {
    try {
      const response = await fetch(`/api/driver/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحديث الحالة.");
      }

      toast.success(payload.message || "تم تحديث الحالة.");
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث الحالة.");
    }
  };

  return (
    <div className="page-shell pb-24 pt-8 sm:pt-12">
      <div className="section-shell space-y-6">
        <HomeLinkButton />

        <AnimatedServicePanel className="surface-panel-strong noise-overlay p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{driverName}</h1>
              <p className="mt-2 text-sm text-ajn-muted">لوحة التوصيل</p>
            </div>
            <Button variant="secondary" onClick={logout}>
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </AnimatedServicePanel>

        {loading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="shimmer-skeleton h-52 rounded-[28px]" />
            ))}
          </div>
        ) : !orders.length ? (
          <div className="luxury-empty">لا توجد طلبات مخصصة لك.</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {orders.map((order) => (
              <section key={order.id} className="surface-panel p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{order.customer_name}</p>
                    <p className="text-xs text-ajn-muted">{order.order_code}</p>
                  </div>
                  <span className="rounded-full border border-ajn-gold/25 bg-ajn-gold/[0.08] px-3 py-1 text-xs font-semibold text-ajn-gold">
                    {order.status}
                  </span>
                </div>

                <div className="grid gap-2 text-sm text-ajn-muted sm:grid-cols-2">
                  <p>الهاتف: {order.phone}</p>
                  <p>القيمة: {formatAmountWithCurrency(order.total)}</p>
                  <p>المحافظة: {order.province || order.city}</p>
                  <p>المنطقة: {order.district || "—"}</p>
                  <p className="sm:col-span-2">العنوان: {order.address}</p>
                  <p>الطلب: {formatDateTime(order.created_at)}</p>
                  <p>الدفع: {order.payment_method === "cash" ? "نقداً" : "ماستر كارد"}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {DRIVER_STATUSES.map((status) => (
                    <Button
                      key={status}
                      variant={order.status === status ? "primary" : "secondary"}
                      className="h-10 px-4 text-xs"
                      onClick={() => void updateStatus(order.id, status)}
                    >
                      <Truck className="h-4 w-4" />
                      {status}
                    </Button>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.google_maps_url ? (
                    <a
                      href={order.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-ajn-line bg-white/[0.05] px-4 text-xs font-semibold text-white"
                    >
                      <MapPinned className="h-4 w-4 text-ajn-gold" />
                      Google Maps
                    </a>
                  ) : null}
                  <a
                    href={`tel:${order.phone}`}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-ajn-line bg-white/[0.05] px-4 text-xs font-semibold text-white"
                  >
                    <Phone className="h-4 w-4 text-ajn-gold" />
                    اتصال
                  </a>
                  <a
                    href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-ajn-line bg-white/[0.05] px-4 text-xs font-semibold text-white"
                  >
                    <ExternalLink className="h-4 w-4 text-ajn-gold" />
                    واتساب
                  </a>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
