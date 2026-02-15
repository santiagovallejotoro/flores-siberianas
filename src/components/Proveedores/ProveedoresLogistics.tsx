const logisticsItems = [
  {
    title: "Entrega de la flor",
    description:
      "Nuestros horarios de recepción son de Lunes a Viernes, 7:00 AM - 10:00 AM. Previo acuerdo y planificación de la hora y cantidades de entrega.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Revisión",
    description:
      "Revisamos la calidad en el momento que usted entrega. Si quiere conocer nuestros estándares antes, lo invitamos a visitarnos.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    title: "Pago mensual",
    description: "Le pagamos cada mes. Tasa de mercado, sin descuentos sorpresa.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

const ProveedoresLogistics = () => {
  return (
    <section className="overflow-hidden border-t border-body-color/[.15] py-8 dark:border-white/[.15] md:py-12 lg:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            Cómo funciona el proceso
          </h2>
          <p className="text-base text-body-color dark:text-body-color-dark md:text-lg">
            Tres pasos simples para que sepa qué esperar:
          </p>
        </div>

        <div className="-mx-4 flex flex-wrap">
          {logisticsItems.map((item, index) => (
            <div key={index} className="w-full px-4 md:w-1/3">
              <div className="mb-8 rounded-xl border border-border bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-black dark:text-white">{item.title}</h3>
                <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProveedoresLogistics;
