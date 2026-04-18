"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, BellRing, ChartColumnBig, Download, Filter, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { LogoutButton } from "@/components/admin/logout-button";
import { OrderModal } from "@/components/admin/order-modal";
import { OrdersTable } from "@/components/admin/orders-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ARCHIVE_FILTERS,
  COMPLETED_STATUSES,
  DASHBOARD_STATUS_FILTERS,
  ORDER_STATUSES,
} from "@/lib/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { OrderRecord } from "@/lib/types";
import { isArchivedOrder } from "@/lib/utils";
import type { OrderSchema } from "@/lib/validators";

export function DashboardClient() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof DASHBOARD_STATUS_FILTERS)[number]>("الكل");
  const [archiveFilter, setArchiveFilter] = useState<(typeof ARCHIVE_FILTERS)[number]>("النشطة");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [whatsappAutomationEnabled, setWhatsappAutomationEnabled] = useState(false);

  const refreshOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const payload = (await response.json()) as {
        message?: string;
        orders?: OrderRecord[];
        meta?: { whatsappAutomationEnabled?: boolean };
      };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحميل الطلبات.");
      }

      setOrders(payload.orders ?? []);
      setWhatsappAutomationEnabled(Boolean(payload.meta?.whatsappAutomationEnabled));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل الطلبات.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshOrders();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refreshOrders]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("ajn-orders", {
        config: {
          broadcast: {
            self: true,
          },
        },
      })
      .on("broadcast", { event: "updated" }, () => {
        void refreshOrders();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshOrders]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      [
        order.name,
        order.phone,
        order.order_code,
        order.notes,
        order.portal_message,
        order.delivery_details,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "الكل" || order.status === statusFilter;
    const matchesArchive =
      archiveFilter === "الكل" ||
      (archiveFilter === "المؤرشفة" ? isArchivedOrder(order) : !isArchivedOrder(order));
    return matchesSearch && matchesStatus && matchesArchive;
  });

  const completedOrders = orders.filter((order) =>
    COMPLETED_STATUSES.includes(order.status as (typeof COMPLETED_STATUSES)[number]),
  ).length;
  const archivedOrders = orders.filter((order) => isArchivedOrder(order)).length;
  const inProgressOrders = orders.filter(
    (order) => !COMPLETED_STATUSES.includes(order.status as (typeof COMPLETED_STATUSES)[number]),
  ).length;

  const submitOrder = async (values: OrderSchema, files: File[]) => {
    setBusy(true);

    try {
      let imageUrls = values.images;

      if (files.length) {
        const uploadBody = new FormData();
        files.forEach((file) => uploadBody.append("files", file));

        const uploadResponse = await fetch("/api/admin/media", {
          method: "POST",
          body: uploadBody,
        });
        const uploadPayload = (await uploadResponse.json()) as { message?: string; urls?: string[] };

        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.message || "تعذر رفع الصور.");
        }

        imageUrls = [...values.images, ...(uploadPayload.urls ?? [])];
      }

      const endpoint = activeOrder ? `/api/admin/orders/${activeOrder.id}` : "/api/admin/orders";
      const method = activeOrder ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          images: imageUrls,
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        notification?: { attempted?: boolean; sent?: boolean; reason?: string };
      };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حفظ الطلب.");
      }

      toast.success(activeOrder ? "تم تحديث الطلب." : "تم إنشاء الطلب.");
      if (payload.notification?.attempted && payload.notification.sent) {
        toast.success("تم إرسال إشعار واتساب تلقائيًا للعميل.");
      }
      if (payload.notification?.attempted && !payload.notification.sent) {
        toast.error(payload.notification.reason || "فشل إرسال إشعار واتساب.");
      }
      setModalOpen(false);
      setActiveOrder(null);
      await refreshOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الطلب.");
    } finally {
      setBusy(false);
    }
  };

  const deleteOrder = async (order: OrderRecord) => {
    if (!window.confirm(`هل تريد حذف الطلب ${order.order_code} نهائيًا؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف الطلب.");
      }

      toast.success("تم حذف الطلب.");
      await refreshOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الطلب.");
    }
  };

  const toggleArchive = async (order: OrderRecord) => {
    const archive = !isArchivedOrder(order);
    const prompt = archive
      ? `هل تريد أرشفة الطلب ${order.order_code}؟`
      : `هل تريد استرجاع الطلب ${order.order_code} إلى الطلبات النشطة؟`;

    if (!window.confirm(prompt)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: archive ? "archive" : "restore",
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحديث الأرشفة.");
      }

      toast.success(payload.message || (archive ? "تمت الأرشفة." : "تم الاسترجاع."));
      await refreshOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث الأرشفة.");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        archive: archiveFilter,
      });
      const response = await fetch(`/api/admin/export?${params.toString()}`);

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "تعذر تصدير البيانات.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ajn-orders-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("تم تجهيز ملف التصدير.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تصدير البيانات.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="page-shell pb-16 pt-10">
        <div className="section-shell space-y-8">
          <header className="surface-panel-strong noise-overlay p-8 sm:p-10">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-3 font-display text-lg uppercase tracking-[0.35em] text-ajn-goldSoft">
                  AJN Admin Dashboard
                </p>
                <h1 className="text-4xl font-bold text-white sm:text-5xl">إدارة الحجوزات والطلبات</h1>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-ajn-muted">
                  لوحة تشغيل كاملة لإنشاء الطلبات، تعديلها، رفع الصور، ومتابعة الإنجاز مع تحديثات فورية.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-ajn-line bg-white/[0.03] px-4 py-2 text-sm">
                  <BellRing className="h-4 w-4 text-ajn-gold" />
                  <span className={whatsappAutomationEnabled ? "text-emerald-200" : "text-amber-200"}>
                    {whatsappAutomationEnabled
                      ? "إشعارات واتساب التلقائية مفعّلة"
                      : "إشعارات واتساب غير مفعّلة - أضف المفاتيح في البيئة"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" onClick={handleExport} disabled={exporting || loading}>
                  <Download className="h-4 w-4" />
                  {exporting ? "جاري التصدير..." : "تصدير CSV"}
                </Button>
                <Button
                  onClick={() => {
                    setActiveOrder(null);
                    setModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  طلب جديد
                </Button>
                <LogoutButton />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <MetricCard title="إجمالي الطلبات" value={orders.length} subtitle="جميع الطلبات المسجلة" />
              <MetricCard title="الطلبات المكتملة" value={completedOrders} subtitle="مكتمل + تم التسليم" />
              <MetricCard title="طلبات قيد العمل" value={inProgressOrders} subtitle="مراحل التنفيذ الحالية" />
              <MetricCard title="الطلبات المؤرشفة" value={archivedOrders} subtitle="طلبات محفوظة خارج العرض النشط" />
            </div>
          </header>

          <section className="surface-panel p-6 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="mb-2 text-sm text-ajn-goldSoft">أدوات التحكم</p>
                <h2 className="text-2xl font-bold text-white">بحث وفلاتر سريعة</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-ajn-line bg-white/[0.03] px-4 py-2 text-sm text-ajn-muted">
                <ChartColumnBig className="h-4 w-4 text-ajn-gold" />
                {ORDER_STATUSES.length} مراحل متابعة
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_260px_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ajn-muted" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ابحث بالاسم أو الهاتف أو الكود أو الملاحظات"
                  className="pr-11"
                />
              </div>

              <div className="relative">
                <Filter className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ajn-muted" />
                <Select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as (typeof DASHBOARD_STATUS_FILTERS)[number])
                  }
                  className="pr-11"
                >
                  {DASHBOARD_STATUS_FILTERS.map((status) => (
                    <option key={status} value={status} className="bg-black">
                      {status}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="relative">
                <Archive className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ajn-muted" />
                <Select
                  value={archiveFilter}
                  onChange={(event) =>
                    setArchiveFilter(event.target.value as (typeof ARCHIVE_FILTERS)[number])
                  }
                  className="pr-11"
                >
                  {ARCHIVE_FILTERS.map((filter) => (
                    <option key={filter} value={filter} className="bg-black">
                      {filter}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </section>

          {loading ? (
            <section className="surface-panel p-10 text-center text-sm leading-8 text-ajn-muted">
              جاري تحميل الطلبات...
            </section>
          ) : (
            <OrdersTable
              orders={filteredOrders}
              onEdit={(order) => {
                setActiveOrder(order);
                setModalOpen(true);
              }}
              onDelete={deleteOrder}
              onToggleArchive={toggleArchive}
            />
          )}
        </div>
      </div>

      <OrderModal
        open={modalOpen}
        order={activeOrder}
        busy={busy}
        onClose={() => {
          if (!busy) {
            setModalOpen(false);
            setActiveOrder(null);
          }
        }}
        onSubmit={submitOrder}
      />
    </>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="rounded-[26px] border border-ajn-line bg-white/[0.03] p-5">
      <p className="mb-3 text-sm text-ajn-goldSoft">{title}</p>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-4xl font-bold text-white">{value}</span>
        <span className="rounded-full border border-ajn-line px-3 py-1 text-xs text-ajn-goldSoft">
          مباشر
        </span>
      </div>
      <p className="text-sm text-ajn-muted">{subtitle}</p>
    </div>
  );
}
