"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

import { HERO_SLIDES } from "@/lib/constants";
function getCardState(index: number, activeIndex: number, total: number) {
  const delta = (index - activeIndex + total) % total;

  if (delta === 0) {
    return { x: 0, z: 0, rotateY: 0, scale: 1, opacity: 1 };
  }

  if (delta === 1) {
    return { x: 120, z: -130, rotateY: -28, scale: 0.88, opacity: 0.55 };
  }

  return { x: -120, z: -130, rotateY: 28, scale: 0.88, opacity: 0.55 };
}

export function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const context = gsap.context(() => {
      cardRefs.current.forEach((card, index) => {
        if (!card) {
          return;
        }

        const state = getCardState(index, activeIndex, HERO_SLIDES.length);

        gsap.to(card, {
          x: state.x,
          z: state.z,
          rotateY: state.rotateY,
          scale: state.scale,
          opacity: state.opacity,
          duration: 0.8,
          ease: "power3.out",
        });
      });

      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current.children,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.55,
            ease: "power2.out",
          },
        );
      }
    }, rootRef);

    return () => context.revert();
  }, [activeIndex]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center" ref={rootRef}>
      <div ref={contentRef} className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-ajn-line bg-white/[0.04] px-4 py-2 text-xs text-ajn-goldSoft">
          <Sparkles className="h-4 w-4" />
          منصة فاخرة لإدارة حجوزات الأعراس والمناسبات
        </div>

        <div className="space-y-4">
          <p className="font-display text-lg uppercase tracking-[0.45em] text-ajn-goldSoft/80">
            AJN System
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            {HERO_SLIDES[activeIndex].title}
          </h1>
          <p className="text-lg leading-8 text-ajn-muted sm:text-xl">
            {HERO_SLIDES[activeIndex].description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/track"
            className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-ajn-gold px-5 py-3 text-sm font-semibold text-black transition duration-300 hover:bg-ajn-goldSoft"
          >
            ابدأ التتبع
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex min-w-[160px] items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/[0.08]"
          >
            دخول الإدارة
          </Link>
        </div>

        <div className="flex items-center gap-2 pt-2">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? "w-10 bg-ajn-gold" : "w-3 bg-white/20"
              }`}
              aria-label={slide.title}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>

      <div className="relative flex min-h-[420px] items-center justify-center [perspective:1800px]">
        <div className="absolute inset-8 rounded-full bg-ajn-gold/10 blur-3xl" />
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.title}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            className="surface-panel-strong noise-overlay absolute w-full max-w-[420px] overflow-hidden p-7 sm:p-8"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="gold-divider mb-6" />
            <p className="mb-3 font-display text-2xl text-ajn-gold">{slide.subtitle}</p>
            <h2 className="mb-4 text-2xl font-bold text-white">{slide.title}</h2>
            <p className="text-base leading-8 text-ajn-muted">{slide.description}</p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {["لوحة تحكم", "تتبع فوري", "وسائط"].map((item) => (
                <div key={item} className="rounded-2xl border border-ajn-line bg-white/[0.03] p-3">
                  <span className="text-sm text-ajn-ivory">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
