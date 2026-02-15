const LAT = "6.11673";
const LNG = "-75.36155";
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}&travelmode=driving`;
const WAZE_URL = `https://waze.com/ul?ll=${LAT},${LNG}&navigate=yes`;
const MAP_EMBED = `https://www.google.com/maps?q=${LAT},${LNG}&output=embed&maptype=satellite`;

const ProveedoresLocation = () => {
  return (
    <section className="overflow-hidden border-t border-body-color/[.15] py-8 dark:border-white/[.15] md:py-12 lg:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            Dónde nos encuentra
          </h2>
          <p className="text-base text-body-color dark:text-body-color-dark md:text-lg">
            Nuestra comercializadora está cerca de usted, con cadena de frío para cuidar su flor.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          {/* Map on top for mobile */}
          <div className="mb-6 overflow-hidden rounded-xl border border-border shadow-sm dark:border-white/10">
            <iframe
              title="Ubicación Flores Siberianas - Vereda Cristo Rey"
              src={MAP_EMBED}
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block w-full"
            />
          </div>

          {/* Location details below map */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 md:p-8">
            <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
              Vereda Cristo Rey
            </h3>
            <ul className="mb-6 space-y-3 text-base text-body-color dark:text-body-color-dark">
              <li className="flex items-start gap-3">
                <span className="mt-1 shrink-0 text-primary" aria-hidden>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <span>Vereda Cristo Rey, entre El Carmen y Rionegro</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 shrink-0 text-primary" aria-hidden>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span>A 10 minutos de El Carmen de Viboral y 10 minutos de Rionegro</span>
              </li>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark sm:w-auto"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Cómo llegar
              </a>
              <a
                href={WAZE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-6 py-3 text-base font-medium text-black shadow-sm duration-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:w-auto"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.54 6.63c-.23-2.55-1.94-4.63-4.5-4.63-1.6 0-2.97.87-3.72 2.13-.75-1.26-2.12-2.13-3.72-2.13C6.04 2 4.33 4.08 4.1 6.63 2.86 7.5 2 8.97 2 10.69c0 4.17 4.33 7.43 8.24 10.67.5.41 1.03.64 1.76.64s1.26-.23 1.76-.64C17.67 18.12 22 14.86 22 10.69c0-1.72-.86-3.19-2.1-4.06zM9.5 12.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </svg>
                Abrir en Waze
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProveedoresLocation;
