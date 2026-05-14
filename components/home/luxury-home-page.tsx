"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  Camera,
  FileText,
  Gift,
  GraduationCap,
  Images,
  MapPin,
  MessageCircle,
  Package2,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { PortfolioEntryRecord, ShopCatalogPayload, ShopCategoryNode } from "@/lib/shop-types";
import { BOOKING_SERVICES } from "@/lib/booking-services";
import { buildProductImageProxyUrl } from "@/lib/shop-utils";
import { cn } from "@/lib/utils";

const contactLinks = [
  {
    label: "واتساب",
    href: "https://wa.me/9647725762520",
    icon: MessageCircle,
  },
  {
    label: "انستكرام",
    href: "https://www.instagram.com/koshat_alijan?igsh=dHMwajFyN2RsNjVs",
    icon: InstagramIcon,
  },
  {
    label: "فيسبوك",
    href: "https://www.facebook.com/share/16vQwtxQPW/?mibextid=wwXIfr",
    icon: FacebookIcon,
  },
  {
    label: "الموقع",
    href: "https://maps.app.goo.gl/fQAHibh6uYp6HwTx9",
    icon: MapPin,
  },
] as const;

const serviceCards = BOOKING_SERVICES.map((service) => ({
  title: service.shortTitle,
  href: `/book/${service.slug}`,
  serviceType: service.serviceType,
}));

const fallbackCategories = [
  {
    id: "services",
    name: "تجهيزات",
    slug: "تجهيزات",
    href: "/services?main=%D8%AA%D8%AC%D9%87%D9%8A%D8%B2%D8%A7%D8%AA",
    mediaUrl: "",
  },
  {
    id: "flowers",
    name: "ورود طبيعية",
    slug: "ورود-طبيعية",
    href: "/services?main=%D9%88%D8%B1%D9%88%D8%AF-%D8%B7%D8%A8%D9%8A%D8%B9%D9%8A%D8%A9",
    mediaUrl: "",
  },
  {
    id: "gifts",
    name: "هدايا",
    slug: "هدايا-متجر",
    href: "/services?main=%D9%87%D8%AF%D8%A7%D9%8A%D8%A7-%D9%85%D8%AA%D8%AC%D8%B1",
    mediaUrl: "",
  },
  {
    id: "cosmetics",
    name: "كوزمتك",
    slug: "كوزمتك",
    href: "/services?main=%D9%83%D9%88%D8%B2%D9%85%D8%AA%D9%83",
    mediaUrl: "",
  },
] as const;

const iconMap: Record<string, typeof Sparkles> = {
  تجهيزات: Sparkles,
  "ورود-طبيعية": Gift,
  "هدايا-متجر": ShoppingBag,
  كوزمتك: Package2,
  tracking: Search,
};

const bookingIconMap = {
  Koshat: Sparkles,
  Session: Camera,
  Album: Images,
  Research: FileText,
  Graduation: GraduationCap,
  Gifts: Gift,
} as const;

const phones = ["07729000122", "07725762520"] as const;

