"use client";
import Image from "next/image";
import { useState } from "react";

const IMAGES_BASE = "/images/products/grades/";

type Grade = {
  key: string;
  name: string;
  headSize: string;
  stemLength: string;
  bestFor: string;
  badge: string | null;
};

type GradeCardProps = {
  grade: Grade;
  images: string[];
  bestForLabel?: string;
};

const GradeCard = ({ grade, images, bestForLabel = "Best for: " }: GradeCardProps) => {
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
        aria-label={`${grade.name} - cycle images (${total > 0 ? `${currentIndex + 1} of ${total}` : "no images"})`}
      >
        {currentImage && (
        <Image
          key={`${grade.key}-${currentImage}`}
          src={`${IMAGES_BASE}${currentImage}`}
          alt={`${grade.name} Colombian hydrangea - ${grade.headSize} head, ${grade.stemLength} stem`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        )}

        {grade.badge && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm dark:bg-primary-600">
            {grade.badge}
          </span>
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

      <div className="p-5">
        <h3 className="mb-2 text-xl font-bold text-black dark:text-white">{grade.name}</h3>
        <p className="mb-4 text-sm text-body-color dark:text-body-color-dark">{bestForLabel} {grade.bestFor}</p>
        <div className="mb-4 border-t border-border dark:border-white/10" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
              </svg>
            </span>
            <span className="text-sm text-body-color dark:text-body-color-dark">Head:</span>
            <span className="font-semibold text-primary">{grade.headSize}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M6 8v8M18 8v8" />
              </svg>
            </span>
            <span className="text-sm text-body-color dark:text-body-color-dark">Stem:</span>
            <span className="font-semibold text-secondary">{grade.stemLength}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeCard;
