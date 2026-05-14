"use client";

import {
  ArrowLeft,
  Eye,
  Gift,
  Heart,
  Package2,
  PlayCircle,
  Search,
  ShoppingCart,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { Button } from "@/components/ui/button";
import { HomeLinkButton } from "@/components/ui/home-link-button";
import { Input } from "@/components/ui/input";
import {
  PreviewImage,
  PreviewGalleryLightbox,
  PreviewLightbox,
  type PreviewGalleryItem,
  type PreviewLightboxImage,
} from "@/components/ui/preview-image";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProductColorOption,
  ProductCustomizationPayload,
  ProductRecord,
  ShopCatalogPayload,
  ShopCategoryNode,
} from "@/lib/shop-types";
import {
  buildProductImageProxyUrl,
  findCategoryBySlug,
  getProductStockLabel,
  getPrimaryPreviewImage,
  getProductImagePresentation,
  getVideoEmbedUrl,
  hasProductCustomizationOptions,
  isDirectVideoUrl,
  isProductSoldOut,
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

const PRODUCT_CUSTOMIZATION_CONFIG = [
  {
    optionKey: "enable_name",
    payloadKey: "custom_name",
    label: "كتابة اسم",
    placeholder: "اكتب الاسم",
    fieldType: "input",
  },
  {
    optionKey: "enable_message",
    payloadKey: "gift_message",
    label: "رسالة داخل البوكس",
    placeholder: "اكتب الرسالة",
    fieldType: "textarea",
  },
  {
    optionKey: "enable_wrapping_note",
    payloadKey: "wrapping_note",
    label: "ملاحظة التغليف",
    placeholder: "ملاحظة التغليف",
    fieldType: "textarea",
  },
  {
    optionKey: "enable_special_color",
    payloadKey: "special_color",
    label: "لون خاص",
    placeholder: "اكتب اللون",
    fieldType: "input",
  },
  {
    optionKey: "enable_occasion_date",
    payloadKey: "occasion_date",
    label: "تاريخ المناسبة",
    placeholder: "",
    fieldType: "date",
  },
  {
    optionKey: "enable_customer_image",
    payloadKey: "customer_image_url",
    label: "رفع صورة",
    placeholder: "",
    fieldType: "file",
  },
] as const;

export function ServicesPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem, itemCount } = useShopCart();
  const [catalog, setCatalog] = useState<ShopCatalogPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [visibleProductCounts, setVisibleProductCounts] = useState<Record<string, number>>({});
  const [customizations, setCustomizations] = useState<Record<string, ProductCustomizationPayload>>({});
  const [uploadingCustomizationImageFor, setUploadingCustomizationImageFor] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [customerLoggedIn, setCustomerLoggedIn] = useState(false);
  const [activeVideoProduct, setActiveVideoProduct] = useState<{
    product: ProductRecord;
    sectionKey: string;
  } | null>(null);
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
  const rootCategory = useMemo(
    () => (catalog ? findCategoryBySlug(catalog.categories, rootSlug) : null),
    [catalog, rootSlug],
  );

  const subCategory = useMemo(
    () => (rootCategory ? findCategoryBySlug(rootCategory.children, subSlug) : null),
    [rootCategory, subSlug],
  );

  const currentProducts = useMemo(() => subCategory?.products ?? [], [subCategory]);
  const visibleProducts = visibleProductCounts[visibleKey] ?? 12;
  const displayedProducts = currentProducts.slice(0, visibleProducts);
  const visiblePreviewImage =
    activePreviewImage && activePreviewImage.sectionKey === visibleKey ? activePreviewImage : null;
  const visibleGallery = activeGallery && activeGallery.sectionKey === visibleKey ? activeGallery : null;
  const visibleVideoProduct =
    activeVideoProduct && activeVideoProduct.sectionKey === visibleKey ? activeVideoProduct.product : null;

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

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await fetch("/api/account/favorites", { cache: "no-store" });
        const payload = (await response.json()) as { favorites?: string[]; authenticated?: boolean };

        if (!response.ok) {
          setCustomerLoggedIn(false);
          setFavoriteIds([]);
          return;
        }

        setCustomerLoggedIn(Boolean(payload.authenticated));
        setFavoriteIds(payload.favorites ?? []);
      } catch {
        setCustomerLoggedIn(false);
        setFavoriteIds([]);
      }
    };

    void loadFavorites();
  }, []);

  const setQuantity = (productId: string, value: number) => {
    setQuantities((current) => ({
      ...current,
      [productId]: Math.max(1, value),
    }));
  };

  const getQuantity = (productId: string) => quantities[productId] ?? 1;
  const getSelectedColor = (product: ProductRecord) =>
    selectedColors[product.id] ?? product.color_options[0] ?? null;
  const getCustomization = (product: ProductRecord) =>
    customizations[product.id] ?? {
      custom_name: "",
      gift_message: "",
      wrapping_note: "",
      special_color: "",
      occasion_date: "",
      customer_image_url: "",
    };

  const updateCustomizationValue = (
    productId: string,
    key: keyof ProductCustomizationPayload,
    value: string,
  ) => {
    setCustomizations((current) => {
      const previous = current[productId] ?? {
        custom_name: "",
        gift_message: "",
        wrapping_note: "",
        special_color: "",
        occasion_date: "",
        customer_image_url: "",
      };

      return {
        ...current,
        [productId]: {
          ...previous,
          [key]: value,
        },
      };
    });
  };

  const uploadCustomerImage = async (productId: string, file: File) => {
    const formData = new FormData();
    formData.append("files", file);
    const loadingToast = toast.loading("جاري رفع الصورة...");
    setUploadingCustomizationImageFor(productId);

    try {
      const response = await fetch("/api/shop/uploads?kind=customer-image", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { message?: string; files?: { url: string }[] };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر رفع الصورة.");
      }

      const uploadedUrl = payload.files?.[0]?.url ?? "";
      if (!uploadedUrl) {
        throw new Error("تعذر رفع الصورة.");
      }

      setCustomizations((current) => ({
        ...current,
        [productId]: {
          ...(current[productId] ?? {
            custom_name: "",
            gift_message: "",
            wrapping_note: "",
            special_color: "",
            occasion_date: "",
            customer_image_url: "",
          }),
          customer_image_url: uploadedUrl,
        },
      }));
      toast.success("تم رفع الصورة.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الصورة.");
    } finally {
      setUploadingCustomizationImageFor(null);
      toast.dismiss(loadingToast);
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
      const payload = (await response.json()) as { message?: string; active?: boolean };

      if (response.status === 401) {
        toast.error(payload.message || "سجل الدخول أولاً.");
        router.push("/account/login");
        return;
      }

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحديث المفضلة.");
      }

      setFavoriteIds((current) =>
        payload.active ? [...new Set([...current, productId])] : current.filter((item) => item !== productId),
      );
      setCustomerLoggedIn(true);
      toast.success(payload.message || "تم تحديث المفضلة.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث المفضلة.");
    }
  };

  return (
    <div className="page-shell pb-24 pt-6 sm:pt-10">
      <div className="section-shell space-y-7">
        <HomeLinkButton />

        <AnimatedServicePanel className="sticky-shell surface-panel-strong noise-overlay overflow-hidden p-5 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.26em] text-ajn-goldSoft">AJN STORE</p>
              <h1 className="text-3xl font-bold text-white sm:text-5xl">المتجر</h1>
              <p className="max-w-xl text-sm leading-7 text-ajn-muted">منتجات وتجهيزات ضمن عرض مرتب وواضح.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/account"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-ajn-line bg-white/[0.05] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                <Heart className="h-4 w-4 text-ajn-gold" />
                حسابي
              </Link>
              <Link
                href="/our-work"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-ajn-line bg-white/[0.05] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                <Eye className="h-4 w-4 text-ajn-gold" />
                أعمالنا
              </Link>
              <Link
                href="/cart"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-ajn-gold/24 bg-ajn-gold/10 px-4 text-sm font-semibold text-white transition hover:bg-ajn-gold/14"
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
                    className="surface-panel noise-overlay flex h-full cursor-pointer flex-col overflow-hidden rounded-[30px] border border-white/8 p-4 text-right transition duration-300 hover:-translate-y-1 hover:border-ajn-gold/45 hover:bg-white/[0.05] hover:shadow-[0_24px_60px_rgba(212,175,55,0.12)]"
                  >
                    <PreviewImage
                      src={buildProductImageProxyUrl(category.thumbnail_url || category.image_url)}
                      alt={category.name}
                      interactive={false}
                      priority={catalog.categories.indexOf(category) < 4}
                      sizes="(max-width: 640px) 92vw, (max-width: 1280px) 48vw, 25vw"
                      containerClassName="mb-5 h-52 w-full rounded-[26px] border border-white/6 bg-black/30 p-4"
                      imageClassName="object-contain"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center text-ajn-gold">
                          <Icon className="h-12 w-12" />
                        </div>
                      }
                    />
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                        <p className="mt-1 text-xs text-ajn-muted">استكشف التفاصيل</p>
                      </div>
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
                    className="surface-panel noise-overlay flex h-full cursor-pointer flex-col overflow-hidden rounded-[30px] border border-white/8 p-4 text-right transition duration-300 hover:-translate-y-1 hover:border-ajn-gold/45 hover:bg-white/[0.05] hover:shadow-[0_24px_60px_rgba(212,175,55,0.12)]"
                  >
                    <PreviewImage
                      src={buildProductImageProxyUrl(category.thumbnail_url || category.image_url)}
                      alt={category.name}
                      interactive={false}
                      priority={rootCategory.children.indexOf(category) < 4}
                      sizes="(max-width: 640px) 92vw, (max-width: 1280px) 48vw, 25vw"
                      containerClassName="mb-5 h-48 w-full rounded-[24px] border border-white/6 bg-black/25 p-4"
                      imageClassName="object-contain"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center text-ajn-gold">
                          <Package2 className="h-10 w-10" />
                        </div>
                      }
                    />
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-white">{category.name}</h3>
                        <p className="mt-1 text-xs text-ajn-muted">عرض المنتجات</p>
                      </div>
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
                    const customization = getCustomization(product);
                    const primaryPreviewImage = getPrimaryPreviewImage(product);
                    const supportsCustomization = hasProductCustomizationOptions(product.customization_options);
                    const soldOut = isProductSoldOut(product);
                    const isFavorite = favoriteIds.includes(product.id);
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
                        className="group surface-panel overflow-hidden rounded-[30px] border border-white/8 [transform-style:preserve-3d]"
                      >
                        <div className="relative">
                          <PreviewImage
                            src={buildProductImageProxyUrl(
                              primaryPreviewImage?.thumbnail_url || product.thumbnail_url || product.image_url,
                            )}
                            previewSrc={buildProductImageProxyUrl(primaryPreviewImage?.url || product.image_url)}
                            alt={product.name}
                            priority={index < 4}
                            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 48vw, 25vw"
                            containerClassName="h-[19rem] w-full border-b border-white/6 bg-[radial-gradient(circle_at_top,#ffffff12,transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3 sm:h-[20rem] lg:h-[21rem]"
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
                          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                            <span
                              className={cn(
                                "rounded-full border px-3 py-1 text-[11px] font-semibold shadow-[0_12px_28px_rgba(0,0,0,0.18)]",
                                soldOut
                                  ? "border-red-400/30 bg-red-500/18 text-red-100"
                                  : "border-ajn-gold/25 bg-black/60 text-ajn-goldSoft",
                              )}
                            >
                              {getProductStockLabel(product)}
                            </span>
                            <div className="pointer-events-auto flex items-center gap-2">
                              {product.video_url ? (
                                <span className="rounded-full border border-white/12 bg-black/55 px-3 py-1 text-[11px] font-semibold text-white">
                                  فيديو
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => void toggleFavorite(product.id)}
                                className={cn(
                                  "inline-flex h-9 w-9 items-center justify-center rounded-full border bg-black/55 text-white transition hover:border-ajn-gold/35 hover:text-ajn-gold",
                                  isFavorite
                                    ? "border-ajn-gold/45 text-ajn-gold"
                                    : "border-white/12",
                                )}
                                aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                                title={customerLoggedIn ? (isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة") : "سجل الدخول للمفضلة"}
                              >
                                <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3 p-4 sm:p-5">
                          <div className="space-y-1.5">
                            <h3 className="text-lg font-bold text-white">{product.name}</h3>
                            {product.description ? (
                              <p className="line-clamp-2 text-[12px] leading-5 text-ajn-muted sm:text-[13px]">
                                {product.description}
                              </p>
                            ) : null}
                            <p className="text-base font-semibold text-ajn-gold">
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
                          {supportsCustomization ? (
                            <div className="space-y-3 rounded-[22px] border border-white/8 bg-black/20 p-3.5">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-white">تخصيص المنتج</p>
                                <span className="text-[11px] text-ajn-goldSoft">اختياري</span>
                              </div>
                              <div className="space-y-3">
                                {PRODUCT_CUSTOMIZATION_CONFIG.filter(
                                  (item) => product.customization_options[item.optionKey],
                                ).map((field) => {
                                  if (field.fieldType === "textarea") {
                                    return (
                                      <Textarea
                                        key={`${product.id}-${field.payloadKey}`}
                                        placeholder={field.placeholder}
                                        className="min-h-[80px] rounded-[18px] border-white/8 bg-white/[0.03] text-sm text-white placeholder:text-ajn-muted"
                                        value={customization[field.payloadKey]}
                                        onChange={(event) =>
                                          updateCustomizationValue(product.id, field.payloadKey, event.target.value)
                                        }
                                      />
                                    );
                                  }

                                  if (field.fieldType === "date") {
                                    return (
                                      <div key={`${product.id}-${field.payloadKey}`} className="space-y-2">
                                        <p className="text-[12px] font-semibold text-ajn-muted">{field.label}</p>
                                        <Input
                                          type="date"
                                          value={customization[field.payloadKey]}
                                          onChange={(event) =>
                                            updateCustomizationValue(product.id, field.payloadKey, event.target.value)
                                          }
                                          className="rounded-[18px] border-white/8 bg-white/[0.03] text-sm text-white"
                                        />
                                      </div>
                                    );
                                  }

                                  if (field.fieldType === "file") {
                                    return (
                                      <div key={`${product.id}-${field.payloadKey}`} className="space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                          <p className="text-[12px] font-semibold text-ajn-muted">{field.label}</p>
                                          {customization.customer_image_url ? (
                                            <button
                                              type="button"
                                              className="text-[11px] font-semibold text-red-200 transition hover:text-red-100"
                                              onClick={() =>
                                                updateCustomizationValue(product.id, "customer_image_url", "")
                                              }
                                            >
                                              حذف
                                            </button>
                                          ) : null}
                                        </div>
                                        <label className="flex h-10 cursor-pointer items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.03] text-xs font-semibold text-white transition hover:border-ajn-gold/35 hover:bg-white/[0.05]">
                                          {uploadingCustomizationImageFor === product.id
                                            ? "جاري الرفع..."
                                            : customization.customer_image_url
                                              ? "تغيير الصورة"
                                              : "رفع صورة"}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(event) => {
                                              const file = event.target.files?.[0];
                                              if (file) {
                                                void uploadCustomerImage(product.id, file);
                                              }
                                            }}
                                          />
                                        </label>
                                        {customization.customer_image_url ? (
                                          <PreviewImage
                                            src={buildProductImageProxyUrl(customization.customer_image_url)}
                                            previewSrc={buildProductImageProxyUrl(customization.customer_image_url)}
                                            alt={`${product.name} تخصيص`}
                                            containerClassName="h-24 rounded-[18px] border border-white/8 bg-white/[0.03] p-2"
                                            imageClassName="object-contain"
                                          />
                                        ) : null}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div key={`${product.id}-${field.payloadKey}`} className="space-y-2">
                                      <p className="text-[12px] font-semibold text-ajn-muted">{field.label}</p>
                                      <Input
                                        placeholder={field.placeholder}
                                        value={customization[field.payloadKey]}
                                        onChange={(event) =>
                                          updateCustomizationValue(product.id, field.payloadKey, event.target.value)
                                        }
                                        className="rounded-[18px] border-white/8 bg-white/[0.03] text-sm text-white placeholder:text-ajn-muted"
                                      />
                                    </div>
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
                          {product.video_url ? (
                            <button
                              type="button"
                              onClick={() => setActiveVideoProduct({ product, sectionKey: visibleKey })}
                              className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-ajn-goldSoft"
                            >
                              <PlayCircle className="h-4 w-4 text-ajn-gold" />
                              مشاهدة الفيديو
                            </button>
                          ) : null}
                          <div className="flex flex-col gap-2.5 pt-1">
                            <QuantityControl
                              className="w-full"
                              size="compact"
                              value={getQuantity(product.id)}
                              onChange={(value) => setQuantity(product.id, value)}
                              disabled={soldOut}
                            />
                            <Button
                              className="h-11 w-full rounded-2xl text-sm"
                              disabled={soldOut}
                              onClick={() =>
                                addItem(product, getQuantity(product.id), selectedColor, customization)
                              }
                            >
                              {soldOut ? "نفذت الكمية" : "إضافة للسلة"}
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
        {visibleVideoProduct ? (
          <div
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-md sm:px-6 sm:py-8"
            onClick={() => setActiveVideoProduct(null)}
          >
            <button
              type="button"
              onClick={() => setActiveVideoProduct(null)}
              className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>

            <div
              className="relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-ajn-line bg-[#070707]/95 p-4 shadow-gold sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ajn-goldSoft">فيديو المنتج</p>
                  <h3 className="text-xl font-bold text-white">{visibleVideoProduct.name}</h3>
                </div>
                <Video className="h-5 w-5 text-ajn-gold" />
              </div>
              {isDirectVideoUrl(visibleVideoProduct.video_url) ? (
                <video controls autoPlay className="max-h-[78vh] w-full rounded-[24px] bg-black">
                  <source src={buildProductImageProxyUrl(visibleVideoProduct.video_url)} />
                </video>
              ) : (
                <iframe
                  src={getVideoEmbedUrl(visibleVideoProduct.video_url)}
                  className="h-[72vh] w-full rounded-[24px] border border-white/10 bg-black"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title={visibleVideoProduct.name}
                />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
