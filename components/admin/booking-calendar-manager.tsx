"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { BookingCalendarEventRecord, BookingCalendarSnapshot } from "@/lib/operations-types";
import { cn, formatAmountWithCurrency } from "@/lib/utils";

const statusStyles: Record<BookingCalendarEventRecord["display_status"], string> = {
  "مؤكد": "border-emerald-400/24 bg-emerald-500/10 text-emerald-100",
  "بانتظار الدفع": "border-amber-400/24 bg-amber-500/10 text-amber-100",
  "مكتمل": "border-sky-400/24 bg-sky-500/10 text-sky-100",
  "ملغي": "border-red-400/24 bg-red-500/10 text-red-100",
};

function buildMonthLabel(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("ar-IQ", { month: "long", year: "numeric" }).format(
    new Date(year, (monthIndex || 1) - 1, 1),
  );
}

function shiftMonth(month: string, delta: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const next = new Date(year, (monthIndex || 1) - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function createMonthGrid(month: string): Array<number | null> {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDay = new Date(year, (monthIndex || 1) - 1, 1);
  const lastDay = new Date(year, monthIndex || 1, 0);
  const leading = (firstDay.getDay() + 6) % 7;
  const days = Array.from({ length: lastDay.getDate() }, (_, index) => index + 1);
  const cells: Array<number | null> = [
    ...Array.from({ length: leading }, () => null as number | null),
    ...days,
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function BookingCalendarManager() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<BookingCalendarSnapshot | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/ops/calendar?month=${month}`, { cache: "no-store" });
        const payload = (await response.json()) as { message?: string; snapshot?: BookingCalendarSnapshot };
        if (!response.ok) throw new Error(payload.message || "تعذر تحميل تقويم الحجوزات.");
        setSnapshot(payload.snapshot ?? null);
        setSelectedDate((payload.snapshot?.events[0]?.booking_date ?? `${month}-01`).slice(0, 10));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر تحميل تقويم الحجوزات.");
      } finally {
        setLoading(false);
      }
    };

    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [month]);

  const grid = useMemo(() => createMonthGrid(month), [month]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, BookingCalendarEventRecord[]>();
    for (const event of snapshot?.events ?? []) {
      const list = map.get(event.booking_date) ?? [];
      list.push(event);
      map.set(event.booking_date, list);
    }
    return map;
  }, [snapshot]);

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  return (
    <div className="space-y-6">
      <section className="surface-panel p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">تقويم الحجوزات</h2>
            <p className="mt-1 text-sm text-ajn-muted">عرض يومي وشهري للحجوزات القادمة</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" className="px-3" onClick={() => setMonth((value) => shiftMonth(value, -1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm font-semibold text-white">
              {buildMonthLabel(month)}
            </div>
            <Button variant="secondary" className="px-3" onClick={() => setMonth((value) => shiftMonth(value, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(snapshot?.summary ?? []).map((item) => (
            <div key={item.status} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
              <p className="text-sm text-ajn-goldSoft">{item.status}</p>
              <p className="mt-2 text-2xl font-bold text-white">{item.count}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="shimmer-skeleton h-[28rem] rounded-[28px]" />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-white/8 bg-black/20 p-3">
              <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-ajn-goldSoft">
                {["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"].map((day) => (
                  <div key={day} className="rounded-2xl border border-white/6 bg-white/[0.02] px-2 py-3">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {grid.map((day, index) => {
                  if (!day) {
                    return <div key={`blank-${index}`} className="min-h-[102px] rounded-2xl border border-white/6 bg-white/[0.02]" />;
                  }
                  const dateKey = `${month}-${String(day).padStart(2, "0")}`;
                  const events = eventsByDate.get(dateKey) ?? [];
                  const active = selectedDate === dateKey;
                  return (
                    <button
                      type="button"
                      key={dateKey}
                      onClick={() => setSelectedDate(dateKey)}
                      className={cn(
                        "min-h-[102px] rounded-2xl border p-2 text-right transition",
                        active ? "border-ajn-gold/34 bg-ajn-gold/10" : "border-white/6 bg-white/[0.02] hover:border-ajn-gold/20",
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">{day}</span>
                        <span className="text-[11px] text-ajn-goldSoft">{events.length}</span>
                      </div>
                      <div className="space-y-1">
                        {events.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn("rounded-xl border px-2 py-1 text-[11px] font-medium", statusStyles[event.display_status])}
                          >
                            {event.customer_name}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <section className="rounded-[28px] border border-white/8 bg-black/20 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-ajn-gold" />
                  <h3 className="text-lg font-bold text-white">حجوزات اليوم</h3>
                </div>
                <div className="space-y-3">
                  {selectedEvents.length ? (
                    selectedEvents.map((event) => (
                      <div key={event.id} className="rounded-[22px] border border-white/8 bg-black/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-white">{event.customer_name}</p>
                          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusStyles[event.display_status])}>
                            {event.display_status}
                          </span>
                        </div>
                        <div className="mt-2 grid gap-1 text-sm text-ajn-muted">
                          <span>{event.order_code}</span>
                          <span>{event.phone}</span>
                          <span>{formatAmountWithCurrency(event.total_amount)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="luxury-empty">لا توجد حجوزات لهذا اليوم</div>
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-white/8 bg-black/20 p-4">
                <h3 className="mb-4 text-lg font-bold text-white">القادمة</h3>
                <div className="space-y-3">
                  {(snapshot?.upcoming ?? []).map((event) => (
                    <div key={event.id} className="rounded-[22px] border border-white/8 bg-black/30 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{event.customer_name}</p>
                        <span className="text-xs text-ajn-gold">{event.booking_date}</span>
                      </div>
                      <p className="mt-2 text-sm text-ajn-muted">{event.order_code}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
