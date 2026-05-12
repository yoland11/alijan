"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export interface PreviewLightboxImage {
  src: string;
  alt: string;
  imageStyle?: CSSProperties;
  imageClassName?: string;
}

export interface PreviewGalleryItem {
  id: string;
  src: string;
  thumbnailSrc?: string;
  alt: string;
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

interface PreviewGalleryLightboxProps {
  images: PreviewGalleryItem[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [active]);
}

export function PreviewLightbox({ image, onClose }: PreviewLightboxProps) {
  useLockBodyScroll(Boolean(image));

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

  if (!image?.src || typeof document === "undefined") {
    return null;
  }

  const usesProxyPreviewImage = image.src.startsWith("/api/media?");

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-md sm:px-6 sm:py-8"
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
        className="relative flex max-h-[88vh] w-full max-w-[92vw] items-center justify-center overflow-hidden rounded-[28px] border border-ajn-line bg-[#070707] p-3 shadow-gold sm:max-w-5xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-[78vh] max-h-[78vh] w-full max-w-[88vw] sm:h-[82vh] sm:max-h-[82vh]">
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
    </div>,
    document.body,
  );
}

export function PreviewGalleryLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
}: PreviewGalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(() => initialIndex);
  const touchStartX = useRef<number | null>(null);
  const visibleImages = images.filter((item) => item.src);
  const activeImage = visibleImages[currentIndex] ?? null;

  useLockBodyScroll(open && visibleImages.length > 0);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        setCurrentIndex((current) => (current + 1) % visibleImages.length);
      }

      if (event.key === "ArrowRight") {
        setCurrentIndex((current) => (current - 1 + visibleImages.length) % visibleImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, visibleImages.length]);

  if (!open || !activeImage || typeof document === "undefined") {
    return null;
  }

  const nextImage = () => {
    setCurrentIndex((current) => (current + 1) % visibleImages.length);
  };

  const previousImage = () => {
    setCurrentIndex((current) => (current - 1 + visibleImages.length) % visibleImages.length);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-md sm:px-6 sm:py-8"
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
        className="relative w-full max-w-6xl overflow-hidden rounded-[30px] border border-ajn-line bg-[#070707]/95 p-4 shadow-gold sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="truncate text-sm font-semibold text-ajn-goldSoft sm:text-base">{activeImage.alt}</p>
          <div className="flex items-center gap-2 text-xs text-ajn-muted">
            <span>{currentIndex + 1}</span>
            <span>/</span>
            <span>{visibleImages.length}</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          {visibleImages.length > 1 ? (
            <button
              type="button"
              onClick={previousImage}
              className="absolute right-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white transition hover:border-ajn-gold/35 hover:text-ajn-gold sm:right-4"
              aria-label="السابق"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : null}

          <div
            className="relative h-[62vh] max-h-[78vh] w-full overflow-hidden rounded-[24px] bg-black/35"
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (touchStartX.current === null) {
                return;
              }

              const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
              const delta = endX - touchStartX.current;
              touchStartX.current = null;

              if (Math.abs(delta) < 40 || visibleImages.length < 2) {
                return;
              }

              if (delta < 0) {
                nextImage();
                return;
              }

              previousImage();
            }}
          >
            <Image
              src={activeImage.src}
              alt={activeImage.alt}
              fill
              priority
              unoptimized={activeImage.src.startsWith("/api/media?")}
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {visibleImages.length > 1 ? (
            <button
              type="button"
              onClick={nextImage}
              className="absolute left-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white transition hover:border-ajn-gold/35 hover:text-ajn-gold sm:left-4"
              aria-label="التالي"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        {visibleImages.length > 1 ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {visibleImages.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "relative h-16 w-16 overflow-hidden rounded-2xl border bg-white/[0.03] transition",
                  index === currentIndex
                    ? "border-ajn-gold shadow-[0_0_18px_rgba(212,175,55,0.18)]"
                    : "border-white/10 hover:border-ajn-gold/30",
                )}
                aria-label={`عرض الصورة ${index + 1}`}
              >
                <Image
                  src={image.thumbnailSrc || image.src}
                  alt={image.alt}
                  fill
                  unoptimized={(image.thumbnailSrc || image.src).startsWith("/api/media?")}
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
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
