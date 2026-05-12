"use client";

import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PreviewImage } from "@/components/ui/preview-image";
import { Select } from "@/components/ui/select";
import type { ShopSettingsRecord } from "@/lib/shop-types";
import { SHOP_DEFAULT_DELIVERY_REGIONS } from "@/lib/shop-constants";
import { buildProductImageProxyUrl } from "@/lib/shop-utils";

const defaultSettings: ShopSettingsRecord = {
  id: "",
  mastercard_qr_url: "",
  wrapping_price: 0,
  delivery_fee: 0,
  delivery_time_text: "40 - 50 دقائق",
  delivery_regions: [...SHOP_DEFAULT_DELIVERY_REGIONS].map((item) => ({ ...item })),
  updated_at: "",
};

export function ShopSettingsManager() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/shop/settings", { cache: "no-store" });
      const payload = (await response.json()) as { message?: string; settings?: ShopSettingsRecord };

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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const deleteStoredImage = async (src: string) => {
    const response = await fetch("/api/admin/media", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ src }),
    });
    const payload = (await response.json()) as { message?: string; warning?: string | null };

    if (!response.ok) {
      throw new Error(payload.message || "تعذر حذف الصورة.");
    }

    return payload.warning ?? "";
  };

  const uploadQr = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("files", file);
      const response = await fetch("/api/admin/media?kind=payment-qr", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { message?: string; urls?: string[] };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر رفع الصورة.");
      }

      const uploadedUrl = payload.urls?.[0] ?? "";
      if (!uploadedUrl) {
        throw new Error("تعذر رفع الصورة.");
      }

      setSettings((current) => ({ ...current, mastercard_qr_url: uploadedUrl }));
      toast.success("تم رفع الصورة.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الصورة.");
    } finally {
      setUploading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/shop/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mastercard_qr_url: settings.mastercard_qr_url,
          wrapping_price: settings.wrapping_price,
          delivery_fee: settings.delivery_fee,
          delivery_time_text: settings.delivery_time_text,
          delivery_regions: settings.delivery_regions,
        }),
      });
      const payload = (await response.json()) as { message?: string; settings?: ShopSettingsRecord };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حفظ الإعدادات.");
      }

      setSettings(payload.settings ?? settings);
      toast.success("تم حفظ الإعدادات.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الإعدادات.");
    } finally {
      setSaving(false);
    }
  };

  const updateRegion = (id: string, key: keyof ShopSettingsRecord["delivery_regions"][number], value: string | boolean) => {
    setSettings((current) => ({
      ...current,
      delivery_regions: current.delivery_regions.map((region) =>
        region.id === id
          ? {
              ...region,
              [key]:
                key === "fee" || key === "sort_order"
                  ? Number(value || 0)
                  : value,
            }
          : region,
      ),
    }));
  };

  const addRegion = () => {
    setSettings((current) => ({
      ...current,
      delivery_regions: [
        ...current.delivery_regions,
        {
          id: crypto.randomUUID(),
          province: "",
          fee: 0,
          eta_text: "",
          delivery_type: "توصيل",
          sort_order: current.delivery_regions.length,
          is_active: true,
        },
      ],
    }));
  };

  const removeRegion = (id: string) => {
    setSettings((current) => ({
      ...current,
      delivery_regions: current.delivery_regions
        .filter((region) => region.id !== id)
        .map((region, index) => ({ ...region, sort_order: index })),
    }));
  };

  const removeQrImage = async () => {
    if (!settings.mastercard_qr_url || !window.confirm("هل تريد حذف هذه الصورة؟")) {
      return;
    }

    try {
      const previousUrl = settings.mastercard_qr_url;
      const response = await fetch("/api/admin/shop/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          mastercard_qr_url: "",
        }),
      });
      const payload = (await response.json()) as { message?: string; settings?: ShopSettingsRecord };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف الصورة.");
      }

      setSettings((current) => ({ ...current, mastercard_qr_url: "" }));
      const warning = await deleteStoredImage(previousUrl);
      toast.success("تم حذف الصورة بنجاح");

      if (warning) {
        toast.message(warning);
      }

      setSettings(payload.settings ?? { ...settings, mastercard_qr_url: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الصورة.");
    }
  };

  return (
    <section className="surface-panel p-5 sm:p-7">
      {loading ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="shimmer-skeleton h-12 rounded-2xl" />
            <div className="shimmer-skeleton h-12 rounded-2xl" />
            <div className="shimmer-skeleton h-12 rounded-2xl" />
            <div className="shimmer-skeleton h-12 rounded-2xl" />
          </div>
          <div className="shimmer-skeleton min-h-[260px] rounded-3xl" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <Input
              placeholder="وقت التوصيل"
              value={settings.delivery_time_text}
              onChange={(event) =>
                setSettings((current) => ({ ...current, delivery_time_text: event.target.value }))
              }
            />
            <Input
              placeholder="سعر التغليف"
              inputMode="decimal"
              value={String(settings.wrapping_price)}
              onChange={(event) =>
                setSettings((current) => ({ ...current, wrapping_price: Number(event.target.value || 0) }))
              }
            />
            <Input
              placeholder="تكلفة التوصيل"
              inputMode="decimal"
              value={String(settings.delivery_fee)}
              onChange={(event) =>
                setSettings((current) => ({ ...current, delivery_fee: Number(event.target.value || 0) }))
              }
            />

            <div className="rounded-[24px] border border-ajn-line bg-white/[0.03] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">توصيل المحافظات</h3>
                  <p className="mt-1 text-xs text-ajn-muted">السعر والوقت ونوع التوصيل</p>
                </div>
                <Button variant="secondary" className="h-10 px-4 text-xs" onClick={addRegion}>
                  <Plus className="h-4 w-4" />
                  إضافة محافظة
                </Button>
              </div>

              <div className="space-y-3">
                {settings.delivery_regions.map((region) => (
                  <div key={region.id} className="rounded-[20px] border border-white/8 bg-black/25 p-3">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <Input
                        placeholder="المحافظة"
                        value={region.province}
                        onChange={(event) => updateRegion(region.id, "province", event.target.value)}
                      />
                      <Input
                        placeholder="تكلفة التوصيل"
                        inputMode="decimal"
                        value={String(region.fee)}
                        onChange={(event) => updateRegion(region.id, "fee", event.target.value)}
                      />
                      <Input
                        placeholder="الوقت المتوقع"
                        value={region.eta_text}
                        onChange={(event) => updateRegion(region.id, "eta_text", event.target.value)}
                      />
                      <Input
                        placeholder="نوع التوصيل"
                        value={region.delivery_type}
                        onChange={(event) => updateRegion(region.id, "delivery_type", event.target.value)}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <Select
                        value={region.is_active ? "active" : "inactive"}
                        onChange={(event) => updateRegion(region.id, "is_active", event.target.value === "active")}
                        className="max-w-[180px]"
                      >
                        <option value="active" className="bg-black">مفعلة</option>
                        <option value="inactive" className="bg-black">مخفية</option>
                      </Select>

                      <Button variant="danger" className="h-10 px-4 text-xs" onClick={() => removeRegion(region.id)}>
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                <ImagePlus className="ml-2 h-4 w-4 text-ajn-gold" />
                {uploading ? "جاري الرفع..." : "رفع QR"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadQr(file);
                    }
                  }}
                />
              </label>
              {settings.mastercard_qr_url ? (
                <Button
                  variant="secondary"
                  onClick={() => void removeQrImage()}
                >
                  حذف QR
                </Button>
              ) : null}
            </div>

            <Button onClick={saveSettings} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-ajn-line bg-white/[0.03]">
            {settings.mastercard_qr_url ? (
              <div className="relative">
                <PreviewImage
                  src={buildProductImageProxyUrl(settings.mastercard_qr_url)}
                  alt="QR"
                  containerClassName="h-full max-h-[420px] rounded-none bg-white p-4"
                  imageClassName="object-contain"
                />
                <Button
                  variant="danger"
                  className="absolute left-3 top-3 h-9 px-3 text-xs"
                  onClick={() => void removeQrImage()}
                >
                  <Trash2 className="h-4 w-4" />
                  حذف الصورة
                </Button>
              </div>
            ) : (
              <div className="flex min-h-[260px] items-center justify-center text-ajn-muted">
                لا توجد صورة QR.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
