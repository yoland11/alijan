"use client";

import { CreditCard, MapPinned, MapPin, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useShopCart } from "@/components/shop/cart-provider";
import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { Button } from "@/components/ui/button";
import { HomeLinkButton } from "@/components/ui/home-link-button";
import { Input } from "@/components/ui/input";
import { PreviewImage } from "@/components/ui/preview-image";
import { Textarea } from "@/components/ui/textarea";
import type { ShopSettingsRecord, ShopPaymentMethod } from "@/lib/shop-types";
import {
  buildGoogleMapsUrl,
  buildProductImageProxyUrl,
  getProductImagePresentation,
  getShopPaymentMethodLabel,
} from "@/lib/shop-utils";
import { formatAmountWithCurrency } from "@/lib/utils";

const defaultSettings: ShopSettingsRecord = {
  id: "",
  mastercard_qr_url: "",
  wrapping_price: 0,
  delivery_fee: 0,
  delivery_time_text: "40 - 50 دقائق",
  updated_at: "",
};

export function CheckoutPageClient() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useShopCart();
  const [settings, setSettings] = useState<ShopSettingsRecord>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<ShopPaymentMethod>("cash");
  const [wrappingEnabled, setWrappingEnabled] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [driverNotes, setDriverNotes] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [locating, setLocating] = useState(false);
  const [showManualMap, setShowManualMap] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/shop/catalog", { cache: "no-store" });
        const payload = (await response.json()) as { settings?: ShopSettingsRecord; message?: string };

        if (!response.ok) {
          throw new Error(payload.message || "تعذر تحميل الإعدادات.");
        }

        setSettings(payload.settings ?? defaultSettings);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر تحميل الإعدادات.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const wrappingPrice = wrappingEnabled ? settings.wrapping_price : 0;
  const total = useMemo(
    () => subtotal + settings.delivery_fee + wrappingPrice,
    [settings.delivery_fee, subtotal, wrappingPrice],
  );

  const locate = () => {
    if (!navigator.geolocation) {
      setShowManualMap(true);
      toast.error("الموقع غير متاح.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(7));
        const lng = Number(position.coords.longitude.toFixed(7));
        const url = buildGoogleMapsUrl(lat, lng);
        setLocationLat(lat);
        setLocationLng(lng);
        setGoogleMapsUrl(url);
        setShowManualMap(false);
        setLocating(false);
        toast.success("تم تحديد الموقع.");
      },
      () => {
        setLocating(false);
        setShowManualMap(true);
        toast.error("أدخل الرابط يدويًا.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  };

  const submitOrder = async () => {
    if (!items.length) {
      toast.error("السلة فارغة.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/shop/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName,
          phone,
          city,
          address,
          driver_notes: driverNotes,
          location_lat: locationLat,
          location_lng: locationLng,
          google_maps_url: googleMapsUrl,
          payment_method: paymentMethod,
          wrapping_enabled: wrappingEnabled,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            selected_color_name: item.selected_color_name,
            selected_color_hex: item.selected_color_hex,
          })),
        }),
      });

      const payload = (await response.json()) as { message?: string; order?: { order_code?: string } };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر إتمام الطلب.");
      }

      const orderCode = payload.order?.order_code ?? "";
      clearCart();
      toast.success("تم إتمام الطلب.");
      if (orderCode) {
        router.push(`/shop-success?code=${encodeURIComponent(orderCode)}`);
        return;
      }

      router.push("/services");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إتمام الطلب.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell pb-[calc(9rem+env(safe-area-inset-bottom))] pt-6 sm:pt-10">
      <div className="section-shell space-y-6">
        <HomeLinkButton />

        <AnimatedServicePanel className="sticky-shell surface-panel-strong noise-overlay p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">إتمام الشراء</h1>
            <Link
              href="/cart"
              className="inline-flex h-11 items-center rounded-2xl border border-ajn-line bg-white/[0.05] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              رجوع
            </Link>
          </div>
        </AnimatedServicePanel>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="surface-panel p-6">
                <div className="shimmer-skeleton mb-4 h-6 w-40 rounded-full" />
                <div className="shimmer-skeleton mb-3 h-12 rounded-2xl" />
                <div className="shimmer-skeleton h-24 rounded-[24px]" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading ? (
          <>
            <CheckoutCard icon={<Truck className="h-5 w-5" />} title="وقت التوصيل">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-lg font-semibold text-white">في {settings.delivery_time_text}</p>
                <Button variant="secondary" className="h-10 px-4" onClick={() => toast.message("عدّل الوقت من الإدارة.")}>
                  تغيير
                </Button>
              </div>
            </CheckoutCard>

            <CheckoutCard icon={<MapPinned className="h-5 w-5" />} title="عنوان التوصيل">
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="الاسم الكامل" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                <Input placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" pattern="[0-9]*" />
                <Input placeholder="المحافظة / المدينة" value={city} onChange={(e) => setCity(e.target.value)} />
                <Input placeholder="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={locate} disabled={locating}>
                  <MapPin className="h-4 w-4" />
                  {locating ? "جاري التحديد..." : "تحديد موقعي"}
                </Button>
                {googleMapsUrl ? (
                  <div className="rounded-2xl border border-ajn-gold/20 bg-ajn-gold/[0.08] p-4">
                    <p className="text-sm font-semibold text-ajn-gold">
                      {locationLat !== null && locationLng !== null ? "تم تحديد موقعك" : "تم إضافة موقعك"}
                    </p>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-sm font-semibold text-white underline-offset-4 transition hover:text-ajn-gold hover:underline"
                    >
                      عرض موقعي على الخريطة
                    </a>
                    {locationLat !== null && locationLng !== null ? (
                      <p className="mt-2 text-xs text-ajn-muted">
                        {locationLat}, {locationLng}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {showManualMap ? (
                  <Input
                    placeholder="رابط Google Maps"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  />
                ) : null}
                <Textarea
                  placeholder="تعليمات السائق"
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                />
              </div>
            </CheckoutCard>

            <CheckoutCard icon={<CreditCard className="h-5 w-5" />} title="طريقة الدفع">
              <div className="grid gap-3 sm:grid-cols-2">
                {(["cash", "mastercard"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-[22px] border px-4 py-4 text-right transition ${
                      paymentMethod === method
                        ? "border-ajn-gold bg-ajn-gold/[0.12] text-ajn-gold"
                        : "border-ajn-line bg-white/[0.03] text-white hover:border-ajn-gold/40"
                    }`}
                  >
                    <p className="font-semibold">{getShopPaymentMethodLabel(method)}</p>
                  </button>
                ))}
              </div>

              {paymentMethod === "mastercard" && settings.mastercard_qr_url ? (
                <div className="mt-4 rounded-3xl border border-ajn-line bg-white/[0.03] p-5 text-center">
                  <PreviewImage
                    src={buildProductImageProxyUrl(settings.mastercard_qr_url)}
                    alt="QR"
                    containerClassName="mx-auto mb-4 h-52 max-w-[220px] rounded-2xl bg-white p-3"
                    imageClassName="object-contain"
                  />
                  <p className="text-sm font-semibold text-white">امسح QR للدفع الإلكتروني</p>
                </div>
              ) : null}
            </CheckoutCard>

            <CheckoutCard icon={<PackageCheck className="h-5 w-5" />} title="خدمات أخرى">
              <button
                type="button"
                onClick={() => setWrappingEnabled((current) => !current)}
                className={`w-full rounded-[22px] border px-4 py-4 text-right transition ${
                  wrappingEnabled
                    ? "border-ajn-gold bg-ajn-gold/[0.12] text-ajn-gold"
                    : "border-ajn-line bg-white/[0.03] text-white hover:border-ajn-gold/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">تغليف</span>
                  <span className="text-sm">{formatAmountWithCurrency(settings.wrapping_price)}</span>
                </div>
              </button>
            </CheckoutCard>

            <CheckoutCard icon={<ShoppingBag className="h-5 w-5" />} title="ملخص الطلب">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.cart_key} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-black/20 p-3">
                    {(() => {
                      const imagePresentation = getProductImagePresentation(item);

                      return (
                        <PreviewImage
                          src={buildProductImageProxyUrl(item.thumbnail_url || item.image_url)}
                          previewSrc={buildProductImageProxyUrl(item.image_url)}
                          alt={item.name}
                          containerClassName="h-16 w-16 rounded-2xl bg-white/[0.04] p-2"
                          imageStyle={{
                            objectFit: imagePresentation.objectFit,
                            objectPosition: imagePresentation.objectPosition,
                            transform: imagePresentation.transform,
                            transformOrigin: imagePresentation.transformOrigin,
                          }}
                          previewImageStyle={{
                            objectFit: imagePresentation.objectFit,
                            objectPosition: imagePresentation.objectPosition,
                          }}
                          imageClassName="object-contain"
                          fallback={
                            <div className="flex h-full items-center justify-center text-ajn-gold">
                              <ShoppingBag className="h-6 w-6" />
                            </div>
                          }
                        />
                      );
                    })()}
                    <div className="flex-1">
                      <p className="font-semibold text-white">{item.name}</p>
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
                      <p className="text-sm text-ajn-muted">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-ajn-gold">
                      {formatAmountWithCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}

                <SummaryRow label="المجموع الجزئي" value={formatAmountWithCurrency(subtotal)} />
                <SummaryRow label="التوصيل" value={formatAmountWithCurrency(settings.delivery_fee)} />
                {wrappingEnabled ? (
                  <SummaryRow label="التغليف" value={formatAmountWithCurrency(wrappingPrice)} />
                ) : null}
                <SummaryRow
                  label="المجموع النهائي"
                  value={formatAmountWithCurrency(total)}
                  strong
                />
              </div>
            </CheckoutCard>
          </>
        ) : null}
      </div>

      {!loading ? (
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-ajn-line bg-black/88 px-4 pt-3 backdrop-blur-xl"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex-1">
              <p className="text-sm text-ajn-muted">المجموع</p>
              <p className="text-lg font-bold text-ajn-gold">{formatAmountWithCurrency(total)}</p>
            </div>
            <Button className="h-12 w-full sm:min-w-[180px] sm:w-auto" onClick={submitOrder} disabled={submitting || !items.length}>
              {submitting ? "جاري الإرسال..." : "إتمام الطلب"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CheckoutCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="surface-panel p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3 text-ajn-gold">
        <span className="shrink-0">{icon}</span>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-semibold text-white" : "text-ajn-muted"}>{label}</span>
      <span className={strong ? "text-lg font-bold text-ajn-gold" : "font-semibold text-white"}>{value}</span>
    </div>
  );
}
