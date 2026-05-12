"use client";

import { Eye, EyeOff, ImagePlus, Pencil, Plus, Save, Trash2, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PreviewImage } from "@/components/ui/preview-image";
import { Select } from "@/components/ui/select";
import { PORTFOLIO_CATEGORIES } from "@/lib/shop-constants";
import type { PortfolioCategory, PortfolioEntryRecord } from "@/lib/shop-types";
import { buildProductImageProxyUrl, getVideoEmbedUrl, isDirectVideoUrl } from "@/lib/shop-utils";

interface PortfolioFormState {
  id: string;
  title: string;
  category: PortfolioCategory;
  media_type: "image" | "video";
  media_url: string;
  thumbnail_url: string;
  is_active: boolean;
  sort_order: string;
}

const emptyForm: PortfolioFormState = {
  id: "",
  title: "",
  category: PORTFOLIO_CATEGORIES[0],
  media_type: "image",
  media_url: "",
  thumbnail_url: "",
  is_active: true,
  sort_order: "0",
};

export function PortfolioManager() {
  const [entries, setEntries] = useState<PortfolioEntryRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/portfolio", { cache: "no-store" });
      const payload = (await response.json()) as { message?: string; entries?: PortfolioEntryRecord[] };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحميل الأعمال.");
      }

      setEntries(payload.entries ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل الأعمال.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadEntries();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const uploadMedia = async (file: File) => {
    const loadingToast = toast.loading("جاري تحسين الصورة...");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("files", file);
      const response = await fetch("/api/admin/media?kind=portfolio-media", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        message?: string;
        files?: { url: string; thumbnailUrl?: string }[];
      };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر رفع الملف.");
      }

      const uploaded = payload.files?.[0];

      if (!uploaded?.url) {
        throw new Error("تعذر رفع الملف.");
      }

      setForm((current) => ({
        ...current,
        media_type: file.type.startsWith("video/") ? "video" : "image",
        media_url: uploaded.url,
        thumbnail_url: uploaded.thumbnailUrl || uploaded.url,
      }));
      toast.success("تم رفع الملف.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الملف.");
    } finally {
      toast.dismiss(loadingToast);
      setUploading(false);
    }
  };

  const saveEntry = async () => {
    try {
      setSaving(true);
      const response = await fetch(form.id ? `/api/admin/portfolio/${form.id}` : "/api/admin/portfolio", {
        method: form.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          sort_order: Number(form.sort_order || 0),
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حفظ العمل.");
      }

      toast.success(form.id ? "تم تحديث العمل." : "تم حفظ العمل.");
      setForm(emptyForm);
      await loadEntries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ العمل.");
    } finally {
      setSaving(false);
    }
  };

  const toggleEntry = async (entry: PortfolioEntryRecord) => {
    try {
      const response = await fetch(`/api/admin/portfolio/${entry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...entry,
          is_active: !entry.is_active,
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحديث العمل.");
      }

      toast.success("تم تحديث العمل.");
      await loadEntries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث العمل.");
    }
  };

  const removeEntry = async (id: string) => {
    if (!window.confirm("حذف العمل؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/portfolio/${id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف العمل.");
      }

      toast.success("تم حذف العمل.");
      await loadEntries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف العمل.");
    }
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="عنوان العمل" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          <Select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as (typeof PORTFOLIO_CATEGORIES)[number] }))}>
            {PORTFOLIO_CATEGORIES.map((category) => (
              <option key={category} value={category} className="bg-black">
                {category}
              </option>
            ))}
          </Select>
          <Select value={form.media_type} onChange={(event) => setForm((current) => ({ ...current, media_type: event.target.value as "image" | "video" }))}>
            <option value="image" className="bg-black">صورة</option>
            <option value="video" className="bg-black">فيديو</option>
          </Select>
          <Input placeholder="الترتيب" inputMode="numeric" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))} />
        </div>

        <Input placeholder="رابط الوسيط" value={form.media_url} onChange={(event) => setForm((current) => ({ ...current, media_url: event.target.value }))} />

        <div className="flex flex-wrap gap-3">
          <label className="flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
            <ImagePlus className="ml-2 h-4 w-4 text-ajn-gold" />
            {uploading ? "جاري الرفع..." : "رفع صورة / فيديو"}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadMedia(file);
                }
              }}
            />
          </label>
          <Button
            variant="secondary"
            onClick={() => setForm((current) => ({ ...current, is_active: !current.is_active }))}
          >
            {form.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {form.is_active ? "مفعل" : "مخفي"}
          </Button>
          <Button variant="secondary" onClick={() => setForm(emptyForm)}>
            <Plus className="h-4 w-4" />
            جديد
          </Button>
          <Button onClick={saveEntry} disabled={saving}>
            <Save className="h-4 w-4" />
            {form.id ? "حفظ التعديل" : "حفظ"}
          </Button>
        </div>

        {form.media_url ? (
          <div className="surface-panel p-4">
            {form.media_type === "image" ? (
              <PreviewImage
                src={buildProductImageProxyUrl(form.thumbnail_url || form.media_url)}
                previewSrc={buildProductImageProxyUrl(form.media_url)}
                alt={form.title || "عمل"}
                containerClassName="h-64 rounded-[24px] bg-black/20 p-4"
                imageClassName="object-contain"
              />
            ) : isDirectVideoUrl(form.media_url) ? (
              <video controls className="h-64 w-full rounded-[24px] bg-black/30 object-contain">
                <source src={buildProductImageProxyUrl(form.media_url)} />
              </video>
            ) : (
              <iframe
                src={getVideoEmbedUrl(form.media_url)}
                className="h-64 w-full rounded-[24px] border border-ajn-line bg-black/30"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={form.title || "فيديو"}
              />
            )}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="surface-panel h-24 animate-pulse bg-white/[0.03]" />
          ))
        ) : entries.length ? (
          entries.map((entry) => (
            <div key={entry.id} className="surface-panel p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-24 w-full shrink-0 overflow-hidden rounded-[20px] bg-black/20 sm:w-28">
                  {entry.media_type === "image" ? (
                    <PreviewImage
                      src={buildProductImageProxyUrl(entry.thumbnail_url || entry.media_url)}
                      previewSrc={buildProductImageProxyUrl(entry.media_url)}
                      alt={entry.title}
                      containerClassName="h-24 w-full rounded-[20px] bg-black/20 p-2"
                      imageClassName="object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ajn-gold">
                      <Video className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{entry.title}</h3>
                  <p className="mt-1 text-sm text-ajn-muted">{entry.category}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="px-3 py-2 text-xs"
                    onClick={() =>
                      setForm({
                        id: entry.id,
                        title: entry.title,
                        category: entry.category,
                        media_type: entry.media_type,
                        media_url: entry.media_url,
                        thumbnail_url: entry.thumbnail_url,
                        is_active: entry.is_active,
                        sort_order: String(entry.sort_order),
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                    تعديل
                  </Button>
                  <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => void toggleEntry(entry)}>
                    {entry.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {entry.is_active ? "إخفاء" : "إظهار"}
                  </Button>
                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => void removeEntry(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="luxury-empty">لا توجد أعمال.</div>
        )}
      </div>
    </section>
  );
}
