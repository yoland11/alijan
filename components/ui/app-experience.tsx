"use client";

import type { ReactNode } from "react";

import { AnimatedBackground } from "@/components/ui/animated-background";
import { FloatingCartPill } from "@/components/ui/floating-cart-pill";
import { FloatingWhatsAppButton } from "@/components/ui/floating-whatsapp-button";
import { IntroSplash } from "@/components/ui/intro-splash";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { PageTransitionShell } from "@/components/ui/page-transition-shell";
import { ScrollProgressBar } from "@/components/ui/scroll-progress-bar";

export function AppExperience({ children }: { children: ReactNode }) {
  return (
    <>
      <IntroSplash />
      <AnimatedBackground />
      <ScrollProgressBar />
      <div className="relative z-10">
        <PageTransitionShell>{children}</PageTransitionShell>
      </div>
      <FloatingCartPill />
      <FloatingWhatsAppButton />
      <MobileBottomNav />
    </>
  );
}
