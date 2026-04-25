"use client";

import { useCallback, useEffect, useState } from "react";
import { ChartColumnBig, Filter, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { LogoutButton } from "@/components/admin/logout-button";
import { OrderModal } from "@/components/admin/order-modal";
import { OrdersTable } from "@/components/admin/orders-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { COMPLETED_STATUSES, DASHBOARD_STATUS_FILTERS, ORDER_STATUSES } from "@/lib/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { OrderRecord } from "@/lib/types";
import { buildCompletedOrderWhatsAppUrl, buildCustomerOrderWhatsAppUrl } from "@/lib/utils";
import type { OrderSchema } from "@/lib/validators";

export function DashboardClient() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof DASHBOARD_STATUS_FILTERS)[number]>("الكل");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);

  const refreshOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const payload = (await response.json()) as { message?: string; orders?: OrderRecord[] };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحميل الطلبات.");
      }

      setOrders(payload.orders ?? []);
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
        order.photographer,
        order.session_type,
        order.notes,
        order.total_amount,
        order.received_amount,
        order.remaining_amount,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "الكل"
        ? true
        : statusFilter === "الطلبات النشطة"
          ? !COMPLETED_STATUSES.includes(order.status as (typeof COMPLETED_STATUSES)[number])
          : statusFilter === "تم الاكتمال"
            ? order.status === "مكتمل"
            : order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeOrders = orders.filter(
    (order) => !COMPLETED_STATUSES.includes(order.status as (typeof COMPLETED_STATUSES)[number]),
  ).length;
  const completedOrders = orders.filter((order) => order.status === "مكتمل").length;
  const deliveredOrders = orders.filter((order) => order.status === "تم التسليم").length;

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
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حفظ الطلب.");
      }

      toast.success(activeOrder ? "تم تحديث الطلب." : "تم إنشاء الطلب.");
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

  const openCustomerWhatsApp = (order: OrderRecord) => {
    const whatsappUrl = buildCustomerOrderWhatsAppUrl(order);

    if (!whatsappUrl) {
      toast.error("رقم الزبون غير صالح لإرسال رسالة واتساب.");
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const openCompletedOrderWhatsApp = (order: OrderRecord) => {
    if (order.status !== "مكتمل") {
      toast.error("إشعار الاكتمال يظهر فقط عندما تكون حالة الطلب مكتمل.");
      return;
    }

    const whatsappUrl = buildCompletedOrderWhatsAppUrl(order);

    if (!whatsappUrl) {
      toast.error("رقم الزبون غير صالح لإرسال إشعار الاكتمال.");
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const openInvoicePrint = (order: OrderRecord) => {
    window.open(`/admin/invoices/${order.id}?print=1`, "_blank", "noopener,noreferrer");
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
              </div>

              <div className="flex flex-wrap items-center gap-3">
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
              <MetricCard
                title="إجمالي الطلبات"
                value={orders.length}
                subtitle="جميع الطلبات المسجلة"
                active={statusFilter === "الكل"}
                onClick={() => setStatusFilter("الكل")}
              />
              <MetricCard
                title="الطلبات النشطة"
                value={activeOrders}
                subtitle="الطلبات قيد التنفيذ"
                active={statusFilter === "الطلبات النشطة"}
                onClick={() => setStatusFilter("الطلبات النشطة")}
              />
              <MetricCard
                title="تم الاكتمال"
                value={completedOrders}
                subtitle="طلبات جاهزة للتسليم"
                active={statusFilter === "تم الاكتمال"}
                onClick={() => setStatusFilter("تم الاكتمال")}
              />
              <MetricCard
                title="تم التسليم"
                value={deliveredOrders}
                subtitle="طلبات تم تسليمها"
                active={statusFilter === "تم التسليم"}
                onClick={() => setStatusFilter("تم التسليم")}
              />
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
                {ORDER_STATUSES.length} حالات تشغيل + فرز ذكي
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className="relative">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ajn-muted" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ابحث بالاسم أو الهاتف أو الكود أو الملاحظات أو الكادر أو نوع الجلسة"
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
                      {getDashboardFilterLabel(status)}
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
              onTrackingWhatsApp={openCustomerWhatsApp}
              onCompletionWhatsApp={openCompletedOrderWhatsApp}
              onPrintInvoice={openInvoicePrint}
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
  active = false,
  onClick,
}: {
  title: string;
  value: number;
  subtitle: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[26px] border p-5 text-right transition ${
        active
          ? "border-ajn-gold/40 bg-ajn-gold/[0.08]"
          : "border-ajn-line bg-white/[0.03] hover:border-ajn-gold/30 hover:bg-white/[0.05]"
      }`}
    >
      <p className="mb-3 text-sm text-ajn-goldSoft">{title}</p>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-4xl font-bold text-white">{value}</span>
        <span className="rounded-full border border-ajn-line px-3 py-1 text-xs text-ajn-goldSoft">
          مباشر
        </span>
      </div>
      <p className="text-sm text-ajn-muted">{subtitle}</p>
    </button>
  );
}

function getDashboardFilterLabel(filter: (typeof DASHBOARD_STATUS_FILTERS)[number]) {
  switch (filter) {
    case "الطلبات النشطة":
      return "الطلبات النشطة";
    case "تم الاكتمال":
      return "تم الاكتمال";
    case "قيد التنفيذ":
      return "قيد التنفيذ / جاري المتابعة";
    case "جاري التصوير":
      return "جاري التصوير / أثناء التصوير";
    case "المونتاج":
      return "المونتاج / قيد المونتاج";
    case "مكتمل":
      return "مكتمل / جاهز للتسليم";
    default:
      return filter;
  }
}
