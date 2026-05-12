"use client";

import { ArrowLeft, Eye, Gift, Heart, Package2, Search, ShoppingCart, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { Button } from "@/components/ui/button";
import { HomeLinkButton } from "@/components/ui/home-link-button";
import {
  PreviewImage,
  PreviewGalleryLightbox,
  PreviewLightbox,
  type PreviewGalleryItem,
  type PreviewLightboxImage,
} from "@/components/ui/preview-image";
import type {
  ProductColorOption,
  ProductRecord,
  ShopCatalogPayload,
  ShopCategoryNode,
} from "@/lib/shop-types";
import {
  buildProductImageProxyUrl,
  findCategoryBySlug,
  getPrimaryPreviewImage,
  getProductImagePresentation,
} from "@/lib/shop-utils";
import { cn, formatAmountWithCurrency } from "@/lib/utils";
import { QuantityControl } from "@/components/shop/quantity-control";
import { useShopCart } from "@/components/shop/cart-provider";

const iconMap: Record<string, typeof Package2> = {
  تجهيزات: Package2,
  "ورود-طبيعية": Heart,
  "هدايا-متجر": Gift,
  كوزمتك: Sparkles,
};

export function ServicesPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem, itemCount } = useShopCart();
  const [catalog, setCatalog] = useState<ShopCatalogPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [visibleProductCounts, setVisibleProductCounts] = useState<Record<string, number>>({});
  const [activePreviewImage, setActivePreviewImage] = useState<(PreviewLightboxImage & { sectionKey: string }) | null>(
    null,
  );
  const [selectedColors, setSelectedColors] = useState<Record<string, ProductColorOption | null>>({});
  const [activeGallery, setActiveGallery] = useState<{
    key: string;
    sectionKey: string;
    title: string;
    images: PreviewGalleryItem[];
    initialIndex: number;
  } | null>(null);
  const rootSlug = searchParams.get("main");
  const subSlug = searchParams.get("sub");
  const visibleKey = `${rootSlug ?? ""}:${subSlug ?? ""}`;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/shop/catalog", { cache: "no-store" });
        const payload = (await response.json()) as ShopCatalogPayload & { message?: string };

        if (!response.ok) {
          throw new Error(payload.message || "تعذر تحميل الخدمات.");
        }

        setCatalog(payload);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر تحميل الخدمات.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const rootCategory = useMemo(
    () => (catalog ? findCategoryBySlug(catalog.categories, rootSlug) : null),
    [catalog, rootSlug],
  );

  const subCategory = useMemo(
    () => (rootCategory ? findCategoryBySlug(rootCategory.children, subSlug) : null),
    [rootCategory, subSlug],
  );

  const currentProducts = subCategory?.products ?? [];
  const visibleProducts = visibleProductCounts[visibleKey] ?? 12;
  const displayedProducts = currentProducts.slice(0, visibleProducts);
  const visiblePreviewImage =
    activePreviewImage && activePreviewImage.sectionKey === visibleKey ? activePreviewImage : null;
  const visibleGallery = activeGallery && activeGallery.sectionKey === visibleKey ? activeGallery : null;

  const setQuantity = (productId: string, value: number) => {
    setQuantities((current) => ({
      ...current,
      [productId]: Math.max(1, value),
    }));
  };

  const getQuantity = (productId: string) => quantities[productId] ?? 1;
  const getSelectedColor = (product: ProductRecord) =>
    selectedColors[product.id] ?? product.color_options[0] ?? null;

  return (
    <div className="page-shell pb-24 pt-6 sm:pt-10">
      <div className="section-shell space-y-7">
        <HomeLinkButton />

        <AnimatedServicePanel className="sticky-shell surface-panel-strong noise-overlay p-5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">خدماتنا</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/cart"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-ajn-line bg-white/[0.05] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                <ShoppingCart className="h-4 w-4 text-ajn-gold" />
                السلة
                <span className="rounded-full bg-ajn-gold px-2 py-0.5 text-xs text-black">{itemCount}</span>
              </Link>
            </div>
          </div>
        </AnimatedServicePanel>

        {(rootCategory || subCategory) ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-ajn-muted">
            <button type="button" onClick={() => router.push("/services")} className="transition hover:text-white">
              خدماتنا
            </button>
            {rootCategory ? <span>/</span> : null}
            {rootCategory ? (
              <button
                type="button"
                onClick={() => router.push(`/services?main=${encodeURIComponent(rootCategory.slug)}`)}
                className="transition hover:text-white"
              >
                {rootCategory.name}
              </button>
            ) : null}
            {subCategory ? <span>/</span> : null}
            {subCategory ? <span className="text-white">{subCategory.name}</span> : null}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="surface-panel p-5">
                <div className="shimmer-skeleton mb-5 h-44 rounded-[24px]" />
                <div className="shimmer-skeleton mb-3 h-6 w-2/3 rounded-full" />
                <div className="shimmer-skeleton h-11 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && catalog && !rootSlug ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {catalog.categories.map((category: ShopCategoryNode) => {
              const Icon = iconMap[category.slug] ?? Search;
              return (
                <div
                  key={category.id}
                  className="group"
                >
                  <Link
                    href={`/services?main=${encodeURIComponent(category.slug)}`}
                    className="surface-panel noise-overlay flex h-full cursor-pointer flex-col p-5 text-right transition duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-ajn-gold/45 hover:bg-white/[0.05] hover:shadow-[0_24px_60px_rgba(212,175,55,0.12)]"
                  >
                    <PreviewImage
                      src={buildProductImageProxyUrl(category.thumbnail_url || category.image_url)}
                      alt={category.name}
                      interactive={false}
                      priority={catalog.categories.indexOf(category) < 4}
                      sizes="(max-width: 640px) 92vw, (max-width: 1280px) 48vw, 25vw"
                      containerClassName="mb-5 h-44 w-full rounded-[24px] border border-white/6 bg-black/30 p-4"
                      imageClassName="object-contain"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center text-ajn-gold">
                          <Icon className="h-12 w-12" />
                        </div>
                      }
                    />
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ajn-gold/25 bg-ajn-gold/10 text-ajn-gold transition duration-300 group-hover:border-ajn-gold/45 group-hover:bg-ajn-gold/14">
                        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : null}

        {!loading && rootCategory && !subCategory ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-white">{rootCategory.name}</h2>
              <Button variant="secondary" onClick={() => router.push("/services")}>
                رجوع
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {rootCategory.children.map((category: ShopCategoryNode) => (
                <div
                  key={category.id}
                  className="group"
                >
                  <Link
                    href={`/services?main=${encodeURIComponent(rootCategory.slug)}&sub=${encodeURIComponent(category.slug)}`}
                    className="surface-panel noise-overlay flex h-full cursor-pointer flex-col p-5 text-right transition duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-ajn-gold/45 hover:bg-white/[0.05] hover:shadow-[0_24px_60px_rgba(212,175,55,0.12)]"
                  >
                    <PreviewImage
                      src={buildProductImageProxyUrl(category.thumbnail_url || category.image_url)}
                      alt={category.name}
                      interactive={false}
                      priority={rootCategory.children.indexOf(category) < 4}
                      sizes="(max-width: 640px) 92vw, (max-width: 1280px) 48vw, 25vw"
                      containerClassName="mb-5 h-40 w-full rounded-[22px] border border-white/6 bg-black/25 p-4"
                      imageClassName="object-contain"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center text-ajn-gold">
                          <Package2 className="h-10 w-10" />
                        </div>
                      }
                    />
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <h3 className="text-xl font-bold text-white">{category.name}</h3>
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ajn-gold/25 bg-ajn-gold/10 text-ajn-gold transition duration-300 group-hover:border-ajn-gold/45 group-hover:bg-ajn-gold/14">
                        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && subCategory ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-white">{subCategory.name}</h2>
              <Button
                variant="secondary"
                onClick={() => router.push(`/services?main=${encodeURIComponent(rootCategory?.slug ?? "")}`)}
              >
                رجوع
              </Button>
            </div>

            {currentProducts.length ? (
              <>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {displayedProducts.map((product: ProductRecord, index) => {
                    const imagePresentation = getProductImagePresentation(product);
                    const selectedColor = getSelectedColor(product);
                    const primaryPreviewImage = getPrimaryPreviewImage(product);
                    const previewGalleryItems = product.preview_images
                      .map((image) => ({
                        id: image.id,
                        src: buildProductImageProxyUrl(image.url),
                        thumbnailSrc: buildProductImageProxyUrl(image.thumbnail_url || image.url),
                        alt: `${product.name} ${selectedColor?.color_name ? `- ${selectedColor.color_name}` : ""}`.trim(),
                      }))
                      .filter((image) => image.src);
                    const hasPreviewGallery = previewGalleryItems.length > 0;

                    return (
                      <div
                        key={product.id}
                        className="group surface-panel glass-hover overflow-hidden [transform-style:preserve-3d]"
                      >
                        <PreviewImage
                          src={buildProductImageProxyUrl(
                            primaryPreviewImage?.thumbnail_url || product.thumbnail_url || product.image_url,
                          )}
                          previewSrc={buildProductImageProxyUrl(primaryPreviewImage?.url || product.image_url)}
                          alt={product.name}
                          priority={index < 4}
                          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 48vw, 25vw"
                          containerClassName="h-[17.5rem] w-full border-b border-white/6 bg-[radial-gradient(circle_at_top,#ffffff12,transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3 sm:h-[18.5rem] lg:h-[19rem]"
                          imageClassName="transition duration-500"
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
                          onPreviewRequest={(image) =>
                            setActivePreviewImage({
                              ...image,
                              sectionKey: visibleKey,
                            })
                          }
                          fallback={
                            <div className="flex h-full items-center justify-center text-ajn-gold">
                              <Package2 className="h-10 w-10" />
                            </div>
                          }
                        />
                        <div className="space-y-3 p-4 sm:p-[18px]">
                          <div className="space-y-1.5">
                            <h3 className="text-base font-bold text-white sm:text-lg">{product.name}</h3>
                            {product.description ? (
                              <p className="line-clamp-2 text-[12px] leading-5 text-ajn-muted sm:text-[13px]">
                                {product.description}
                              </p>
                            ) : null}
                            <p className="text-sm font-semibold text-ajn-gold">
                              {formatAmountWithCurrency(product.price)}
                            </p>
                          </div>
                          {product.color_options.length ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[12px] font-semibold text-ajn-muted">الألوان المتوفرة</p>
                                {selectedColor?.color_name ? (
                                  <span className="text-[12px] font-semibold text-ajn-gold">
                                    {selectedColor.color_name}
                                  </span>
                                ) : null}
                              </div>
                              <div className="ajn-shop-color-row">
                                {product.color_options.map((color) => {
                                  const isSelected =
                                    selectedColor?.id === color.id ||
                                    (selectedColor?.color_hex && selectedColor.color_hex === color.color_hex);

                                  return (
                                    <button
                                      key={color.id}
                                      type="button"
                                      onClick={() =>
                                        setSelectedColors((current) => ({
                                          ...current,
                                          [product.id]: color,
                                        }))
                                      }
                                      className={cn("ajn-shop-color-button", isSelected && "is-selected")}
                                      style={
                                        {
                                          ["--swatch-color" as "--swatch-color"]: color.color_hex || "#D4AF37",
                                        } as CSSProperties
                                      }
                                      title={color.color_name || color.color_hex}
                                      aria-label={color.color_name || color.color_hex}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                          {hasPreviewGallery ? (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveGallery({
                                  key: crypto.randomUUID(),
                                  sectionKey: visibleKey,
                                  title: product.name,
                                  images: previewGalleryItems,
                                  initialIndex: 0,
                                })
                              }
                              className="inline-flex items-center gap-2 text-sm font-semibold text-ajn-gold transition hover:text-ajn-goldSoft"
                            >
                              <Eye className="h-4 w-4" />
                              معاينة المنتج
                            </button>
                          ) : null}
                          <div className="flex flex-col gap-2.5">
                            <QuantityControl
                              className="w-full"
                              size="compact"
                              value={getQuantity(product.id)}
                              onChange={(value) => setQuantity(product.id, value)}
                            />
                            <Button
                              className="h-10 w-full rounded-2xl text-sm"
                              onClick={() => addItem(product, getQuantity(product.id), selectedColor)}
                            >
                              إضافة للسلة
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {currentProducts.length > visibleProducts ? (
                  <div className="flex justify-center">
                    <Button
                      variant="secondary"
                      className="min-w-[180px]"
                      onClick={() =>
                        setVisibleProductCounts((current) => ({
                          ...current,
                          [visibleKey]: (current[visibleKey] ?? 12) + 12,
                        }))
                      }
                    >
                      عرض المزيد
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="luxury-empty">لا توجد منتجات.</div>
            )}
          </div>
        ) : null}

        <PreviewLightbox
          image={visiblePreviewImage}
          onClose={() => setActivePreviewImage(null)}
        />
        <PreviewGalleryLightbox
          key={visibleGallery?.key ?? "shop-gallery"}
          open={Boolean(visibleGallery)}
          images={visibleGallery?.images ?? []}
          initialIndex={visibleGallery?.initialIndex ?? 0}
          onClose={() => setActiveGallery(null)}
        />
      </div>
    </div>
  );
}
