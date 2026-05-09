"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

import { cn } from "@/lib/utils";

export function AnimatedServicePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        {
          autoAlpha: 0,
          y: 12,
          scale: 0.992,
          filter: "blur(6px)",
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.36,
          ease: "power2.out",
        },
      );
    }, ref);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
