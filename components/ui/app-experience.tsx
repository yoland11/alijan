"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, MessageCircle, Phone } from "lucide-react";
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
  const isBackofficePath =
    pathname.startsWith("/admin") || pathname.startsWith("/driver");
  const showPublicFooter = !hideSiteCredit && !isBackofficePath;
  const showFloatingUi = !isBackofficePath;

  return (
    <>
      <AnimatedBackground />
      <ScrollProgressBar />
      <CustomerNotificationBridge />
      <div className="relative z-10">
        <PageTransitionShell>{children}</PageTransitionShell>
        {showPublicFooter ? (
          <footer className="no-print px-4 pb-24 pt-8 md:pb-8">
            <div className="section-shell">
              <div className="surface-panel-strong noise-overlay overflow-hidden p-6 sm:p-8">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
                  <div className="space-y-4">
                    <div>
                      <p className="font-display text-4xl font-semibold tracking-[0.16em] text-ajn-goldSoft">AJN</p>
                      <h3 className="mt-2 text-2xl font-bold text-white">مجموعة علي جان</h3>
                      <p className="mt-3 max-w-md text-sm leading-7 text-ajn-muted">
                        للمناسبات والتجهيزات
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <FooterSocial href="https://wa.me/9647725762520" label="واتساب">
                        <MessageCircle className="h-4 w-4" />
                      </FooterSocial>
                      <FooterSocial href="https://maps.app.goo.gl/fQAHibh6uYp6HwTx9" label="الموقع">
                        <MapPin className="h-4 w-4" />
                      </FooterSocial>
                      <FooterSocial href="tel:07729000122" label="اتصال">
                        <Phone className="h-4 w-4" />
                      </FooterSocial>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold tracking-[0.22em] text-ajn-goldSoft">روابط</p>
                    <div className="grid gap-3 text-sm text-white/84">
                      <FooterLink href="/">الرئيسية</FooterLink>
                      <FooterLink href="/book">الخدمات</FooterLink>
                      <FooterLink href="/services">المتجر</FooterLink>
                      <FooterLink href="/our-work">أعمالنا</FooterLink>
                      <FooterLink href="/track">تتبع الطلب</FooterLink>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold tracking-[0.22em] text-ajn-goldSoft">تواصل</p>
                    <div className="space-y-2 text-sm text-white/84">
                      <a href="tel:07729000122" className="block transition hover:text-white">
                        07729000122
                      </a>
                      <a href="tel:07725762520" className="block transition hover:text-white">
                        07725762520
                      </a>
                      <a
                        href="https://maps.app.goo.gl/fQAHibh6uYp6HwTx9"
                        target="_blank"
                        rel="noreferrer"
                        className="block leading-7 text-ajn-muted transition hover:text-white"
                      >
                        طوزخورماتو | شارع العام | مقابل دوز مول
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-7 border-t border-white/8 pt-5 text-center text-xs tracking-[0.08em] text-ajn-gold/75">
                  © ENG:Hussen Ali Hameed
                </div>
              </div>
            </div>
          </footer>
        ) : null}
      </div>
      {showFloatingUi ? <FloatingCartPill /> : null}
      {showFloatingUi ? <FloatingWhatsAppButton /> : null}
      {showFloatingUi ? <MobileBottomNav /> : null}
    </>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="transition hover:text-white">
      {children}
    </Link>
  );
}

function FooterSocial({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-ajn-gold/16 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-ajn-gold/36 hover:bg-white/[0.08]"
    >
      <span className="text-ajn-goldSoft">{children}</span>
      {label}
    </a>
  );
}
