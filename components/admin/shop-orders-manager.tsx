"use client";

import {
  BellRing,
  Copy,
  ExternalLink,
  MessageCircleMore,
  Package2,
  Printer,
  Receipt,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PreviewImage } from "@/components/ui/preview-image";
import { Select } from "@/components/ui/select";
import { SHOP_ORDER_STATUSES, SHOP_PAYMENT_METHOD_LABELS } from "@/lib/shop-constants";
import type { DeliveryAgentRecord, ShopOrderRecord } from "@/lib/shop-types";
import {
  buildProductImageProxyUrl,
  buildShopOrderWhatsAppUrl,
  getCustomizationSummaryEntries,
} from "@/lib/shop-utils";
import { formatAmountWithCurrency, formatDateTime } from "@/lib/utils";

export function ShopOrdersManager() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ShopOrderRecord[]>([]);
  const [drivers, setDrivers] = useState<DeliveryAgentRecord[]>([]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const [ordersResponse, driversResponse] = await Promise.all([
        fetch("/api/admin/shop/orders", { cache: "no-store" }),
        fetch("/api/admin/shop/drivers", { cache: "no-store" }),
      ]);
      const ordersPayload = (await ordersResponse.json()) as { message?: string; orders?: ShopOrderRecord[] };
      const driversPayload = (await driversResponse.json()) as { message?: string; drivers?: DeliveryAgentRecord[] };

      if (!ordersResponse.ok) {
        throw new Error(ordersPayload.message || "تعذر تحميل طلبات المتجر.");
      }

      if (!driversResponse.ok) {
        throw new Error(driversPayload.message || "تعذر تحميل المندوبين.");
      }

      setOrders(ordersPayload.orders ?? []);
      setDrivers(driversPayload.drivers ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل طلبات المتجر.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/shop/orders/${orderId}`, {
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

  const assignDriver = async (orderId: string, driverId: string) => {
    try {
      const response = await fetch(`/api/admin/shop/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assigned_driver_id: driverId }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تعيين المندوب.");
      }

      toast.success(driverId ? "تم تعيين المندوب." : "تم إلغاء تعيين المندوب.");
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تعيين المندوب.");
    }
  };

  const updatePrintState = async (
    orderId: string,
    payload: {
      print_status?: "pending" | "printed" | "failed";
      reset_printed_at?: boolean;
    },
  ) => {
    try {
      const response = await fetch(`/api/admin/shop/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || "تعذر تحديث حالة الطباعة.");
      }

      toast.success("تم تحديث حالة الطباعة.");
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث حالة الطباعة.");
    }
  };

  const removeOrder = async (orderId: string) => {
    if (!window.confirm("سيتم حذف الطلب وإرجاع الكميات للمخزن، هل أنت متأكد؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shop/orders/${orderId}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف الطلب.");
      }

      toast.success(payload.message || "تم حذف الطلب.");
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الطلب.");
    }
  };

  const copyTrackingCode = async (orderCode: string) => {
    try {
      await navigator.clipboard.writeText(orderCode);
      toast.success("تم نسخ رقم التتبع.");
    } catch {
      toast.error("تعذر نسخ الرقم.");
    }
  };

  const openInvoice = (orderCode: string, autoPrint = false) => {
    const suffix = autoPrint ? "?print=1" : "";
    window.open(`/shop-invoice/${encodeURIComponent(orderCode)}${suffix}`, "_blank", "noopener,noreferrer");
  };

  const sendTrackingWhatsApp = (order: ShopOrderRecord) => {
    const whatsappUrl = buildShopOrderWhatsAppUrl(order);

    if (!whatsappUrl) {
      toast.error("رقم الزبون غير صالح.");
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const sendManualNotification = async (order: ShopOrderRecord) => {
    if (!order.customer_user_id) {
      toast.error("هذا الطلب غير مرتبط بحساب زبون.");
      return;
    }

    const title = window.prompt("عنوان الإشعار", "تحديث على الطلب");
    if (!title) {
      return;
    }

    const body = window.prompt("نص الإشعار", `تم تحديث طلبك ${order.order_code}.`);
    if (!body) {
      return;
    }

    try {
      const response = await fetch("/api/admin/shop/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: order.customer_user_id,
          shop_order_id: order.id,
          title,
          body,
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر إرسال الإشعار.");
      }

      toast.success(payload.message || "تم إرسال الإشعار.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إرسال الإشعار.");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface-panel p-5">
            <div className="shimmer-skeleton mb-4 h-6 w-40 rounded-full" />
            <div className="shimmer-skeleton mb-3 h-4 w-full rounded-full" />
            <div className="shimmer-skeleton mb-3 h-4 w-3/4 rounded-full" />
            <div className="shimmer-skeleton h-24 rounded-[24px]" />
          </div>
        ))}
      </div>
    );
  }

  if (!orders.length) {
    return <div className="luxury-empty">لا توجد طلبات متجر.</div>;
  }

  return (
    <section className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="surface-panel p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{order.customer_name}</h2>
                <span className="rounded-full border border-ajn-gold/25 bg-ajn-gold/[0.10] px-3 py-1 text-xs font-semibold text-ajn-gold">
                  {order.order_code}
                </span>
              </div>
              <div className="grid gap-2 text-sm text-ajn-muted sm:grid-cols-2">
                <p>الهاتف: {order.phone}</p>
                <p>التتبع: {order.order_code}</p>
                <p>المحافظة: {order.province || order.city}</p>
                <p>المنطقة: {order.district || "—"}</p>
                <p>العنوان: {order.address}</p>
                <p>نوع التوصيل: {order.delivery_type || "توصيل"}</p>
                <p>الوقت المتوقع: {order.delivery_eta || "—"}</p>
                <p>الطلب: {formatDateTime(order.created_at)}</p>
                <p>الدفع: {SHOP_PAYMENT_METHOD_LABELS[order.payment_method]}</p>
                <p>التغليف: {order.wrapping_enabled ? "نعم" : "لا"}</p>
                <p>المندوب: {order.assigned_driver_name || "غير محدد"}</p>
                <p>الطباعة: {getPrintStatusLabel(order.print_status)}</p>
                <p>آخر طباعة: {order.printed_at ? formatDateTime(order.printed_at) : "غير مطبوع"}</p>
                <p>محاولات الطباعة: {order.print_attempts}</p>
              </div>
              {order.driver_notes ? <p className="text-sm text-white">ملاحظات السائق: {order.driver_notes}</p> : null}
              {order.google_maps_url ? (
                <a
                  href={order.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-ajn-gold"
                >
                  <ExternalLink className="h-4 w-4" />
                  Google Maps
                </a>
              ) : null}
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-[280px]">
              <Select
                value={order.status}
                onChange={(event) => void updateStatus(order.id, event.target.value)}
              >
                {SHOP_ORDER_STATUSES.map((status) => (
                  <option key={status} value={status} className="bg-black">
                    {status}
                  </option>
                ))}
              </Select>
              <Select
                value={order.assigned_driver_id ?? ""}
                onChange={(event) => void assignDriver(order.id, event.target.value)}
              >
                <option value="" className="bg-black">
                  بدون مندوب
                </option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id} className="bg-black">
                    {driver.name}
                  </option>
                ))}
              </Select>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="secondary" onClick={() => void copyTrackingCode(order.order_code)}>
                  <Copy className="h-4 w-4" />
                  نسخ الكود
                </Button>
                <Button variant="secondary" onClick={() => openInvoice(order.order_code)}>
                  <Receipt className="h-4 w-4" />
                  الفاتورة
                </Button>
                <Button variant="secondary" onClick={() => openInvoice(order.order_code, true)}>
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
                <Button variant="secondary" onClick={() => sendTrackingWhatsApp(order)}>
                  <MessageCircleMore className="h-4 w-4" />
                  واتساب
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void sendManualNotification(order)}
                  disabled={!order.customer_user_id}
                >
                  <BellRing className="h-4 w-4" />
                  إشعار يدوي
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void updatePrintState(order.id, { print_status: "pending", reset_printed_at: true })}
                >
                  <Printer className="h-4 w-4" />
                  إعادة طباعة
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void updatePrintState(order.id, { print_status: "pending", reset_printed_at: true })}
                >
                  <Truck className="h-4 w-4" />
                  جعلها pending
                </Button>
              </div>
              <Button variant="danger" onClick={() => void removeOrder(order.id)}>
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-black/20 p-3">
                  <PreviewImage
                    src={buildProductImageProxyUrl(item.product_image)}
                    alt={item.product_name}
                    containerClassName="h-16 w-16 rounded-2xl bg-white/[0.04] p-2"
                    imageClassName="object-contain"
                    fallback={
                      <div className="flex h-full items-center justify-center text-ajn-gold">
                        <Package2 className="h-6 w-6" />
                      </div>
                    }
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{item.product_name}</p>
                    {item.selected_color_name || item.selected_color_hex ? (
                      <div className="mt-1 flex items-center gap-2 text-xs text-ajn-muted">
                        <span>اللون:</span>
                        {item.selected_color_hex ? (
                          <span
                            className="inline-flex h-3.5 w-3.5 rounded-full border border-white/15"
                            style={{ backgroundColor: item.selected_color_hex }}
                          />
                        ) : null}
                        <span>{item.selected_color_name || item.selected_color_hex}</span>
                      </div>
                    ) : null}
                    <p className="text-sm text-ajn-muted">
                      {formatAmountWithCurrency(item.price)} x {item.quantity}
                    </p>
                    {getCustomizationSummaryEntries(item.customization).length ? (
                      <div className="mt-2 space-y-1 text-xs text-ajn-muted">
                        {getCustomizationSummaryEntries(item.customization).map((entry) => (
                          <p key={`${item.id}-${entry.label}`}>
                            {entry.label}: <span className="text-white">{entry.value}</span>
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-ajn-gold">{formatAmountWithCurrency(item.total)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5">
              <div className="space-y-3 text-sm">
                <SummaryLine label="المجموع" value={formatAmountWithCurrency(order.subtotal)} />
                <SummaryLine label="التوصيل" value={formatAmountWithCurrency(order.delivery_fee)} />
                <SummaryLine label="التغليف" value={formatAmountWithCurrency(order.wrapping_price)} />
                <SummaryLine label="الإجمالي" value={formatAmountWithCurrency(order.total)} strong />
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function getPrintStatusLabel(status: ShopOrderRecord["print_status"]) {
  switch (status) {
    case "printed":
      return "printed";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-semibold text-white" : "text-ajn-muted"}>{label}</span>
      <span className={strong ? "text-lg font-bold text-ajn-gold" : "font-semibold text-white"}>{value}</span>
    </div>
  );
}
