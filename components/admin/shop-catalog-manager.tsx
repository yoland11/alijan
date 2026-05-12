"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Package2,
  Palette,
  Pencil,
  PlayCircle,
  Plus,
  Save,
  Star,
  Trash2,
  Video,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ChoiceButtonGroup } from "@/components/ui/choice-button-group";
import { Input } from "@/components/ui/input";
import { PreviewImage } from "@/components/ui/preview-image";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  SHOP_CUSTOMIZATION_FIELDS,
  SHOP_PRODUCT_COLOR_LIBRARY,
  SHOP_PRODUCT_IMAGE_FITS,
  SHOP_PRODUCT_IMAGE_POSITIONS,
} from "@/lib/shop-constants";
import type {
  ProductColorOption,
  ProductPreviewImage,
  ProductRecord,
  ServiceCategoryRecord,
  ShopSettingsRecord,
} from "@/lib/shop-types";
import {
  buildProductImageProxyUrl,
  getPrimaryPreviewImage,
  getProductImagePresentation,
} from "@/lib/shop-utils";
import { cn, formatAmountInputValue, formatAmountWithCurrency } from "@/lib/utils";

type CatalogTab = "categories" | "products";

const emptyCategoryForm = {
  id: "",
  name: "",
  slug: "",
  parent_id: "",
  image_url: "",
  thumbnail_url: "",
  is_active: true,
  sort_order: "0",
};

const emptyProductForm = {
  id: "",
  category_id: "",
  name: "",
  description: "",
  price: "0",
  image_url: "",
  thumbnail_url: "",
  image_fit: "contain",
  image_position: "center center",
  image_zoom: "1",
  color_options: [] as ProductColorOption[],
  preview_images: [] as ProductPreviewImage[],
  video_url: "",
  stock_quantity: "",
  customization_options: {
    enable_name: false,
    enable_message: false,
    enable_wrapping_note: false,
    enable_special_color: false,
    enable_occasion_date: false,
    enable_customer_image: false,
  },
  is_active: true,
  sort_order: "0",
};

const productImageFitOptions: { value: (typeof SHOP_PRODUCT_IMAGE_FITS)[number]; title: string }[] = [
  { value: "contain", title: "عرض كامل" },
  { value: "cover", title: "ملء الإطار" },
  { value: "custom", title: "قص مخصص" },
];

const productImagePositionOptions: {
  value: (typeof SHOP_PRODUCT_IMAGE_POSITIONS)[number];
  title: string;
}[] = [
  { value: "center top", title: "أعلى" },
  { value: "center center", title: "وسط" },
  { value: "center bottom", title: "أسفل" },
  { value: "right center", title: "يمين" },
  { value: "left center", title: "يسار" },
];

