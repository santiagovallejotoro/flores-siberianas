"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const IMAGES_BASE = "/images/proveedores/";

/** Two images per card: main (1, 2) and secondary (1.1, 2.1) */
const qualityCards: { id: string; title: string; files: string[] }[] = [
  {
    id: "1",
    title: "Calidad esperada — estándar exportación",
    files: ["calidad-1.jpg", "calidad-1.1.jpg"],
  },
  {
    id: "2",
    title: "Calidad esperada — cabezas y tallos",
    files: ["calidad-2.jpg", "calidad-2.1.jpg"],
  },
];

const ProveedoresQualityGallery = () => {
  return (
    <section className="overflow-hidden py-8 md:py-12 lg:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            Calidad que buscamos
          </h2>
          <p className="text-base text-body-color dark:text-body-color-dark md:text-lg">
            Así debe verse su hortensia para que cumpla el estándar de exportación:
          </p>
        </div>

        <div className="-mx-4 flex flex-wrap justify-center gap-8">
          {qualityCards.map((card) => (
            <QualityCard
              key={card.id}
              title={card.title}
              imagePaths={card.files.map((f) => `${IMAGES_BASE}${f}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

function QualityCard({
  title,
  imagePaths,
}: {
  title: string;
  imagePaths: string[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(false);
  const total = imagePaths.length;
  const currentImage = total > 0 ? imagePaths[currentIndex] : null;

  const goNext = () => total > 1 && setCurrentIndex((i) => (i + 1) % total);
  const goPrev = () => total > 1 && setCurrentIndex((i) => (i - 1 + total) % total);

  useEffect(() => {
    setError(false);
  }, [currentIndex]);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
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
        aria-label={`${title} — imagen ${total > 0 ? `${currentIndex + 1} de ${total}` : "no disponible"}`}
      >
        {currentImage && !error ? (
          <Image
            key={currentImage}
            src={currentImage}
            alt={title}
            unoptimized
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setError(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-primary-50 text-center dark:bg-primary-500/10"
            aria-hidden
          >
            <span className="px-4 text-sm font-medium text-primary dark:text-primary-300">
              Añadir foto de calidad
            </span>
          </div>
        )}

        {total > 1 && !error && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-sm transition hover:bg-white dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
              aria-label="Imagen anterior"
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
              aria-label="Siguiente imagen"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {imagePaths.map((_, i) => (
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
        <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>
      </div>
    </div>
  );
}

export default ProveedoresQualityGallery;
