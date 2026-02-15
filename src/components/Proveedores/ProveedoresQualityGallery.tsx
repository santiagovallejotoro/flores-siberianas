"use client";

import Image from "next/image";
import { useState } from "react";

const IMAGES_BASE = "/images/proveedores/";
const qualityCards = [
  { id: "1", title: "Calidad esperada — estándar exportación", file: "calidad-1.jpg" },
  { id: "2", title: "Calidad esperada — cabezas y tallos", file: "calidad-2.jpg" },
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
              imagePath={`${IMAGES_BASE}${card.file}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

function QualityCard({
  title,
  imagePath,
}: {
  title: string;
  imagePath: string;
}) {
  const [error, setError] = useState(false);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-white/10">
        {!error ? (
          <Image
            src={imagePath}
            alt={title}
            fill
            className="object-cover"
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
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>
      </div>
    </div>
  );
}

export default ProveedoresQualityGallery;