export function ShopCatalogManager() {
  const [tab, setTab] = useState<CatalogTab>("categories");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [uploadingProductVideo, setUploadingProductVideo] = useState(false);
  const [uploadingPreviewImages, setUploadingPreviewImages] = useState(false);
  const [activeColorOptionId, setActiveColorOptionId] = useState<string | null>(null);
  const [hoveredColorOptionId, setHoveredColorOptionId] = useState<string | null>(null);
  const [categories, setCategories] = useState<ServiceCategoryRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [, setSettings] = useState<ShopSettingsRecord | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [productForm, setProductForm] = useState(emptyProductForm);

  const rootCategories = useMemo(
    () => categories.filter((item) => !item.parent_id).sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const subCategories = useMemo(
    () => categories.filter((item) => item.parent_id).sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);

  const productPreviewStyle = useMemo<CSSProperties>(() => {
    const presentation = getProductImagePresentation({
      image_fit: productForm.image_fit,
      image_position: productForm.image_position,
      image_zoom: productForm.image_zoom,
    });

    return {
      objectFit: presentation.objectFit,
      objectPosition: presentation.objectPosition,
      transform: presentation.transform,
      transformOrigin: presentation.transformOrigin,
    };
  }, [productForm.image_fit, productForm.image_position, productForm.image_zoom]);

  const primaryPreviewImage = useMemo(
    () =>
      getPrimaryPreviewImage({
        image_url: productForm.image_url,
        thumbnail_url: productForm.thumbnail_url,
        preview_images: productForm.preview_images,
      }),
    [productForm.image_url, productForm.preview_images, productForm.thumbnail_url],
  );

  const getAdminColorSwatchClassName = (colorId: string) => {
    return cn(
      "ajn-admin-color-swatch",
      activeColorOptionId === colorId && "is-selected",
      hoveredColorOptionId === colorId && "is-hovered",
    );
  };

  const isProductColorSelected = (colorId: string) =>
    productForm.color_options.some((item) => item.id === colorId);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/shop/catalog", { cache: "no-store" });
      const payload = (await response.json()) as {
        message?: string;
        categories?: ServiceCategoryRecord[];
        products?: ProductRecord[];
        settings?: ShopSettingsRecord;
      };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحميل بيانات المتجر.");
      }

      setCategories(payload.categories ?? []);
      setProducts(payload.products ?? []);
      setSettings(payload.settings ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل بيانات المتجر.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const deleteStoredImage = async (src: string | string[]) => {
    const response = await fetch("/api/admin/media", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Array.isArray(src) ? { srcs: src } : { src }),
    });
    const payload = (await response.json()) as { message?: string; warning?: string | null };

    if (!response.ok) {
      throw new Error(payload.message || "تعذر حذف الصورة.");
    }

    return payload.warning ?? "";
  };

  const uploadImage = async (file: File, kind: "category" | "product") => {
    const formData = new FormData();
    formData.append("files", file);
    const loadingToast = toast.loading("جاري تحسين الصورة...");

    if (kind === "category") {
      setUploadingCategoryImage(true);
    } else {
      setUploadingProductImage(true);
    }

    try {
      const response = await fetch("/api/admin/media?kind=product-image", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        message?: string;
        urls?: string[];
        thumbnailUrls?: string[];
        files?: { url: string; thumbnailUrl?: string }[];
      };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر رفع الصورة.");
      }

      const uploadedUrl = payload.urls?.[0] ?? "";
      const uploadedThumbnail =
        payload.files?.[0]?.thumbnailUrl ?? payload.thumbnailUrls?.[0] ?? uploadedUrl;
      if (!uploadedUrl) {
        throw new Error("تعذر رفع الصورة.");
      }

      if (kind === "category") {
        setCategoryForm((current) => ({
          ...current,
          image_url: uploadedUrl,
          thumbnail_url: uploadedThumbnail,
        }));
      } else {
        setProductForm((current) => ({
          ...current,
          image_url: uploadedUrl,
          thumbnail_url: uploadedThumbnail,
        }));
      }

      toast.success("تم رفع الصورة وتحسينها.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الصورة.");
    } finally {
      toast.dismiss(loadingToast);
      if (kind === "category") {
        setUploadingCategoryImage(false);
      } else {
        setUploadingProductImage(false);
      }
    }
  };

  const uploadProductVideo = async (file: File) => {
    const formData = new FormData();
    formData.append("files", file);
    const loadingToast = toast.loading("جاري رفع الفيديو...");
    setUploadingProductVideo(true);

    try {
      const response = await fetch("/api/admin/media?kind=product-video", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        message?: string;
        files?: { url: string }[];
      };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر رفع الفيديو.");
      }

      const uploadedUrl = payload.files?.[0]?.url ?? "";

      if (!uploadedUrl) {
        throw new Error("تعذر رفع الفيديو.");
      }

      setProductForm((current) => ({
        ...current,
        video_url: uploadedUrl,
      }));
      toast.success("تم رفع الفيديو.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الفيديو.");
    } finally {
      toast.dismiss(loadingToast);
      setUploadingProductVideo(false);
    }
  };

  const uploadPreviewImages = async (files: FileList | File[]) => {
    const fileList = Array.from(files);

    if (!fileList.length) {
      return;
    }

    const formData = new FormData();
    fileList.forEach((file) => formData.append("files", file));
    const loadingToast = toast.loading("جاري تحسين الصورة...");
    setUploadingPreviewImages(true);

    try {
      const response = await fetch("/api/admin/media?kind=product-image", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        message?: string;
        files?: { url: string; thumbnailUrl?: string }[];
      };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر رفع صور المعاينة.");
      }

      const uploadedImages = (payload.files ?? [])
        .filter((item) => item.url)
        .map((item, index) => ({
          id: crypto.randomUUID(),
          url: item.url,
          thumbnail_url: item.thumbnailUrl || item.url,
          sort_order: productForm.preview_images.length + index,
          is_primary: productForm.preview_images.length === 0 && index === 0,
        }));

      setProductForm((current) => ({
        ...current,
        preview_images: [...current.preview_images, ...uploadedImages].map((item, index, array) => ({
          ...item,
          sort_order: index,
          is_primary: array.some((entry) => entry.is_primary) ? item.is_primary : index === 0,
        })),
      }));

      toast.success("تم رفع الصورة وتحسينها.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع صور المعاينة.");
    } finally {
      toast.dismiss(loadingToast);
      setUploadingPreviewImages(false);
    }
  };

  const toggleProductColor = (colorId: string) => {
    const paletteColor = SHOP_PRODUCT_COLOR_LIBRARY.find((item) => item.id === colorId);

    if (!paletteColor) {
      return;
    }

    setProductForm((current) => {
      const isSelected = current.color_options.some((item) => item.id === colorId);

      if (isSelected) {
        return {
          ...current,
          color_options: current.color_options.filter((item) => item.id !== colorId),
        };
      }

      const next = [...current.color_options, { ...paletteColor }];
      next.sort((a, b) => a.sort_order - b.sort_order);

      return {
        ...current,
        color_options: next,
      };
    });

    setActiveColorOptionId(colorId);
  };

  const setPrimaryPreviewImage = (id: string) => {
    setProductForm((current) => ({
      ...current,
      preview_images: current.preview_images.map((item) => ({
        ...item,
        is_primary: item.id === id,
      })),
    }));
  };

  const movePreviewImage = (id: string, direction: "up" | "down") => {
    setProductForm((current) => {
      const next = [...current.preview_images];
      const index = next.findIndex((item) => item.id === id);

      if (index < 0) {
        return current;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= next.length) {
        return current;
      }

      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return {
        ...current,
        preview_images: next.map((item, orderIndex) => ({ ...item, sort_order: orderIndex })),
      };
    });
  };

  const removePreviewImage = async (imageId: string) => {
    const previewImage = productForm.preview_images.find((item) => item.id === imageId);

    if (!previewImage || !window.confirm("هل تريد حذف هذه الصورة؟")) {
      return;
    }

    setProductForm((current) => {
      const remaining = current.preview_images.filter((item) => item.id !== imageId);
      const hasPrimary = remaining.some((item) => item.is_primary);

      return {
        ...current,
        preview_images: remaining.map((item, index) => ({
          ...item,
          sort_order: index,
          is_primary: hasPrimary ? item.is_primary : index === 0,
        })),
      };
    });
    toast.success("تم حذف الصورة. احفظ التعديل.");
  };

  const saveCategory = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        categoryForm.id ? `/api/admin/shop/categories/${categoryForm.id}` : "/api/admin/shop/categories",
        {
          method: categoryForm.id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryForm),
        },
      );
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حفظ القسم.");
      }

      toast.success(categoryForm.id ? "تم تحديث القسم." : "تم حفظ القسم.");
      setCategoryForm(emptyCategoryForm);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ القسم.");
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        productForm.id ? `/api/admin/shop/products/${productForm.id}` : "/api/admin/shop/products",
        {
          method: productForm.id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productForm),
        },
      );
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حفظ المنتج.");
      }

      toast.success(productForm.id ? "تم تحديث المنتج." : "تم حفظ المنتج.");
      setProductForm(emptyProductForm);
      setActiveColorOptionId(null);
      setHoveredColorOptionId(null);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ المنتج.");
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (id: string) => {
    if (!window.confirm("حذف القسم؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shop/categories/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف القسم.");
      }

      toast.success("تم حذف القسم.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف القسم.");
    }
  };

  const removeProduct = async (id: string) => {
    if (!window.confirm("حذف المنتج؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shop/products/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف المنتج.");
      }

      toast.success("تم حذف المنتج.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف المنتج.");
    }
  };

  const toggleCategory = async (category: ServiceCategoryRecord) => {
    try {
      const response = await fetch(`/api/admin/shop/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...category,
          is_active: !category.is_active,
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحديث القسم.");
      }

      toast.success("تم تحديث القسم.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث القسم.");
    }
  };

  const toggleProduct = async (product: ProductRecord) => {
    try {
      const response = await fetch(`/api/admin/shop/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          is_active: !product.is_active,
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحديث المنتج.");
      }

      toast.success("تم تحديث المنتج.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث المنتج.");
    }
  };

  const clearCategoryImage = async (category: ServiceCategoryRecord) => {
    if (!category.image_url || !window.confirm("هل تريد حذف هذه الصورة؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shop/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...category,
          image_url: "",
          thumbnail_url: "",
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف الصورة.");
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? { ...item, image_url: "", thumbnail_url: "" } : item,
        ),
      );
      setCategoryForm((current) =>
        current.id === category.id ? { ...current, image_url: "", thumbnail_url: "" } : current,
      );

      const warning = await deleteStoredImage([category.image_url, category.thumbnail_url].filter(Boolean));
      toast.success("تم حذف الصورة بنجاح");

      if (warning) {
        toast.message(warning);
      }

      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الصورة.");
    }
  };

  const clearProductImage = async (product: ProductRecord) => {
    if (!product.image_url || !window.confirm("هل تريد حذف هذه الصورة؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shop/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          image_url: "",
          thumbnail_url: "",
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف الصورة.");
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, image_url: "", thumbnail_url: "" } : item,
        ),
      );
      setProductForm((current) =>
        current.id === product.id ? { ...current, image_url: "", thumbnail_url: "" } : current,
      );

      const warning = await deleteStoredImage([product.image_url, product.thumbnail_url].filter(Boolean));
      toast.success("تم حذف الصورة بنجاح");

      if (warning) {
        toast.message(warning);
      }

      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الصورة.");
    }
  };

  const clearCategoryFormImage = async () => {
    if (!categoryForm.image_url || !window.confirm("هل تريد حذف هذه الصورة؟")) {
      return;
    }

    try {
      const previousUrl = categoryForm.image_url;

      if (categoryForm.id) {
        const response = await fetch(`/api/admin/shop/categories/${categoryForm.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...categoryForm,
            image_url: "",
            thumbnail_url: "",
          }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(payload.message || "تعذر حذف الصورة.");
        }
      }

      setCategoryForm((current) => ({ ...current, image_url: "", thumbnail_url: "" }));
      setCategories((current) =>
        current.map((item) =>
          item.id === categoryForm.id ? { ...item, image_url: "", thumbnail_url: "" } : item,
        ),
      );

      const warning = await deleteStoredImage([previousUrl, categoryForm.thumbnail_url].filter(Boolean));
      toast.success("تم حذف الصورة بنجاح");

      if (warning) {
        toast.message(warning);
      }

      if (categoryForm.id) {
        await loadData();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الصورة.");
    }
  };

  const clearProductFormImage = async () => {
    if (!productForm.image_url || !window.confirm("هل تريد حذف هذه الصورة؟")) {
      return;
    }

    try {
      const previousUrl = productForm.image_url;

      if (productForm.id) {
        const response = await fetch(`/api/admin/shop/products/${productForm.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...productForm,
            image_url: "",
            thumbnail_url: "",
          }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(payload.message || "تعذر حذف الصورة.");
        }
      }

      setProductForm((current) => ({ ...current, image_url: "", thumbnail_url: "" }));
      setProducts((current) =>
        current.map((item) =>
          item.id === productForm.id ? { ...item, image_url: "", thumbnail_url: "" } : item,
        ),
      );

      const warning = await deleteStoredImage([previousUrl, productForm.thumbnail_url].filter(Boolean));
      toast.success("تم حذف الصورة بنجاح");

      if (warning) {
        toast.message(warning);
      }

      if (productForm.id) {
        await loadData();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الصورة.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="surface-panel p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <AdminTabButton active={tab === "categories"} onClick={() => setTab("categories")}>
            الأقسام
          </AdminTabButton>
          <AdminTabButton active={tab === "products"} onClick={() => setTab("products")}>
            المنتجات
          </AdminTabButton>
        </div>

        {tab === "categories" ? (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="اسم القسم"
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                />
                <Input
                  placeholder="Slug"
                  value={categoryForm.slug}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, slug: event.target.value }))}
                />
                <Select
                  value={categoryForm.parent_id}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, parent_id: event.target.value }))
                  }
                >
                  <option value="" className="bg-black">خدمة رئيسية</option>
                  {rootCategories.map((category) => (
                    <option key={category.id} value={category.id} className="bg-black">
                      {category.name}
                    </option>
                  ))}
                </Select>
                <Input
                  placeholder="الترتيب"
                  value={categoryForm.sort_order}
                  inputMode="numeric"
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, sort_order: event.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <label className="flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                  <ImagePlus className="ml-2 h-4 w-4 text-ajn-gold" />
                  {uploadingCategoryImage ? "جاري تحسين الصورة..." : "رفع صورة"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadImage(file, "category");
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setCategoryForm((current) => ({ ...current, is_active: !current.is_active }))
                  }
                  className={`h-12 rounded-2xl border px-5 text-sm font-semibold transition ${
                    categoryForm.is_active
                      ? "border-ajn-gold/35 bg-ajn-gold/[0.12] text-ajn-goldSoft"
                      : "border-ajn-line bg-white/[0.04] text-white"
                  }`}
                >
                  {categoryForm.is_active ? "مفعل" : "مخفي"}
                </button>

                <div className="flex flex-1 flex-wrap justify-end gap-3">
                  {(categoryForm.image_url || categoryForm.id) ? (
                    <Button
                      variant="secondary"
                      onClick={() => setCategoryForm(emptyCategoryForm)}
                    >
                      جديد
                    </Button>
                  ) : null}
                  <Button onClick={saveCategory} disabled={saving}>
                    <Save className="h-4 w-4" />
                    {categoryForm.id ? "حفظ التعديل" : "حفظ"}
                  </Button>
                </div>
              </div>

              {categoryForm.image_url ? (
                <div className="relative">
                  <PreviewImage
                    src={buildProductImageProxyUrl(categoryForm.image_url)}
                    alt="category"
                    containerClassName="h-44 rounded-3xl border border-ajn-line bg-white/[0.03] p-4"
                    imageClassName="object-contain"
                  />
                  <Button
                    variant="danger"
                    className="absolute left-3 top-3 h-9 px-3 text-xs"
                    onClick={() => void clearCategoryFormImage()}
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف الصورة
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              {(loading ? Array.from({ length: 3 }) : [...rootCategories, ...subCategories]).map((item, index) =>
                loading ? (
                  <div key={index} className="surface-panel h-24 animate-pulse bg-white/[0.03]" />
                ) : (
                  <div key={(item as ServiceCategoryRecord).id} className="surface-panel p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative">
                        <PreviewImage
                          src={buildProductImageProxyUrl(
                            (item as ServiceCategoryRecord).thumbnail_url ||
                              (item as ServiceCategoryRecord).image_url,
                          )}
                          previewSrc={buildProductImageProxyUrl((item as ServiceCategoryRecord).image_url)}
                          alt={(item as ServiceCategoryRecord).name}
                          containerClassName="h-20 w-full rounded-2xl bg-white/[0.04] p-2 sm:w-24"
                          imageClassName="object-contain"
                          fallback={
                            <div className="flex h-full items-center justify-center text-ajn-gold">
                              <Package2 className="h-7 w-7" />
                            </div>
                          }
                        />
                        {(item as ServiceCategoryRecord).image_url ? (
                          <button
                            type="button"
                            onClick={() => void clearCategoryImage(item as ServiceCategoryRecord)}
                            className="absolute left-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-400/30 bg-black/75 text-red-200 transition hover:bg-red-500/20"
                            aria-label="حذف الصورة"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{(item as ServiceCategoryRecord).name}</h3>
                          <span className="rounded-full border border-ajn-line px-2 py-0.5 text-xs text-ajn-muted">
                            {(item as ServiceCategoryRecord).parent_id ? "فرعي" : "رئيسي"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-ajn-muted">Slug: {(item as ServiceCategoryRecord).slug}</p>
                        <p className="mt-1 text-sm text-ajn-muted">الترتيب: {(item as ServiceCategoryRecord).sort_order}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-xs"
                          onClick={() =>
                            setCategoryForm({
                              id: (item as ServiceCategoryRecord).id,
                              name: (item as ServiceCategoryRecord).name,
                              slug: (item as ServiceCategoryRecord).slug,
                              parent_id: (item as ServiceCategoryRecord).parent_id ?? "",
                              image_url: (item as ServiceCategoryRecord).image_url,
                              thumbnail_url: (item as ServiceCategoryRecord).thumbnail_url,
                              is_active: (item as ServiceCategoryRecord).is_active,
                              sort_order: String((item as ServiceCategoryRecord).sort_order),
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                          تعديل
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-xs"
                          onClick={() => toggleCategory(item as ServiceCategoryRecord)}
                        >
                          {(item as ServiceCategoryRecord).is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {(item as ServiceCategoryRecord).is_active ? "إخفاء" : "إظهار"}
                        </Button>
                        <Button
                          variant="danger"
                          className="px-3 py-2 text-xs"
                          onClick={() => removeCategory((item as ServiceCategoryRecord).id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  value={productForm.category_id}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, category_id: event.target.value }))
                  }
                >
                  <option value="" className="bg-black">القسم الفرعي</option>
                  {subCategories.map((category) => (
                    <option key={category.id} value={category.id} className="bg-black">
                      {category.name}
                    </option>
                  ))}
                </Select>
                <Input
                  placeholder="اسم المنتج"
                  value={productForm.name}
                  onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                />
                <Input
                  placeholder="السعر"
                  value={productForm.price}
                  inputMode="decimal"
                  onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                />
                <Input
                  placeholder="الكمية المتوفرة"
                  value={productForm.stock_quantity}
                  inputMode="numeric"
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, stock_quantity: event.target.value }))
                  }
                />
                <Input
                  placeholder="الترتيب"
                  value={productForm.sort_order}
                  inputMode="numeric"
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, sort_order: event.target.value }))
                  }
                />
              </div>

              <Textarea
                placeholder="وصف المنتج"
                className="min-h-[96px]"
                value={productForm.description}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, description: event.target.value }))
                }
              />

              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <Input
                  placeholder="فيديو المنتج"
                  value={productForm.video_url}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, video_url: event.target.value }))
                  }
                />
                <label className="flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                  <Video className="ml-2 h-4 w-4 text-ajn-gold" />
                  {uploadingProductVideo ? "جاري الرفع..." : "رفع فيديو"}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadProductVideo(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="surface-panel-strong space-y-4 rounded-[28px] p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-ajn-gold" />
                  <h3 className="text-lg font-bold text-white">تخصيص المنتج</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SHOP_CUSTOMIZATION_FIELDS.map((field) => {
                    const enabled = productForm.customization_options[field.key];

                    return (
                      <button
                        key={field.key}
                        type="button"
                        onClick={() =>
                          setProductForm((current) => ({
                            ...current,
                            customization_options: {
                              ...current.customization_options,
                              [field.key]: !current.customization_options[field.key],
                            },
                          }))
                        }
                        className={`rounded-[22px] border px-4 py-4 text-right transition ${
                          enabled
                            ? "border-ajn-gold bg-ajn-gold/[0.12] text-ajn-gold"
                            : "border-ajn-line bg-white/[0.03] text-white hover:border-ajn-gold/35"
                        }`}
                      >
                        <p className="font-semibold">{field.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="surface-panel-strong space-y-4 rounded-[28px] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-ajn-gold" />
                    <h3 className="text-lg font-bold text-white">الألوان المتوفرة</h3>
                  </div>
                  <span className="text-xs font-semibold text-ajn-goldSoft">
                    {productForm.color_options.length} / {SHOP_PRODUCT_COLOR_LIBRARY.length}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[22px] border border-ajn-line bg-black/30 px-4 py-5">
                    <div className="ajn-admin-color-deck">
                      {SHOP_PRODUCT_COLOR_LIBRARY.map((color) => {
                        const isSelected = isProductColorSelected(color.id);

                        return (
                          <button
                            key={color.id}
                            type="button"
                            className={cn(
                              getAdminColorSwatchClassName(color.id),
                              isSelected && "is-selected",
                            )}
                            style={
                              {
                                ["--swatch-color" as "--swatch-color"]: color.color_hex,
                              } as CSSProperties
                            }
                            data-color-label={color.color_name}
                            aria-label={color.color_name}
                            onMouseEnter={() => setHoveredColorOptionId(color.id)}
                            onMouseLeave={() => setHoveredColorOptionId(null)}
                            onFocus={() => {
                              setActiveColorOptionId(color.id);
                              setHoveredColorOptionId(color.id);
                            }}
                            onBlur={() => setHoveredColorOptionId(null)}
                            onClick={() => toggleProductColor(color.id)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {productForm.color_options.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {productForm.color_options.map((color) => (
                        <div
                          key={color.id}
                          className={cn(
                            "ajn-admin-color-editor-row is-active relative flex items-center justify-between gap-3 rounded-[18px] border border-ajn-line bg-white/[0.03] px-3 py-3",
                            activeColorOptionId === color.id && "ring-1 ring-ajn-gold/25",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleProductColor(color.id)}
                            className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-400/25 bg-black/70 text-red-200 transition hover:border-red-400/45 hover:bg-red-500/15"
                            aria-label={`حذف اللون ${color.color_name}`}
                            title="حذف اللون"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="ajn-admin-color-swatch is-selected"
                              style={
                                {
                                  ["--swatch-color" as "--swatch-color"]: color.color_hex,
                                } as CSSProperties
                              }
                              data-color-label={color.color_name}
                              aria-label={color.color_name}
                              onMouseEnter={() => setHoveredColorOptionId(color.id)}
                              onMouseLeave={() => setHoveredColorOptionId(null)}
                              onClick={() => setActiveColorOptionId(color.id)}
                            />
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-white">{color.color_name}</p>
                              <p className="text-xs text-ajn-muted">{color.color_hex}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ajn-muted">اختياري. اختر من الألوان الجاهزة فقط.</p>
                  )}
                </div>
              </div>

              <div className="surface-panel-strong space-y-4 rounded-[28px] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="h-5 w-5 text-ajn-gold" />
                    <h3 className="text-lg font-bold text-white">صور معاينة المنتج</h3>
                  </div>
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                    <Plus className="ml-2 h-4 w-4 text-ajn-gold" />
                    {uploadingPreviewImages ? "جاري تحسين الصورة..." : "رفع صور"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        if (event.target.files?.length) {
                          void uploadPreviewImages(event.target.files);
                        }
                      }}
                    />
                  </label>
                </div>

                {productForm.preview_images.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {productForm.preview_images
                      .slice()
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((image, index) => (
                        <div key={image.id} className="rounded-[24px] border border-ajn-line bg-white/[0.03] p-3">
                          <div className="relative">
                            <PreviewImage
                              src={buildProductImageProxyUrl(image.thumbnail_url || image.url)}
                              previewSrc={buildProductImageProxyUrl(image.url)}
                              alt={`${productForm.name || "صورة معاينة"} ${index + 1}`}
                              containerClassName="h-40 rounded-[20px] bg-black/20 p-3"
                              imageClassName="object-contain"
                            />
                            {image.is_primary ? (
                              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-ajn-gold/20 bg-black/75 px-2 py-1 text-[11px] font-semibold text-ajn-gold">
                                <Star className="h-3 w-3 fill-current" />
                                أساسية
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 flex flex-wrap justify-end gap-2">
                            <Button
                              variant="secondary"
                              className="h-9 px-3 text-xs"
                              onClick={() => setPrimaryPreviewImage(image.id)}
                            >
                              <Star className="h-3.5 w-3.5" />
                              أساسية
                            </Button>
                            <Button
                              variant="secondary"
                              className="h-9 px-3 text-xs"
                              onClick={() => movePreviewImage(image.id, "up")}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="secondary"
                              className="h-9 px-3 text-xs"
                              onClick={() => movePreviewImage(image.id, "down")}
                              disabled={index === productForm.preview_images.length - 1}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="danger"
                              className="h-9 px-3 text-xs"
                              onClick={() => void removePreviewImage(image.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-ajn-muted">إذا لم تضف صورًا فلن يظهر زر معاينة المنتج للزبون.</p>
                )}
              </div>

              <div className="surface-panel-strong space-y-4 rounded-[28px] p-4 sm:p-5">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-white">إعدادات عرض الصورة</h3>
                  <p className="text-sm text-ajn-muted">تظهر للأدمن فقط.</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white">طريقة العرض</p>
                  <ChoiceButtonGroup
                    options={productImageFitOptions}
                    value={productForm.image_fit}
                    onChange={(value) =>
                      setProductForm((current) => ({ ...current, image_fit: value }))
                    }
                    gridClassName="grid-cols-1 lg:grid-cols-3"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white">الموقع</p>
                  <ChoiceButtonGroup
                    options={productImagePositionOptions}
                    value={productForm.image_position}
                    onChange={(value) =>
                      setProductForm((current) => ({ ...current, image_position: value }))
                    }
                    gridClassName="grid-cols-2 lg:grid-cols-5"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Zoom</p>
                    <span className="text-sm font-semibold text-ajn-gold">
                      {Number(productForm.image_zoom || 1).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={productForm.image_zoom}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, image_zoom: event.target.value }))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#D4AF37]"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white">المعاينة</p>
                  <PreviewImage
                    src={buildProductImageProxyUrl(primaryPreviewImage?.thumbnail_url || productForm.image_url)}
                    previewSrc={buildProductImageProxyUrl(primaryPreviewImage?.url || productForm.image_url)}
                    alt={productForm.name || "معاينة المنتج"}
                    containerClassName="h-56 rounded-[26px] border border-ajn-line bg-white/[0.03] p-4"
                    imageStyle={productPreviewStyle}
                    previewImageStyle={{
                      objectFit: productPreviewStyle.objectFit,
                      objectPosition: productPreviewStyle.objectPosition,
                    }}
                    imageClassName="object-contain"
                    fallback={
                      <div className="flex h-full items-center justify-center text-ajn-gold">
                        <Package2 className="h-10 w-10" />
                      </div>
                    }
                  />
                </div>
              </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <label className="flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                    <ImagePlus className="ml-2 h-4 w-4 text-ajn-gold" />
                  {uploadingProductImage ? "جاري تحسين الصورة..." : "رفع صورة"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadImage(file, "product");
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setProductForm((current) => ({ ...current, is_active: !current.is_active }))
                  }
                  className={`h-12 rounded-2xl border px-5 text-sm font-semibold transition ${
                    productForm.is_active
                      ? "border-ajn-gold/35 bg-ajn-gold/[0.12] text-ajn-goldSoft"
                      : "border-ajn-line bg-white/[0.04] text-white"
                  }`}
                >
                  {productForm.is_active ? "مفعل" : "مخفي"}
                </button>

                <div className="flex flex-1 flex-wrap justify-end gap-3">
                  {(productForm.image_url || productForm.id) ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setProductForm(emptyProductForm);
                        setActiveColorOptionId(null);
                        setHoveredColorOptionId(null);
                      }}
                    >
                      جديد
                    </Button>
                  ) : null}
                  <Button onClick={saveProduct} disabled={saving}>
                    <Save className="h-4 w-4" />
                    {productForm.id ? "حفظ التعديل" : "حفظ"}
                  </Button>
                </div>
              </div>

                {primaryPreviewImage?.url || productForm.image_url ? (
                  <div className="relative">
                  <PreviewImage
                    src={buildProductImageProxyUrl(primaryPreviewImage?.thumbnail_url || productForm.image_url)}
                    previewSrc={buildProductImageProxyUrl(primaryPreviewImage?.url || productForm.image_url)}
                    alt="product"
                    containerClassName="h-44 rounded-3xl border border-ajn-line bg-white/[0.03] p-4"
                    imageStyle={productPreviewStyle}
                    previewImageStyle={{
                      objectFit: productPreviewStyle.objectFit,
                      objectPosition: productPreviewStyle.objectPosition,
                    }}
                    imageClassName="object-contain"
                  />
                  <Button
                    variant="danger"
                    className="absolute left-3 top-3 h-9 px-3 text-xs"
                    onClick={() => void clearProductFormImage()}
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف الصورة
                  </Button>
                  </div>
                ) : null}

                {productForm.video_url ? (
                  <div className="rounded-[24px] border border-ajn-line bg-black/25 p-4">
                    <p className="mb-3 text-sm font-semibold text-white">فيديو المنتج</p>
                    <video controls className="h-56 w-full rounded-[20px] bg-black">
                      <source src={buildProductImageProxyUrl(productForm.video_url)} />
                    </video>
                  </div>
                ) : null}
              </div>

            <div className="space-y-4">
              {(loading ? Array.from({ length: 3 }) : products).map((item, index) =>
                loading ? (
                  <div key={index} className="surface-panel h-24 animate-pulse bg-white/[0.03]" />
                ) : (() => {
                  const productItem = item as ProductRecord;
                  const itemImagePresentation = getProductImagePresentation(productItem);
                  const itemPrimaryPreviewImage = getPrimaryPreviewImage(productItem);

                  return (
                  <div key={productItem.id} className="surface-panel p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative">
                        <PreviewImage
                          src={buildProductImageProxyUrl(
                            itemPrimaryPreviewImage?.thumbnail_url || productItem.thumbnail_url || productItem.image_url,
                          )}
                          previewSrc={buildProductImageProxyUrl(itemPrimaryPreviewImage?.url || productItem.image_url)}
                          alt={productItem.name}
                          containerClassName="h-20 w-full rounded-2xl bg-white/[0.04] p-2 sm:w-24"
                          imageStyle={{
                            objectFit: itemImagePresentation.objectFit,
                            objectPosition: itemImagePresentation.objectPosition,
                            transform: itemImagePresentation.transform,
                            transformOrigin: itemImagePresentation.transformOrigin,
                          }}
                          previewImageStyle={{
                            objectFit: itemImagePresentation.objectFit,
                            objectPosition: itemImagePresentation.objectPosition,
                          }}
                          imageClassName="object-contain"
                          fallback={
                            <div className="flex h-full items-center justify-center text-ajn-gold">
                              <Package2 className="h-7 w-7" />
                            </div>
                          }
                        />
                        {productItem.image_url ? (
                          <button
                            type="button"
                            onClick={() => void clearProductImage(productItem)}
                            className="absolute left-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-400/30 bg-black/75 text-red-200 transition hover:bg-red-500/20"
                            aria-label="حذف الصورة"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{productItem.name}</h3>
                        {productItem.description ? (
                          <p className="mt-2 text-sm leading-6 text-ajn-muted">
                            {productItem.description}
                          </p>
                        ) : null}
                        {productItem.color_options.length ? (
                          <div className="ajn-admin-color-deck mt-3">
                            {productItem.color_options.slice(0, 5).map((color) => (
                              <button
                                key={color.id}
                                type="button"
                                className="ajn-admin-color-swatch"
                                style={
                                  {
                                    ["--swatch-color" as "--swatch-color"]: color.color_hex || "#D4AF37",
                                  } as CSSProperties
                                }
                                data-color-label={color.color_name || color.color_hex || "#D4AF37"}
                                aria-label={color.color_name || color.color_hex || "#D4AF37"}
                                tabIndex={-1}
                              />
                            ))}
                          </div>
                        ) : null}
                        {productItem.preview_images.length ? (
                          <p className="mt-2 text-xs font-semibold text-ajn-goldSoft">
                            صور المعاينة: {productItem.preview_images.length}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm text-ajn-gold">
                          {formatAmountWithCurrency(productItem.price)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-ajn-muted">
                          {typeof productItem.stock_quantity === "number"
                            ? productItem.stock_quantity > 0
                              ? `${productItem.stock_quantity} متوفر`
                              : "نفذت الكمية"
                            : "متوفر"}
                        </p>
                        {productItem.video_url ? (
                          <p className="mt-1 text-xs font-semibold text-ajn-goldSoft">يوجد فيديو</p>
                        ) : null}
                        {Object.values(productItem.customization_options).some(Boolean) ? (
                          <p className="mt-1 text-xs font-semibold text-ajn-goldSoft">يدعم التخصيص</p>
                        ) : null}
                        <p className="mt-1 text-sm text-ajn-muted">
                          {categoryMap.get(productItem.category_id)?.name ?? "—"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-xs"
                          onClick={() =>
                            (() => {
                              setProductForm({
                                id: productItem.id,
                                category_id: productItem.category_id,
                                name: productItem.name,
                                description: productItem.description,
                                price: formatAmountInputValue(productItem.price),
                                image_url: productItem.image_url,
                                thumbnail_url: productItem.thumbnail_url,
                                image_fit: productItem.image_fit,
                                image_position: productItem.image_position,
                                image_zoom: String(productItem.image_zoom),
                                color_options: productItem.color_options,
                                preview_images: productItem.preview_images,
                                video_url: productItem.video_url,
                                stock_quantity:
                                  typeof productItem.stock_quantity === "number"
                                    ? String(productItem.stock_quantity)
                                    : "",
                                customization_options: productItem.customization_options,
                                is_active: productItem.is_active,
                                sort_order: String(productItem.sort_order),
                              });
                              setActiveColorOptionId(productItem.color_options[0]?.id ?? null);
                              setHoveredColorOptionId(null);
                            })()
                          }
                        >
                          <Pencil className="h-4 w-4" />
                          تعديل
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-xs"
                          onClick={() => toggleProduct(productItem)}
                        >
                          {productItem.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {productItem.is_active ? "إخفاء" : "إظهار"}
                        </Button>
                        <Button
                          variant="danger"
                          className="px-3 py-2 text-xs"
                          onClick={() => removeProduct(productItem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                  );
                })(),
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AdminTabButton({
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
      className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-ajn-gold/35 bg-ajn-gold/[0.12] text-ajn-goldSoft"
          : "border-ajn-line bg-white/[0.03] text-white hover:bg-white/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}
