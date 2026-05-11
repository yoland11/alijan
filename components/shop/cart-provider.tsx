"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import type { ProductRecord, ShopCartItem } from "@/lib/shop-types";
import {
  normalizeProductImageFit,
  normalizeProductImagePosition,
  normalizeProductImageZoom,
} from "@/lib/shop-utils";

const STORAGE_KEY = "ajn-shop-cart";

interface ShopCartContextValue {
  items: ShopCartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: ProductRecord, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
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
              image_fit: normalizeProductImageFit(item.image_fit),
              image_position: normalizeProductImagePosition(item.image_position),
              image_zoom: normalizeProductImageZoom(item.image_zoom),
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
      addItem: (product, quantity = 1) => {
        setItems((current) => {
          const existing = current.find((item) => item.product_id === product.id);
          const nextQuantity = Math.max(1, quantity);

          if (existing) {
            return current.map((item) =>
              item.product_id === product.id
                ? { ...item, quantity: item.quantity + nextQuantity }
                : item,
            );
          }

          return [
            ...current,
            {
              product_id: product.id,
              name: product.name,
              image_url: product.image_url,
              image_fit: product.image_fit,
              image_position: product.image_position,
              image_zoom: product.image_zoom,
              price: product.price,
              quantity: nextQuantity,
            },
          ];
        });

        toast.success("تمت الإضافة للسلة.");
      },
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          setItems((current) => current.filter((item) => item.product_id !== productId));
          toast.success("تم حذف المنتج.");
          return;
        }

        setItems((current) =>
          current.map((item) =>
            item.product_id === productId ? { ...item, quantity: Math.max(1, quantity) } : item,
          ),
        );
      },
      removeItem: (productId) => {
        setItems((current) => current.filter((item) => item.product_id !== productId));
        toast.success("تم حذف المنتج.");
      },
      clearCart: () => {
        setItems([]);
        window.localStorage.removeItem(STORAGE_KEY);
      },
      getItemQuantity: (productId) =>
        items.find((item) => item.product_id === productId)?.quantity ?? 0,
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
