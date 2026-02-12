"use client";
import Image from "next/image";
import { useState } from "react";

const IMAGES_BASE = "/images/products/tinted/";

type TintedCardProps = {
  images: string[];
  title?: string;
};

const TintedCard = ({ images, title }: TintedCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = images.length;
  const currentImage = total > 0 ? images[currentIndex] : null;

  const goNext = () => total > 1 && setCurrentIndex((i) => (i + 1) % total);
  const goPrev = () => total > 1 && setCurrentIndex((i) => (i - 1 + total) % total);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
      <div
        className="group relative aspect-square w-full cursor-pointer overflow-hidden bg-gray-100 dark:bg-white/10"
        onClick={goNext}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goNext();
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            goPrev();
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            goNext();
          }
        }}
        aria-label={`Tinted hydrangeas - cycle images (${total > 0 ? `${currentIndex + 1} of ${total}` : "no images"})`}
      >
        {currentImage && (
          <Image
            key={`tinted-${currentImage}`}
            src={`${IMAGES_BASE}${currentImage}`}
            alt="Tinted hydrangeas - custom colors"
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-sm transition hover:bg-white dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
              aria-label="Previous image"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-sm transition hover:bg-white dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
              aria-label="Next image"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === currentIndex ? "bg-white" : "bg-white/50"
                  }`}
                  aria-hidden
                />
              ))}
            </div>
          </>
        )}
      </div>

      {title && (
        <div className="p-5">
          <h3 className="text-xl font-bold text-black dark:text-white">{title}</h3>
        </div>
      )}
    </div>
  );
};

export default TintedCard;
