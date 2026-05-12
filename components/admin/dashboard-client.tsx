"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Filter, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { ShopCatalogManager } from "@/components/admin/shop-catalog-manager";
import { DeliveryAgentsManager } from "@/components/admin/delivery-agents-manager";
import { ShopOrdersManager } from "@/components/admin/shop-orders-manager";
import { ShopAnalyticsManager } from "@/components/admin/shop-analytics-manager";
import { ShopSettingsManager } from "@/components/admin/shop-settings-manager";
import { PortfolioManager } from "@/components/admin/portfolio-manager";
import { LogoutButton } from "@/components/admin/logout-button";
import { OrderModal } from "@/components/admin/order-modal";
import { OrdersTable } from "@/components/admin/orders-table";
import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  COMPLETED_STATUSES,
  COMPLETION_READY_STATUSES,
  DASHBOARD_STATUS_FILTERS,
} from "@/lib/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { OrderRecord } from "@/lib/types";
import {
  buildCompletedOrderWhatsAppUrl,
  buildCustomerOrderWhatsAppUrl,
  getOrderSearchableText,
  isCompletionReadyStatus,
} from "@/lib/utils";
import type { OrderSchema } from "@/lib/validators";

export function DashboardClient() {
  const [adminSection, setAdminSection] = useState<
    "orders" | "catalog" | "shopOrders" | "analytics" | "drivers" | "portfolio" | "settings"
  >("orders");
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
      getOrderSearchableText(order).includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "الكل"
        ? true
        : statusFilter === "الطلبات النشطة"
          ? !COMPLETED_STATUSES.includes(order.status as (typeof COMPLETED_STATUSES)[number])
          : statusFilter === "تم الاكتمال"
            ? COMPLETION_READY_STATUSES.includes(
                order.status as (typeof COMPLETION_READY_STATUSES)[number],
              )
            : order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeOrders = orders.filter(
    (order) => !COMPLETED_STATUSES.includes(order.status as (typeof COMPLETED_STATUSES)[number]),
  ).length;
  const completedOrders = orders.filter((order) => isCompletionReadyStatus(order.status)).length;
  const deliveredOrders = orders.filter((order) => order.status === "تم التسليم").length;

  const submitOrder = async (
    values: OrderSchema,
    uploads: { imageFiles: File[]; researchFiles: File[] },
  ) => {
    setBusy(true);

    try {
      let imageUrls = values.images;
      let researchFiles = values.research_files;

      if (uploads.imageFiles.length) {
        const uploadBody = new FormData();
        uploads.imageFiles.forEach((file) => uploadBody.append("files", file));

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

      if (uploads.researchFiles.length) {
        const uploadBody = new FormData();
        uploads.researchFiles.forEach((file) => uploadBody.append("files", file));

        const uploadResponse = await fetch("/api/admin/media?kind=research-pdf", {
          method: "POST",
          body: uploadBody,
        });
        const uploadPayload = (await uploadResponse.json()) as {
          message?: string;
          files?: { name: string; url: string }[];
        };

        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.message || "تعذر رفع ملفات PDF.");
        }

        researchFiles = [...values.research_files, ...(uploadPayload.files ?? [])];
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
          research_files: researchFiles,
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
    if (!isCompletionReadyStatus(order.status)) {
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
      <div className="page-shell pb-14 pt-6 sm:pb-16 sm:pt-10">
        <div className="section-shell space-y-7 sm:space-y-8">
          <AnimatedServicePanel className="sticky-shell surface-panel-strong noise-overlay p-5 sm:p-10">
            <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white sm:text-5xl">إدارة الحجوزات والطلبات</h1>
                <p className="mt-2 text-sm text-ajn-muted">لوحة AJN</p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                {adminSection === "orders" ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setActiveOrder(null);
                      setModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    طلب جديد
                  </Button>
                ) : null}
                <LogoutButton className="w-full sm:w-auto" />
              </div>
            </div>

            <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
              <SectionTab active={adminSection === "orders"} onClick={() => setAdminSection("orders")}>
                الطلبات
              </SectionTab>
              <SectionTab active={adminSection === "catalog"} onClick={() => setAdminSection("catalog")}>
                إدارة الخدمات والمنتجات
              </SectionTab>
              <SectionTab active={adminSection === "shopOrders"} onClick={() => setAdminSection("shopOrders")}>
                طلبات المتجر
              </SectionTab>
              <SectionTab active={adminSection === "analytics"} onClick={() => setAdminSection("analytics")}>
                الإحصائيات
              </SectionTab>
              <SectionTab active={adminSection === "drivers"} onClick={() => setAdminSection("drivers")}>
                المندوبون
              </SectionTab>
              <SectionTab active={adminSection === "portfolio"} onClick={() => setAdminSection("portfolio")}>
                إدارة أعمالنا
              </SectionTab>
              <SectionTab active={adminSection === "settings"} onClick={() => setAdminSection("settings")}>
                إعدادات الدفع والتوصيل
              </SectionTab>
            </div>

            {adminSection === "orders" ? (
              <div className="grid gap-4 lg:grid-cols-4">
                <MetricCard
                  title="إجمالي الطلبات"
                  value={orders.length}
                  accent="from-ajn-gold/35 via-ajn-gold/10 to-transparent"
                  active={statusFilter === "الكل"}
                  onClick={() => setStatusFilter("الكل")}
                />
                <MetricCard
                  title="الطلبات النشطة"
                  value={activeOrders}
                  accent="from-sky-400/25 via-sky-400/10 to-transparent"
                  active={statusFilter === "الطلبات النشطة"}
                  onClick={() => setStatusFilter("الطلبات النشطة")}
                />
                <MetricCard
                  title="تم الاكتمال"
                  value={completedOrders}
                  accent="from-emerald-400/24 via-emerald-400/10 to-transparent"
                  active={statusFilter === "تم الاكتمال"}
                  onClick={() => setStatusFilter("تم الاكتمال")}
                />
                <MetricCard
                  title="تم التسليم"
                  value={deliveredOrders}
                  accent="from-violet-400/24 via-violet-400/10 to-transparent"
                  active={statusFilter === "تم التسليم"}
                  onClick={() => setStatusFilter("تم التسليم")}
                />
              </div>
            ) : null}
          </AnimatedServicePanel>

          {adminSection === "orders" ? (
            <>
              <section className="sticky-shell surface-panel p-5 sm:p-7">
                <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">بحث</h2>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ajn-muted" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="بحث"
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
                <section className="grid gap-4 xl:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="surface-panel p-5">
                      <div className="shimmer-skeleton mb-4 h-6 w-32 rounded-full" />
                      <div className="shimmer-skeleton mb-3 h-4 w-48 rounded-full" />
                      <div className="shimmer-skeleton mb-3 h-4 w-full rounded-full" />
                      <div className="shimmer-skeleton h-24 rounded-[24px]" />
                    </div>
                  ))}
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
            </>
          ) : null}

          {adminSection === "catalog" ? <ShopCatalogManager /> : null}
          {adminSection === "shopOrders" ? <ShopOrdersManager /> : null}
          {adminSection === "analytics" ? <ShopAnalyticsManager /> : null}
          {adminSection === "drivers" ? <DeliveryAgentsManager /> : null}
          {adminSection === "portfolio" ? <PortfolioManager /> : null}
          {adminSection === "settings" ? <ShopSettingsManager /> : null}
        </div>
      </div>

      <OrderModal
        open={adminSection === "orders" && modalOpen}
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

function SectionTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-2xl border px-4 py-2 text-center text-sm font-semibold leading-6 transition ${
        active
          ? "border-ajn-gold/35 bg-ajn-gold/[0.12] text-ajn-goldSoft"
          : "border-ajn-line bg-white/[0.03] text-white hover:bg-white/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}

function MetricCard({
  title,
  value,
  accent,
  active = false,
  onClick,
}: {
  title: string;
  value: number;
  accent: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`rounded-[26px] border p-5 text-right transition ${
        active
          ? "border-ajn-gold/40 bg-ajn-gold/[0.08]"
          : "border-ajn-line bg-white/[0.03] hover:border-ajn-gold/30 hover:bg-white/[0.05]"
      }`}
    >
      <div className={`mb-4 h-1.5 w-full rounded-full bg-gradient-to-l ${accent}`} />
      <p className="mb-3 text-sm text-ajn-goldSoft">{title}</p>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-4xl font-bold text-white">
          <CountUp value={value} />
        </span>
      </div>
    </motion.button>
  );
}

function getDashboardFilterLabel(filter: (typeof DASHBOARD_STATUS_FILTERS)[number]) {
  switch (filter) {
    case "الطلبات النشطة":
      return "الطلبات النشطة";
    case "تم الاكتمال":
      return "تم الاكتمال";
    case "قيد التنفيذ":
      return "قيد التنفيذ / جاري المتابعة / قيد المتابعة";
    case "جاري التصوير":
      return "جاري التصوير / أثناء التصوير / جاري التنصيب";
    case "المونتاج":
      return "المونتاج / قيد المونتاج";
    case "مكتمل":
      return "مكتمل / جاهز للتسليم";
    case "تم استلام الحجز":
      return "تم استلام الحجز";
    case "جاري إعداد وكتابة البحث":
      return "جاري إعداد وكتابة البحث";
    case "قيد التدقيق والمراجعة":
      return "قيد التدقيق والمراجعة";
    case "اكتمال النسخة الأولية":
      return "اكتمال النسخة الأولية";
    case "مراجعة المشرف العلمي":
      return "مراجعة المشرف العلمي";
    case "تنفيذ التعديلات المطلوبة":
      return "تنفيذ التعديلات المطلوبة";
    case "اكتمال البحث النهائي":
      return "اكتمال البحث النهائي";
    case "جاري المتابعة والتنسيق":
      return "جاري المتابعة والتنسيق";
    case "جاري الخياطة والتجهيز":
      return "جاري الخياطة والتجهيز";
    case "أثناء الطباعة والتغليف":
      return "أثناء الطباعة والتغليف";
    case "تم اكتمال الطلب":
      return "تم اكتمال الطلب";
    default:
      return filter;
  }
}
