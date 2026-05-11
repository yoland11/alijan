"use client";

import { Expand, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PreviewLightboxImage {
  src: string;
  alt: string;
  imageStyle?: CSSProperties;
  imageClassName?: string;
}

interface PreviewImageProps {
  src?: string | null;
  previewSrc?: string | null;
  alt: string;
  containerClassName?: string;
  imageClassName?: string;
  previewImageClassName?: string;
  imageStyle?: CSSProperties;
  previewImageStyle?: CSSProperties;
  fallback?: ReactNode;
  overlayLabel?: string;
  interactive?: boolean;
  priority?: boolean;
  sizes?: string;
  onPreviewRequest?: (image: PreviewLightboxImage) => void;
}

interface PreviewLightboxProps {
  image: PreviewLightboxImage | null;
  onClose: () => void;
}

export function PreviewLightbox({ image, onClose }: PreviewLightboxProps) {
  useEffect(() => {
    if (!image) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [image, onClose]);

  if (!image?.src) {
    return null;
  }

  const usesProxyPreviewImage = image.src.startsWith("/api/media?");

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white transition hover:bg-white/15"
        aria-label="إغلاق"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-ajn-line bg-[#070707] p-4 shadow-gold sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-[82vh] w-full">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            unoptimized={usesProxyPreviewImage}
            sizes="100vw"
            style={image.imageStyle}
            className={cn("object-contain", image.imageClassName)}
          />
        </div>
      </div>
    </div>
  );
}

export function PreviewImage({
  src,
  previewSrc,
  alt,
  containerClassName,
  imageClassName,
  previewImageClassName,
  imageStyle,
  previewImageStyle,
  fallback,
  overlayLabel = "عرض الصورة",
  interactive = true,
  priority = false,
  sizes = "(max-width: 640px) 92vw, (max-width: 1280px) 48vw, 25vw",
  onPreviewRequest,
}: PreviewImageProps) {
  const [open, setOpen] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState("");
  const displaySrc = src?.trim() ?? "";
  const fullPreviewSrc = previewSrc?.trim() || displaySrc;
  const loaded = loadedSrc === displaySrc;
  const usesProxyImage = displaySrc.startsWith("/api/media?");
  const previewImage = {
    src: fullPreviewSrc,
    alt,
    imageStyle: previewImageStyle ?? imageStyle,
    imageClassName: previewImageClassName,
  };

  if (!displaySrc) {
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

  const renderInlineImage = () => {
    return (
      <Image
        src={displaySrc}
        alt={alt}
        fill
        priority={priority}
        unoptimized={usesProxyImage}
        sizes={sizes}
        onLoad={() => setLoadedSrc(displaySrc)}
        style={imageStyle}
        className={cn(
          "h-full w-full object-contain transition duration-300",
          loaded ? "opacity-100" : "opacity-0",
          imageClassName,
        )}
      />
    );
  };

  return (
    <>
      {interactive ? (
        <button
          type="button"
          onClick={() => {
            if (onPreviewRequest) {
              onPreviewRequest(previewImage);
              return;
            }

            setOpen(true);
          }}
          className={cn(
            "group relative block overflow-hidden rounded-2xl bg-white/[0.04] text-right transition hover:border-ajn-gold/35",
            containerClassName,
          )}
        >
          <div
            className={cn(
              "absolute inset-0 bg-white/[0.06] transition-opacity duration-300",
              loaded ? "opacity-0" : "animate-pulse opacity-100",
            )}
          />
          {renderInlineImage()}
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
          <div
            className={cn(
              "absolute inset-0 bg-white/[0.06] transition-opacity duration-300",
              loaded ? "opacity-0" : "animate-pulse opacity-100",
            )}
          />
          {renderInlineImage()}
        </div>
      )}

      {!onPreviewRequest && interactive && open && fullPreviewSrc ? (
        <PreviewLightbox image={previewImage} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
