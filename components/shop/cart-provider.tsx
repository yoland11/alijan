"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import type { ProductColorOption, ProductRecord, ShopCartItem } from "@/lib/shop-types";
import {
  buildShopCartItemKey,
  normalizeProductImageFit,
  normalizeProductImagePosition,
  normalizeProductImageZoom,
} from "@/lib/shop-utils";

const STORAGE_KEY = "ajn-shop-cart";

interface ShopCartContextValue {
  items: ShopCartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: ProductRecord, quantity?: number, selectedColor?: ProductColorOption | null) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  removeItem: (cartKey: string) => void;
  clearCart: () => void;
  getItemQuantity: (cartKey: string) => number;
}

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShopCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw) as ShopCartItem[];
        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter((item) => item && item.product_id && item.name).map((item) => ({
              ...item,
              quantity: Math.max(1, Number(item.quantity) || 1),
              price: Number(item.price) || 0,
              cart_key:
                item.cart_key ||
                buildShopCartItemKey(item.product_id, item.selected_color_hex, item.selected_color_name),
              thumbnail_url: item.thumbnail_url || item.image_url || "",
              image_fit: normalizeProductImageFit(item.image_fit),
              image_position: normalizeProductImagePosition(item.image_position),
              image_zoom: normalizeProductImageZoom(item.image_zoom),
              selected_color_name: item.selected_color_name || "",
              selected_color_hex: item.selected_color_hex || "",
            })),
          );
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<ShopCartContextValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal,
      itemCount,
      addItem: (product, quantity = 1, selectedColor = null) => {
        setItems((current) => {
          const cartKey = buildShopCartItemKey(
            product.id,
            selectedColor?.color_hex ?? "",
            selectedColor?.color_name ?? "",
          );
          const existing = current.find((item) => item.cart_key === cartKey);
          const nextQuantity = Math.max(1, quantity);

          if (existing) {
            return current.map((item) =>
              item.cart_key === cartKey
                ? { ...item, quantity: item.quantity + nextQuantity }
                : item,
            );
          }

          return [
            ...current,
            {
              cart_key: cartKey,
              product_id: product.id,
              name: product.name,
              image_url: product.image_url,
              thumbnail_url: product.thumbnail_url,
              image_fit: product.image_fit,
              image_position: product.image_position,
              image_zoom: product.image_zoom,
              selected_color_name: selectedColor?.color_name ?? "",
              selected_color_hex: selectedColor?.color_hex ?? "",
              price: product.price,
              quantity: nextQuantity,
            },
          ];
        });

        toast.success("تمت الإضافة للسلة.");
      },
      updateQuantity: (cartKey, quantity) => {
        if (quantity < 1) {
          setItems((current) => current.filter((item) => item.cart_key !== cartKey));
          toast.success("تم حذف المنتج.");
          return;
        }

        setItems((current) =>
          current.map((item) =>
            item.cart_key === cartKey ? { ...item, quantity: Math.max(1, quantity) } : item,
          ),
        );
      },
      removeItem: (cartKey) => {
        setItems((current) => current.filter((item) => item.cart_key !== cartKey));
        toast.success("تم حذف المنتج.");
      },
      clearCart: () => {
        setItems([]);
        window.localStorage.removeItem(STORAGE_KEY);
      },
      getItemQuantity: (cartKey) =>
        items.find((item) => item.cart_key === cartKey)?.quantity ?? 0,
    };
  }, [items]);

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>;
}

export function useShopCart() {
  const context = useContext(ShopCartContext);

  if (!context) {
    throw new Error("useShopCart must be used within ShopCartProvider.");
  }

  return context;
}
