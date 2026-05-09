"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useShopCart } from "@/components/shop/cart-provider";

export function FloatingCartPill() {
  const pathname = usePathname();
  const { itemCount } = useShopCart();

  if (!itemCount || pathname === "/cart" || pathname === "/checkout" || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="floating-cart"
        initial={{ opacity: 0, y: 24, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.94 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="no-print fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+6.6rem)] z-40 md:bottom-6 md:right-6"
      >
        <Link
          href="/cart"
          className="group inline-flex items-center gap-3 rounded-full border border-ajn-gold/30 bg-black/72 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(0,0,0,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-ajn-gold/55"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ajn-gold/14 text-ajn-gold shadow-[0_0_22px_rgba(212,175,55,0.16)]">
            <ShoppingBag className="h-4.5 w-4.5" />
          </span>
          <span>السلة</span>
          <motion.span
            key={itemCount}
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-ajn-gold px-2 py-1 text-xs font-bold text-black"
          >
            {itemCount}
          </motion.span>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
