"use client";

import { Eye, EyeOff, ImagePlus, Package2, Pencil, Save, Trash2 } from "lucide-react";
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
  SHOP_PRODUCT_IMAGE_FITS,
  SHOP_PRODUCT_IMAGE_POSITIONS,
} from "@/lib/shop-constants";
import type { ProductRecord, ServiceCategoryRecord, ShopSettingsRecord } from "@/lib/shop-types";
import {
  buildProductImageProxyUrl,
  getProductImagePresentation,
} from "@/lib/shop-utils";
import { formatAmountInputValue, formatAmountWithCurrency } from "@/lib/utils";

type CatalogTab = "categories" | "products";

const emptyCategoryForm = {
  id: "",
  name: "",
  slug: "",
  parent_id: "",
  image_url: "",
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
  image_fit: "contain",
  image_position: "center center",
  image_zoom: "1",
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

  const uploadImage = async (file: File, kind: "category" | "product") => {
    const formData = new FormData();
    formData.append("files", file);

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
      const payload = (await response.json()) as { message?: string; urls?: string[] };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر رفع الصورة.");
      }

      const uploadedUrl = payload.urls?.[0] ?? "";
      if (!uploadedUrl) {
        throw new Error("تعذر رفع الصورة.");
      }

      if (kind === "category") {
        setCategoryForm((current) => ({ ...current, image_url: uploadedUrl }));
      } else {
        setProductForm((current) => ({ ...current, image_url: uploadedUrl }));
      }

      toast.success("تم رفع الصورة.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الصورة.");
    } finally {
      if (kind === "category") {
        setUploadingCategoryImage(false);
      } else {
        setUploadingProductImage(false);
      }
    }
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
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف الصورة.");
      }

      setCategories((current) =>
        current.map((item) => (item.id === category.id ? { ...item, image_url: "" } : item)),
      );
      setCategoryForm((current) =>
        current.id === category.id ? { ...current, image_url: "" } : current,
      );

      const warning = await deleteStoredImage(category.image_url);
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
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف الصورة.");
      }

      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, image_url: "" } : item)),
      );
      setProductForm((current) =>
        current.id === product.id ? { ...current, image_url: "" } : current,
      );

      const warning = await deleteStoredImage(product.image_url);
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
          }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(payload.message || "تعذر حذف الصورة.");
        }
      }

      setCategoryForm((current) => ({ ...current, image_url: "" }));
      setCategories((current) =>
        current.map((item) =>
          item.id === categoryForm.id ? { ...item, image_url: "" } : item,
        ),
      );

      const warning = await deleteStoredImage(previousUrl);
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
          }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(payload.message || "تعذر حذف الصورة.");
        }
      }

      setProductForm((current) => ({ ...current, image_url: "" }));
      setProducts((current) =>
        current.map((item) =>
          item.id === productForm.id ? { ...item, image_url: "" } : item,
        ),
      );

      const warning = await deleteStoredImage(previousUrl);
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
                  {uploadingCategoryImage ? "جاري الرفع..." : "رفع صورة"}
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
                          src={buildProductImageProxyUrl((item as ServiceCategoryRecord).image_url)}
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
                    src={buildProductImageProxyUrl(productForm.image_url)}
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
                  {uploadingProductImage ? "جاري الرفع..." : "رفع صورة"}
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
                      onClick={() => setProductForm(emptyProductForm)}
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

              {productForm.image_url ? (
                <div className="relative">
                  <PreviewImage
                    src={buildProductImageProxyUrl(productForm.image_url)}
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
            </div>

            <div className="space-y-4">
              {(loading ? Array.from({ length: 3 }) : products).map((item, index) =>
                loading ? (
                  <div key={index} className="surface-panel h-24 animate-pulse bg-white/[0.03]" />
                ) : (() => {
                  const productItem = item as ProductRecord;
                  const itemImagePresentation = getProductImagePresentation(productItem);

                  return (
                  <div key={productItem.id} className="surface-panel p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative">
                        <PreviewImage
                          src={buildProductImageProxyUrl(productItem.image_url)}
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
                        <p className="mt-2 text-sm text-ajn-gold">
                          {formatAmountWithCurrency(productItem.price)}
                        </p>
                        <p className="mt-1 text-sm text-ajn-muted">
                          {categoryMap.get(productItem.category_id)?.name ?? "—"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-xs"
                          onClick={() =>
                            setProductForm({
                              id: productItem.id,
                              category_id: productItem.category_id,
                              name: productItem.name,
                              description: productItem.description,
                              price: formatAmountInputValue(productItem.price),
                              image_url: productItem.image_url,
                              image_fit: productItem.image_fit,
                              image_position: productItem.image_position,
                              image_zoom: String(productItem.image_zoom),
                              is_active: productItem.is_active,
                              sort_order: String(productItem.sort_order),
                            })
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
