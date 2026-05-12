"use client";

import { Bell, Heart, LogOut, MapPin, Package, RefreshCcw, Receipt, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useShopCart } from "@/components/shop/cart-provider";
import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { Button } from "@/components/ui/button";
import { HomeLinkButton } from "@/components/ui/home-link-button";
import { Input } from "@/components/ui/input";
import type {
  CustomerAccountDashboardPayload,
  ProductRecord,
  ShopOrderItemRecord,
} from "@/lib/shop-types";
import { formatAmountWithCurrency, formatDateTime } from "@/lib/utils";

type CustomerTab = "orders" | "addresses" | "favorites" | "notifications";

const defaultDashboard: CustomerAccountDashboardPayload | null = null;

function buildProductFromOrderItem(item: ShopOrderItemRecord): ProductRecord {
  return {
    id: item.product_id || item.id,
    category_id: "",
    name: item.product_name,
    description: "",
    price: item.price,
    image_url: item.product_image,
    thumbnail_url: item.product_image,
    image_fit: "contain",
    image_position: "center center",
    image_zoom: 1,
    color_options: [],
    preview_images: [],
    video_url: "",
    stock_quantity: null,
    customization_options: {
      enable_name: false,
      enable_message: false,
      enable_wrapping_note: false,
      enable_special_color: false,
      enable_occasion_date: false,
      enable_customer_image: false,
    },
    is_active: true,
    sort_order: 0,
    created_at: "",
    updated_at: "",
  };
}

