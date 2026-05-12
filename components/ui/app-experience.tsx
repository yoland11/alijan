"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AnimatedBackground } from "@/components/ui/animated-background";
import { FloatingCartPill } from "@/components/ui/floating-cart-pill";
import { CustomerNotificationBridge } from "@/components/ui/customer-notification-bridge";
import { FloatingWhatsAppButton } from "@/components/ui/floating-whatsapp-button";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { PageTransitionShell } from "@/components/ui/page-transition-shell";
import { ScrollProgressBar } from "@/components/ui/scroll-progress-bar";

export function AppExperience({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideSiteCredit =
    pathname.startsWith("/admin/invoices/") ||
    pathname.startsWith("/shop-invoice/") ||
    pathname.startsWith("/shop-receipt/");

  return (
    <>
      <AnimatedBackground />
      <ScrollProgressBar />
      <CustomerNotificationBridge />
      <div className="relative z-10">
        <PageTransitionShell>{children}</PageTransitionShell>
        {!hideSiteCredit ? (
          <footer className="no-print px-4 pb-24 pt-4 text-center md:pb-8">
            <p className="mx-auto inline-flex max-w-max items-center rounded-full border border-ajn-gold/15 bg-black/25 px-4 py-2 text-[11px] font-medium tracking-[0.08em] text-ajn-gold/80 backdrop-blur-md sm:text-xs">
              © ENG:Hussen Ali Hameed
            </p>
          </footer>
        ) : null}
      </div>
      <FloatingCartPill />
      <FloatingWhatsAppButton />
      <MobileBottomNav />
    </>
  );
}
