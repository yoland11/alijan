"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

import { useShopCart } from "@/components/shop/cart-provider";
import { QuantityControl } from "@/components/shop/quantity-control";
import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { Button } from "@/components/ui/button";
import { HomeLinkButton } from "@/components/ui/home-link-button";
import { PreviewImage } from "@/components/ui/preview-image";
import { buildProductImageProxyUrl, getProductImagePresentation } from "@/lib/shop-utils";
import { formatAmountWithCurrency } from "@/lib/utils";

export function CartPageClient() {
  const { items, subtotal, updateQuantity, removeItem } = useShopCart();

  return (
    <div className="page-shell pb-28 pt-6 sm:pt-10">
      <div className="section-shell space-y-7">
        <HomeLinkButton />

        <AnimatedServicePanel className="sticky-shell surface-panel-strong noise-overlay p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">السلة</h1>
            <Link
              href="/services"
              className="inline-flex h-11 items-center rounded-2xl border border-ajn-line bg-white/[0.05] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              رجوع
            </Link>
          </div>
        </AnimatedServicePanel>

        {items.length ? (
          <>
            <div className="space-y-5">
              {items.map((item) => (
                <div key={item.product_id} className="surface-panel p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {(() => {
                      const imagePresentation = getProductImagePresentation(item);

                      return (
                        <PreviewImage
                          src={buildProductImageProxyUrl(item.thumbnail_url || item.image_url)}
                          previewSrc={buildProductImageProxyUrl(item.image_url)}
                          alt={item.name}
                          containerClassName="h-24 w-full rounded-2xl bg-white/[0.04] p-3 sm:w-28"
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
                              <ShoppingBag className="h-8 w-8" />
                            </div>
                          }
                        />
                      );
                    })()}

                    <div className="flex-1 space-y-2">
                      <h2 className="text-xl font-bold text-white">{item.name}</h2>
                      {item.selected_color_name || item.selected_color_hex ? (
                        <div className="flex items-center gap-2 text-sm text-ajn-muted">
                          <span>اللون:</span>
                          {item.selected_color_hex ? (
                            <span
                              className="inline-flex h-4 w-4 rounded-full border border-white/15"
                              style={{ backgroundColor: item.selected_color_hex }}
                            />
                          ) : null}
                          <span>{item.selected_color_name || item.selected_color_hex}</span>
                        </div>
                      ) : null}
                      <p className="text-sm text-ajn-gold">{formatAmountWithCurrency(item.price)}</p>
                      <p className="text-sm text-white">
                        المجموع: {formatAmountWithCurrency(item.price * item.quantity)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <QuantityControl
                        className="w-full sm:w-auto"
                        value={item.quantity}
                        onChange={(value) => updateQuantity(item.cart_key, value)}
                      />
                      <Button
                        variant="danger"
                        className="w-full sm:w-auto"
                        onClick={() => removeItem(item.cart_key)}
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="surface-panel p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between text-lg font-semibold text-white">
                <span>المجموع</span>
                <span className="text-ajn-gold">{formatAmountWithCurrency(subtotal)}</span>
              </div>
              <Link href="/checkout">
                <Button className="w-full">إتمام الشراء</Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="luxury-empty">
            لا توجد منتجات.
          </div>
        )}
      </div>
    </div>
  );
}