export function CustomerDashboardClient() {
  const router = useRouter();
  const { addItem } = useShopCart();
  const [activeTab, setActiveTab] = useState<CustomerTab>("orders");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<CustomerAccountDashboardPayload | null>(defaultDashboard);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    id: "",
    label: "",
    province: "",
    district: "",
    address: "",
    phone: "",
    google_maps_url: "",
    is_default: false,
  });

  const unreadCount = useMemo(
    () => dashboard?.notifications.filter((item) => !item.is_read).length ?? 0,
    [dashboard?.notifications],
  );

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/account/dashboard", { cache: "no-store" });

      if (response.status === 401) {
        router.replace("/account/login");
        return;
      }

      const payload = (await response.json()) as CustomerAccountDashboardPayload & { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحميل الحساب.");
      }

      setDashboard(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل الحساب.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  const logout = async () => {
    await fetch("/api/account/logout", { method: "POST" });
    toast.success("تم تسجيل الخروج.");
    router.push("/");
    router.refresh();
  };

  const saveAddress = async () => {
    try {
      setSavingAddress(true);
      const response = await fetch("/api/account/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressForm),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حفظ العنوان.");
      }

      toast.success(payload.message || "تم حفظ العنوان.");
      setAddressForm({
        id: "",
        label: "",
        province: "",
        district: "",
        address: "",
        phone: "",
        google_maps_url: "",
        is_default: false,
      });
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ العنوان.");
    } finally {
      setSavingAddress(false);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const response = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف العنوان.");
      }

      toast.success(payload.message || "تم حذف العنوان.");
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف العنوان.");
    }
  };

  const markNotificationsRead = async () => {
    try {
      const response = await fetch("/api/account/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحديث الإشعارات.");
      }

      toast.success("تم تعليم الإشعارات كمقروءة.");
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث الإشعارات.");
    }
  };

  const toggleFavorite = async (productId: string) => {
    try {
      const response = await fetch("/api/account/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحديث المفضلة.");
      }

      toast.success(payload.message || "تم تحديث المفضلة.");
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث المفضلة.");
    }
  };

  const reorderShopOrder = (items: ShopOrderItemRecord[]) => {
    items.forEach((item) => {
      addItem(
        buildProductFromOrderItem(item),
        item.quantity,
        item.selected_color_name || item.selected_color_hex
          ? {
              id: `${item.id}-color`,
              color_name: item.selected_color_name,
              color_hex: item.selected_color_hex,
              sort_order: 0,
            }
          : null,
        item.customization,
      );
    });
    router.push("/cart");
  };

  if (loading || !dashboard) {
    return (
      <div className="page-shell pb-24 pt-8 sm:pt-12">
        <div className="section-shell space-y-4">
          <div className="shimmer-skeleton h-14 rounded-[24px]" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="shimmer-skeleton h-40 rounded-[24px]" />
            <div className="shimmer-skeleton h-40 rounded-[24px]" />
            <div className="shimmer-skeleton h-40 rounded-[24px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell pb-24 pt-8 sm:pt-12">
      <div className="section-shell space-y-6">
        <HomeLinkButton />

        <AnimatedServicePanel className="surface-panel-strong noise-overlay p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{dashboard.customer.full_name}</h1>
              <p className="mt-2 text-sm text-ajn-muted">{dashboard.customer.phone}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/services"
                className="inline-flex h-11 items-center rounded-2xl border border-ajn-line bg-white/[0.05] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                المتجر
              </Link>
              <Button variant="secondary" onClick={logout}>
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <AccountTab active={activeTab === "orders"} onClick={() => setActiveTab("orders")} label="طلباتي" />
            <AccountTab active={activeTab === "addresses"} onClick={() => setActiveTab("addresses")} label="العناوين" />
            <AccountTab active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")} label="المفضلة" />
            <AccountTab
              active={activeTab === "notifications"}
              onClick={() => setActiveTab("notifications")}
              label={unreadCount ? `الإشعارات (${unreadCount})` : "الإشعارات"}
            />
          </div>
        </AnimatedServicePanel>

        {activeTab === "orders" ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="surface-panel p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-ajn-gold" />
                <h2 className="text-xl font-bold text-white">طلبات المتجر</h2>
              </div>
              <div className="space-y-4">
                {dashboard.shopOrders.length ? (
                  dashboard.shopOrders.map((order) => (
                    <div key={order.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{order.order_code}</p>
                          <p className="text-xs text-ajn-muted">{formatDateTime(order.created_at)}</p>
                        </div>
                        <span className="rounded-full border border-ajn-gold/25 bg-ajn-gold/[0.08] px-3 py-1 text-xs font-semibold text-ajn-gold">
                          {order.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-ajn-muted">
                        <p>المجموع: <span className="font-semibold text-white">{formatAmountWithCurrency(order.total)}</span></p>
                        <p>العناصر: {order.items.length}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="secondary" className="h-10 px-4 text-xs" onClick={() => reorderShopOrder(order.items)}>
                          <RefreshCcw className="h-4 w-4" />
                          إعادة الطلب
                        </Button>
                        <Link
                          href={`/shop-track?code=${encodeURIComponent(order.order_code)}`}
                          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-ajn-line bg-white/[0.04] px-4 text-xs font-semibold text-white"
                        >
                          تتبع
                        </Link>
                        <Link
                          href={`/shop-receipt/${encodeURIComponent(order.order_code)}`}
                          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-ajn-line bg-white/[0.04] px-4 text-xs font-semibold text-white"
                        >
                          <Receipt className="h-4 w-4" />
                          الفاتورة
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="luxury-empty">لا توجد طلبات متجر.</div>
                )}
              </div>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <Package className="h-5 w-5 text-ajn-gold" />
                <h2 className="text-xl font-bold text-white">طلبات الحجز</h2>
              </div>
              <div className="space-y-4">
                {dashboard.bookingOrders.length ? (
                  dashboard.bookingOrders.map((order) => (
                    <div key={order.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-white">{order.order_code}</p>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/80">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-ajn-muted">{formatDateTime(order.created_at)}</p>
                    </div>
                  ))
                ) : (
                  <div className="luxury-empty">لا توجد طلبات حجز.</div>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "addresses" ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="surface-panel p-5 sm:p-6">
              <h2 className="mb-4 text-xl font-bold text-white">عناويني</h2>
              <div className="space-y-4">
                {dashboard.addresses.length ? (
                  dashboard.addresses.map((address) => (
                    <div key={address.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-white">{address.label}</p>
                        {address.is_default ? (
                          <span className="rounded-full border border-ajn-gold/25 bg-ajn-gold/[0.08] px-3 py-1 text-xs font-semibold text-ajn-gold">
                            افتراضي
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-ajn-muted">{address.province} / {address.district}</p>
                      <p className="mt-2 text-sm text-white">{address.address}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="h-10 px-4 text-xs"
                          onClick={() =>
                            setAddressForm({
                              id: address.id,
                              label: address.label,
                              province: address.province,
                              district: address.district,
                              address: address.address,
                              phone: address.phone,
                              google_maps_url: address.google_maps_url,
                              is_default: address.is_default,
                            })
                          }
                        >
                          تعديل
                        </Button>
                        <Button variant="danger" className="h-10 px-4 text-xs" onClick={() => void deleteAddress(address.id)}>
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="luxury-empty">لا توجد عناوين محفوظة.</div>
                )}
              </div>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="mb-4 text-xl font-bold text-white">{addressForm.id ? "تعديل العنوان" : "عنوان جديد"}</h2>
              <div className="space-y-4">
                <Input placeholder="التسمية" value={addressForm.label} onChange={(event) => setAddressForm((current) => ({ ...current, label: event.target.value }))} />
                <Input placeholder="المحافظة" value={addressForm.province} onChange={(event) => setAddressForm((current) => ({ ...current, province: event.target.value }))} />
                <Input placeholder="المدينة / المنطقة" value={addressForm.district} onChange={(event) => setAddressForm((current) => ({ ...current, district: event.target.value }))} />
                <Input placeholder="العنوان" value={addressForm.address} onChange={(event) => setAddressForm((current) => ({ ...current, address: event.target.value }))} />
                <Input placeholder="رقم الهاتف" value={addressForm.phone} inputMode="numeric" pattern="[0-9]*" onChange={(event) => setAddressForm((current) => ({ ...current, phone: event.target.value }))} />
                <Input placeholder="رابط Google Maps" value={addressForm.google_maps_url} onChange={(event) => setAddressForm((current) => ({ ...current, google_maps_url: event.target.value }))} />
                <label className="flex items-center gap-3 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={addressForm.is_default}
                    onChange={(event) => setAddressForm((current) => ({ ...current, is_default: event.target.checked }))}
                  />
                  افتراضي
                </label>
                <Button className="w-full" onClick={saveAddress} disabled={savingAddress}>
                  {savingAddress ? "جاري الحفظ..." : "حفظ العنوان"}
                </Button>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "favorites" ? (
          <section className="surface-panel p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <Heart className="h-5 w-5 text-ajn-gold" />
              <h2 className="text-xl font-bold text-white">المفضلة</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.favorites.length ? (
                dashboard.favorites.map((product) => (
                  <div key={product.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <p className="font-semibold text-white">{product.name}</p>
                    <p className="mt-2 text-sm text-ajn-muted">{formatAmountWithCurrency(product.price)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="secondary" className="h-10 px-4 text-xs" onClick={() => addItem(product, 1, product.color_options[0] ?? null)}>
                        إضافة للسلة
                      </Button>
                      <Button variant="danger" className="h-10 px-4 text-xs" onClick={() => void toggleFavorite(product.id)}>
                        حذف
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="luxury-empty md:col-span-2 xl:col-span-3">لا توجد منتجات مفضلة.</div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "notifications" ? (
          <section className="surface-panel p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-ajn-gold" />
                <h2 className="text-xl font-bold text-white">الإشعارات</h2>
              </div>
              <Button variant="secondary" className="h-10 px-4 text-xs" onClick={() => void markNotificationsRead()}>
                تعليم الكل كمقروء
              </Button>
            </div>
            <div className="space-y-4">
              {dashboard.notifications.length ? (
                dashboard.notifications.map((notification) => (
                  <div key={notification.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-white">{notification.title}</p>
                      {!notification.is_read ? (
                        <span className="rounded-full border border-ajn-gold/25 bg-ajn-gold/[0.08] px-3 py-1 text-xs font-semibold text-ajn-gold">
                          جديد
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-ajn-muted">{notification.body}</p>
                    <p className="mt-2 text-xs text-white/60">{formatDateTime(notification.created_at)}</p>
                  </div>
                ))
              ) : (
                <div className="luxury-empty">لا توجد إشعارات.</div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function AccountTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-ajn-gold/40 bg-ajn-gold/[0.12] text-ajn-gold"
          : "border-ajn-line bg-white/[0.04] text-white hover:bg-white/[0.08]"
      }`}
    >
      {label}
    </button>
  );
}
