"use client";

import { PlayCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { Button } from "@/components/ui/button";
import { HomeLinkButton } from "@/components/ui/home-link-button";
import { PreviewImage, PreviewLightbox, type PreviewLightboxImage } from "@/components/ui/preview-image";
import type { PortfolioCategory, PortfolioEntryRecord } from "@/lib/shop-types";
import { getPortfolioCategories, buildProductImageProxyUrl, getVideoEmbedUrl, isDirectVideoUrl } from "@/lib/shop-utils";
import { cn } from "@/lib/utils";

export function OurWorkPageClient() {
  const [entries, setEntries] = useState<PortfolioEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<PortfolioCategory | "الكل">("الكل");
  const [activePreviewImage, setActivePreviewImage] = useState<PreviewLightboxImage | null>(null);
  const [activeVideo, setActiveVideo] = useState<PortfolioEntryRecord | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/portfolio", { cache: "no-store" });
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

    void load();
  }, []);

  const categories = useMemo(() => ["الكل", ...getPortfolioCategories()] as const, []);
  const filteredEntries = useMemo(
    () => (activeCategory === "الكل" ? entries : entries.filter((item) => item.category === activeCategory)),
    [activeCategory, entries],
  );

  return (
    <div className="page-shell pb-24 pt-6 sm:pt-10">
      <div className="section-shell space-y-7">
        <HomeLinkButton />

        <AnimatedServicePanel className="sticky-shell surface-panel-strong noise-overlay p-5 sm:p-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">أعمالنا</h1>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    activeCategory === category
                      ? "border-ajn-gold/35 bg-ajn-gold/[0.12] text-ajn-gold"
                      : "border-ajn-line bg-white/[0.03] text-white hover:border-ajn-gold/25",
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </AnimatedServicePanel>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="surface-panel p-4">
                <div className="shimmer-skeleton h-60 rounded-[24px]" />
              </div>
            ))}
          </div>
        ) : filteredEntries.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="surface-panel glass-hover overflow-hidden p-4">
                {entry.media_type === "image" ? (
                  <PreviewImage
                    src={buildProductImageProxyUrl(entry.thumbnail_url || entry.media_url)}
                    previewSrc={buildProductImageProxyUrl(entry.media_url)}
                    alt={entry.title}
                    onPreviewRequest={(image) => setActivePreviewImage(image)}
                    containerClassName="h-64 rounded-[24px] bg-black/20 p-3"
                    imageClassName="object-contain"
                  />
                ) : (
                  <button
                    type="button"
                    className="group relative flex h-64 w-full items-center justify-center overflow-hidden rounded-[24px] border border-white/8 bg-black/35"
                    onClick={() => setActiveVideo(entry)}
                  >
                    <PreviewImage
                      src={buildProductImageProxyUrl(entry.thumbnail_url || entry.media_url)}
                      alt={entry.title}
                      interactive={false}
                      containerClassName="absolute inset-0 h-full w-full rounded-none bg-black/20 p-3"
                      imageClassName="object-cover opacity-70 transition duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-full border border-ajn-gold/35 bg-black/70 text-ajn-gold shadow-gold">
                      <PlayCircle className="h-8 w-8" />
                    </span>
                  </button>
                )}

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{entry.title}</h3>
                    <p className="mt-1 text-sm text-ajn-muted">{entry.category}</p>
                  </div>
                  {entry.media_type === "video" ? (
                    <Button variant="secondary" className="h-10 px-4 text-xs" onClick={() => setActiveVideo(entry)}>
                      مشاهدة
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="luxury-empty">لا توجد أعمال.</div>
        )}
      </div>

      <PreviewLightbox image={activePreviewImage} onClose={() => setActivePreviewImage(null)} />

      {activeVideo ? (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-md" onClick={() => setActiveVideo(null)}>
          <button
            type="button"
            className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white"
            onClick={() => setActiveVideo(null)}
            aria-label="إغلاق"
          >
            ×
          </button>
          <div
            className="relative w-full max-w-5xl rounded-[28px] border border-ajn-line bg-black/90 p-4"
            onClick={(event) => event.stopPropagation()}
          >
            {isDirectVideoUrl(activeVideo.media_url) ? (
              <video controls autoPlay className="max-h-[82vh] w-full rounded-[24px] bg-black">
                <source src={buildProductImageProxyUrl(activeVideo.media_url)} />
              </video>
            ) : (
              <iframe
                src={getVideoEmbedUrl(activeVideo.media_url)}
                className="h-[72vh] w-full rounded-[24px] border border-white/10 bg-black"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={activeVideo.title}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
