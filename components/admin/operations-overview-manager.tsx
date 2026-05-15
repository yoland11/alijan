"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Boxes, CalendarClock, DollarSign, Users2, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { CountUp } from "@/components/ui/count-up";
import type { OperationsOverviewRecord } from "@/lib/operations-types";
import { formatAmountWithCurrency } from "@/lib/utils";

const chartPalette = ["#d4af37", "#b76e79", "#38bdf8", "#86efac", "#f97316", "#c084fc"];

export function OperationsOverviewManager() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OperationsOverviewRecord | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/ops/overview", { cache: "no-store" });
        const payload = (await response.json()) as { message?: string; overview?: OperationsOverviewRecord };
        if (!response.ok) {
          throw new Error(payload.message || "تعذر تحميل النظرة العامة.");
        }
        setOverview(payload.overview ?? null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر تحميل النظرة العامة.");
      } finally {
        setLoading(false);
      }
    };

    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const statCards = useMemo(() => {
    if (!overview) return [];
    return [
      { title: "الحجوزات", value: overview.stats.totalBookings, icon: CalendarClock },
      { title: "المتابعة", value: overview.stats.pendingBookings, icon: BarChart3 },
      { title: "أرباح الشهر", value: overview.stats.monthlyRevenue, icon: DollarSign, money: true },
      { title: "مصروف الشهر", value: overview.stats.monthlyExpenses, icon: Wallet, money: true },
      { title: "العملاء", value: overview.stats.totalCustomers, icon: Users2 },
      { title: "نفاد المخزون", value: overview.stats.lowStockItems, icon: Boxes },
    ];
  }, [overview]);

  if (loading || !overview) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="shimmer-skeleton h-32 rounded-[28px]" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="shimmer-skeleton h-[24rem] rounded-[30px]" />
          <div className="shimmer-skeleton h-[24rem] rounded-[30px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="surface-panel p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-ajn-goldSoft">{card.title}</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-ajn-gold/16 bg-ajn-gold/10 text-ajn-gold">
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="text-3xl font-bold text-white">
                {card.money ? formatAmountWithCurrency(card.value) : <CountUp value={card.value} />}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="surface-panel p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">الإيرادات والمصروفات</h2>
              <p className="mt-1 text-sm text-ajn-muted">آخر 6 أشهر</p>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="#b8b8b8" tick={{ fill: "#b8b8b8", fontSize: 12 }} />
                <YAxis stroke="#b8b8b8" tick={{ fill: "#b8b8b8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0b0b0c",
                    border: "1px solid rgba(212,175,55,0.18)",
                    borderRadius: "18px",
                  }}
                  labelStyle={{ color: "#f6d98d" }}
                />
                <Bar dataKey="revenue" fill="#d4af37" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="#b76e79" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-panel p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">حالة الحجوزات</h2>
            <p className="mt-1 text-sm text-ajn-muted">ملخص سريع</p>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overview.bookingStatusSeries}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={68}
                  outerRadius={112}
                  paddingAngle={4}
                >
                  {overview.bookingStatusSeries.map((entry, index) => (
                    <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0b0b0c",
                    border: "1px solid rgba(212,175,55,0.18)",
                    borderRadius: "18px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="surface-panel p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-white">الخدمات الأعلى</h2>
          <div className="space-y-3">
            {overview.topServices.map((service) => (
              <div key={service.name} className="flex items-center justify-between gap-3 rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
                <span className="font-semibold text-white">{service.name}</span>
                <span className="text-sm font-semibold text-ajn-gold">{service.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-white">آخر الحجوزات</h2>
          <div className="space-y-3">
            {overview.recentBookings.map((booking) => (
              <div key={booking.id} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-white">{booking.customer_name}</span>
                  <span className="text-xs text-ajn-gold">{booking.display_status}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm text-ajn-muted">
                  <span>{booking.order_code}</span>
                  <span>{booking.booking_date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-white">تنبيهات المخزون والعملاء</h2>
          <div className="space-y-3">
            {overview.lowStock.length ? (
              overview.lowStock.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="text-xs text-ajn-gold">
                      {item.quantity} / {item.min_quantity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ajn-muted">{item.category || item.unit}</p>
                </div>
              ))
            ) : (
              overview.recentCustomers.slice(0, 4).map((customer) => (
                <div key={customer.id} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-white">{customer.full_name}</span>
                    <span className="text-xs text-ajn-gold">{customer.phone}</span>
                  </div>
                  <p className="mt-2 text-sm text-ajn-muted">آخر نشاط: {customer.last_activity_at.slice(0, 10)}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
