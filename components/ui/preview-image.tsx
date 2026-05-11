"use client";
/* eslint-disable @next/next/no-img-element */

import { Expand, X } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PreviewImageProps {
  src?: string | null;
  alt: string;
  containerClassName?: string;
  imageClassName?: string;
  previewImageClassName?: string;
  imageStyle?: CSSProperties;
  previewImageStyle?: CSSProperties;
  fallback?: ReactNode;
  overlayLabel?: string;
  interactive?: boolean;
}

export function PreviewImage({
  src,
  alt,
  containerClassName,
  imageClassName,
  previewImageClassName,
  imageStyle,
  previewImageStyle,
  fallback,
  overlayLabel = "عرض الصورة",
  interactive = true,
}: PreviewImageProps) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-2xl bg-white/[0.04]",
          containerClassName,
        )}
      >
        {fallback}
      </div>
    );
  }

  return (
    <>
      {interactive ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "group relative block overflow-hidden rounded-2xl bg-white/[0.04] text-right transition hover:border-ajn-gold/35",
            containerClassName,
          )}
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            style={imageStyle}
            className={cn("h-full w-full object-contain", imageClassName)}
          />
          <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] font-semibold text-white opacity-0 transition duration-300 group-hover:opacity-100">
            <Expand className="h-3 w-3 text-ajn-gold" />
            {overlayLabel}
          </span>
        </button>
      ) : (
        <div
          className={cn(
            "relative block overflow-hidden rounded-2xl bg-white/[0.04]",
            containerClassName,
          )}
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            style={imageStyle}
            className={cn("h-full w-full object-contain", imageClassName)}
          />
        </div>
      )}

      {interactive && open ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 px-4 py-8 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white transition hover:bg-white/15"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-ajn-line bg-[#070707] p-4 shadow-gold sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              decoding="async"
              style={previewImageStyle ?? imageStyle}
              className={cn(
                "mx-auto max-h-[82vh] w-auto max-w-full object-contain",
                previewImageClassName,
              )}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
