"use client";

import { ImagePlus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PreviewImage } from "@/components/ui/preview-image";
import type { ShopSettingsRecord } from "@/lib/shop-types";
import { buildProductImageProxyUrl } from "@/lib/shop-utils";

const defaultSettings: ShopSettingsRecord = {
  id: "",
  mastercard_qr_url: "",
  wrapping_price: 0,
  delivery_fee: 0,
  delivery_time_text: "40 - 50 دقائق",
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
