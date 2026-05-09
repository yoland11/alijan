"use client";

import { motion } from "framer-motion";
import { Home, LayoutDashboard, Search, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useShopCart } from "@/components/shop/cart-provider";

const adminCookieName = "ajn_admin_session";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useShopCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (pathname === "/admin/login" || pathname.startsWith("/checkout")) {
    return null;
  }

  const showAdmin = mounted && document.cookie.includes(`${adminCookieName}=`);

  const links = [
    { href: "/", label: "الرئيسية", icon: Home, active: pathname === "/" },
    { href: "/services", label: "الخدمات", icon: Store, active: pathname.startsWith("/services") },
    { href: "/cart", label: "السلة", icon: ShoppingBag, active: pathname.startsWith("/cart") || pathname.startsWith("/checkout"), count: itemCount },
    { href: "/track", label: "التتبع", icon: Search, active: pathname.startsWith("/track") },
    ...(showAdmin
      ? [{ href: "/admin", label: "الإدارة", icon: LayoutDashboard, active: pathname.startsWith("/admin") }]
      : []),
  ];

  return (
    <motion.nav
      initial={{ y: 110 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="no-print fixed inset-x-3 bottom-3 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="grid gap-1 rounded-[28px] border border-white/10 bg-black/72 p-2 shadow-[0_22px_60px_rgba(0,0,0,0.36)] backdrop-blur-2xl"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
      >
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-center text-[11px] font-semibold leading-4 transition ${
                item.active
                  ? "bg-ajn-gold/[0.14] text-ajn-gold shadow-[0_0_20px_rgba(212,175,55,0.12)]"
                  : "text-white/75 hover:bg-white/[0.05]"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
              {"count" in item && item.count ? (
                <span className="absolute left-3 top-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-ajn-gold px-1.5 py-0.5 text-[10px] font-bold text-black">
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