export function LuxuryHomePage() {
  const [catalog, setCatalog] = useState<ShopCatalogPayload | null>(null);
  const [portfolioEntries, setPortfolioEntries] = useState<PortfolioEntryRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [catalogResponse, portfolioResponse] = await Promise.all([
          fetch("/api/shop/catalog", { cache: "no-store" }),
          fetch("/api/portfolio", { cache: "no-store" }),
        ]);

        const catalogPayload = (await catalogResponse.json()) as ShopCatalogPayload;
        const portfolioPayload = (await portfolioResponse.json()) as { entries?: PortfolioEntryRecord[] };

        if (!cancelled && catalogResponse.ok) {
          setCatalog(catalogPayload);
        }

        if (!cancelled && portfolioResponse.ok) {
          setPortfolioEntries(portfolioPayload.entries ?? []);
        }
      } catch {
        // Keep homepage usable with static fallbacks.
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredCategories = useMemo(() => {
    if (!catalog?.categories?.length) {
      return fallbackCategories;
    }

    return catalog.categories.slice(0, 4).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      href: `/services?main=${encodeURIComponent(category.slug)}`,
      mediaUrl: category.thumbnail_url || category.image_url,
    }));
  }, [catalog]);

  const featuredWorks = useMemo(
    () => portfolioEntries.filter((entry) => entry.is_active !== false).slice(0, 4),
    [portfolioEntries],
  );

  const heroMedia = useMemo(() => {
    const firstWork = featuredWorks[0];
    if (firstWork) {
      return buildProductImageProxyUrl(firstWork.thumbnail_url || firstWork.media_url);
    }

    const firstCategory = featuredCategories.find((item) => item.mediaUrl);
    return firstCategory ? buildProductImageProxyUrl(firstCategory.mediaUrl) : "";
  }, [featuredCategories, featuredWorks]);

  return (
    <div className="page-shell pb-12">
      <section className="section-shell pt-4 sm:pt-6">
        <nav className="surface-panel-strong noise-overlay sticky top-4 z-30 flex items-center justify-between gap-4 rounded-[30px] px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative h-12 w-12 overflow-hidden rounded-2xl border border-ajn-gold/25 bg-white/[0.04]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/invoice-logo.png" alt="AJN" className="h-full w-full object-contain p-1.5" />
            </span>
            <div className="text-right">
              <p className="font-display text-[1.2rem] font-semibold tracking-[0.16em] text-ajn-goldSoft">AJN</p>
              <p className="text-sm font-semibold text-white">مجموعة علي جان</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <NavPill href="/">الرئيسية</NavPill>
            <NavPill href="#services">الخدمات</NavPill>
            <NavPill href="/services">المتجر</NavPill>
            <NavPill href="/our-work">أعمالنا</NavPill>
            <NavPill href="/track">تتبع الطلب</NavPill>
          </div>

          <Link
            href="/admin/login"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-ajn-gold/24 bg-ajn-gold/10 px-4 text-sm font-semibold text-ajn-goldSoft transition hover:border-ajn-gold/40 hover:bg-ajn-gold/14"
          >
            <ShieldCheck className="h-4 w-4" />
            الإدارة
          </Link>
        </nav>
      </section>

      <section className="section-shell pt-6">
        <div className="surface-panel-strong noise-overlay relative overflow-hidden rounded-[36px] border border-ajn-gold/20">
          {heroMedia ? (
            <div className="absolute inset-0">
              <Image
                src={heroMedia}
                alt="AJN Hero"
                fill
                unoptimized
                priority
                sizes="100vw"
                className="object-cover object-center opacity-40"
              />
            </div>
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.96),rgba(5,5,5,0.68),rgba(5,5,5,0.92))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_24%)]" />

          <div className="relative grid gap-8 p-5 sm:p-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end xl:px-10 xl:py-10">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-ajn-gold/18 bg-black/45 px-4 py-2 text-[11px] font-semibold tracking-[0.24em] text-ajn-goldSoft sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-ajn-gold" />
                AJN LUXURY GROUP
              </div>

              <div className="max-w-3xl space-y-4">
                <p className="text-sm font-semibold text-ajn-goldSoft sm:text-base">للمناسبات والتجهيزات</p>
                <h1 className="font-display text-5xl font-semibold leading-[0.94] text-white sm:text-6xl xl:text-[5.8rem]">
                  مجموعة
                  <span className="mt-2 block bg-gradient-to-l from-[#f7e6ae] via-[#d4af37] to-[#fff5d3] bg-clip-text text-transparent">
                    علي جان
                  </span>
                </h1>
                <p className="max-w-2xl text-sm leading-8 text-white/78 sm:text-base">
                  تنظيم مناسبات ومتجر متكامل
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <HeroLink href="/book" icon={ClipboardCheck} variant="secondary">
                  الخدمات
                </HeroLink>
                <HeroLink href="/services" icon={ShoppingBag} variant="primary">
                  المتجر
                </HeroLink>
                <HeroLink href="/track" icon={Search} variant="secondary">
                  تتبع الطلب
                </HeroLink>
                <HeroLink href="/our-work" icon={Images} variant="secondary">
                  أعمالنا
                </HeroLink>
              </div>

            </div>

            <aside className="surface-panel border-ajn-gold/14 bg-black/48 p-5">
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-ajn-gold/18 bg-ajn-gold/10 text-ajn-goldSoft">
                      <MapPin className="h-4.5 w-4.5" />
                    </span>
                    <p className="text-sm font-semibold text-ajn-goldSoft">الموقع</p>
                  </div>
                  <a
                    href="https://maps.app.goo.gl/fQAHibh6uYp6HwTx9"
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm leading-7 text-white/86 transition hover:text-white"
                  >
                    طوزخورماتو | شارع العام | مقابل دوز مول
                  </a>
                </div>

                <div className="gold-divider opacity-70" />

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-ajn-gold/18 bg-ajn-gold/10 text-ajn-goldSoft">
                      <Phone className="h-4.5 w-4.5" />
                    </span>
                    <p className="text-sm font-semibold text-ajn-goldSoft">رقم الهاتف</p>
                  </div>
                  <div className="space-y-1.5">
                    {phones.map((phone) => (
                      <a
                        key={phone}
                        href={`tel:${phone}`}
                        className="block text-lg font-semibold tracking-[0.02em] text-white transition hover:text-ajn-goldSoft"
                      >
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="gold-divider opacity-70" />

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-ajn-goldSoft">تابعنا</p>
                  <div className="flex flex-wrap gap-2.5">
                    {contactLinks.map(({ href, icon: Icon, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        title={label}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ajn-gold/18 bg-white/[0.03] text-ajn-goldSoft transition hover:-translate-y-0.5 hover:border-ajn-gold/36 hover:bg-ajn-gold/10 hover:text-white"
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="services" className="section-shell pt-10">
        <SectionHeading eyebrow="خدماتنا" title="الخدمات" actionHref="/book" actionLabel="عرض المزيد" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {serviceCards.map((item) => {
            const Icon = bookingIconMap[item.serviceType];

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group surface-panel transform-gpu overflow-hidden rounded-[24px] border border-ajn-gold/14 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 ease-out will-change-transform hover:-translate-y-0.5 hover:scale-[1.015] hover:border-ajn-gold/28 hover:shadow-[0_16px_36px_rgba(212,175,55,0.08)]"
              >
                <div className="flex min-h-[150px] flex-col justify-between p-4 sm:min-h-[158px]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-ajn-gold/18 bg-ajn-gold/8 text-ajn-goldSoft transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:rotate-[3deg] group-hover:border-ajn-gold/34 group-hover:text-ajn-gold">
                    <Icon className="h-4.5 w-4.5" />
                  </span>

                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white sm:text-[1.12rem]">{item.title}</h3>
                    <div className="flex items-center justify-between gap-2 border-t border-white/8 pt-3">
                      <span className="text-sm font-semibold text-ajn-gold transition duration-300 ease-out group-hover:text-ajn-goldSoft">
                        إنشاء طلب
                      </span>
                      <span className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-ajn-gold/20 bg-ajn-gold/10 text-ajn-gold transition-transform duration-300 ease-out group-hover:-translate-x-1">
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section-shell pt-10">
        <SectionHeading
          eyebrow="المتجر"
          title="أقسامنا المميزة"
          actionHref="/services"
          actionLabel="عرض المزيد"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredCategories.map((category, index) => {
            const Icon = iconMap[category.slug] ?? Sparkles;
            const imageUrl = category.mediaUrl ? buildProductImageProxyUrl(category.mediaUrl) : "";

            return (
              <Link
                key={category.id}
                href={category.href}
                className="group surface-panel transform-gpu overflow-hidden rounded-[26px] border border-white/8 transition-all duration-300 ease-out will-change-transform hover:-translate-y-0.5 hover:scale-[1.01] hover:border-ajn-gold/28 hover:shadow-[0_16px_36px_rgba(212,175,55,0.08)]"
              >
                <div className="relative h-48 overflow-hidden bg-black/30 sm:h-52">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      fill
                      unoptimized
                      priority={index < 2}
                      sizes="(max-width: 1024px) 100vw, 25vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ajn-gold">
                      <Icon className="h-11 w-11 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:rotate-[3deg]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.06),rgba(5,5,5,0.48),rgba(5,5,5,0.92))]" />
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                    <h3 className="text-xl font-bold text-white">{category.name}</h3>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/45 text-ajn-gold transition-transform duration-300 ease-out group-hover:-translate-x-1">
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section-shell pt-10">
        <SectionHeading eyebrow="أعمالنا" title="أعمالنا" actionHref="/our-work" actionLabel="عرض المزيد" />
        {featuredWorks.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredWorks.map((entry, index) => (
              <Link
                key={entry.id}
                href="/our-work"
                className={cn(
                  "group surface-panel overflow-hidden rounded-[30px] border border-white/8",
                  index === 0 && "md:col-span-2 xl:row-span-2",
                )}
              >
                <div className={cn("relative overflow-hidden bg-black/35", index === 0 ? "h-[31rem]" : "h-64")}>
                  <Image
                    src={buildProductImageProxyUrl(entry.thumbnail_url || entry.media_url)}
                    alt={entry.title}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.06),rgba(5,5,5,0.44),rgba(5,5,5,0.95))]" />
                  <div className="absolute inset-x-5 bottom-5">
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-ajn-goldSoft">
                      {entry.media_type === "video" ? "VIDEO" : "WORK"}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white">{entry.title}</h3>
                    <p className="mt-1 text-sm text-white/70">{entry.category}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="luxury-empty">لا توجد أعمال حالياً</div>
        )}
      </section>
    </div>
  );
}

function NavPill({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm font-semibold text-ajn-ivory/80 transition hover:bg-white/[0.06] hover:text-white"
    >
      {children}
    </Link>
  );
}

function HeroLink({
  href,
  icon: Icon,
  variant,
  children,
}: {
  href: string;
  icon: typeof Search;
  variant: "primary" | "secondary";
  children: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition duration-300",
        variant === "primary"
          ? "border border-ajn-gold/26 bg-gradient-to-l from-ajn-gold via-ajn-goldSoft to-ajn-gold text-black shadow-[0_14px_36px_rgba(212,175,55,0.16)] hover:brightness-105"
          : "border border-white/10 bg-white/[0.05] text-white hover:border-ajn-gold/35 hover:bg-white/[0.08]",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  actionHref,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.28em] text-ajn-goldSoft">{eyebrow}</p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
      </div>

      <Link
        href={actionHref}
        className="inline-flex h-11 items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-ajn-gold/35 hover:bg-white/[0.07]"
      >
        {actionLabel}
        <ArrowLeft className="h-4 w-4 text-ajn-gold" />
      </Link>
    </div>
  );
}

function InstagramIcon(props: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <path d="M14 8h2.5V4.6c-.43-.06-1.9-.18-3.46-.18-3.42 0-5.77 2.09-5.77 5.94V14H4v4h3.27v6h4.02v-6H15l.58-4h-4.29v-3.24c0-1.16.31-1.96 1.96-1.96Z" />
    </svg>
  );
}
