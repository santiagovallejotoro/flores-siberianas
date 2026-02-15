const benefits = [
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "Pagos justos",
    paragraph:
      "Precio a tasa de mercado, sin regateos. El precio que acordamos es el que usted recibe.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Compra todo el año",
    paragraph:
      "Con nuestros aliados organizamos para planificar adecuadamente y garantizar que su producto se vende durante todo el año.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    title: "Herramientas para mejorar",
    paragraph:
      "Le prestamos herramientas de cálculo de costos para que sepa si su cultivo deja ganancia, y herramientas de programación y planeación de cultivo.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    title: "Apoyo técnico",
    paragraph:
      "Le ayudamos con manejo de plagas, poscosecha y variedades para cumplir estándares internacionales.",
  },
];

const extraBenefits = [
  "Precio justo durante todo el año",
  "Pago mensual puntual",
  "Descuentos en insumos (fertilizantes y mallas)",
  "Herramientas de costeo gratis",
  "Herramienta de programación y planificación de cultivo gratis",
  "La oportunidad de trabajar con una empresa en expansión que quiere crecer junto a sus aliados.",
  "Su flor llega a mercados internacionales",
];

const ProveedoresBenefits = () => {
  return (
    <section className="overflow-hidden py-8 md:py-12 lg:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            ¿Por qué vender con nosotros?
          </h2>
          <p className="text-base text-body-color dark:text-body-color-dark md:text-lg">
            Sabemos que los costos han subido. Por eso le ofrecemos beneficios concretos:
          </p>
        </div>

        <div className="-mx-4 mb-10 flex flex-wrap">
          {benefits.map((item, index) => (
            <div key={index} className="w-full px-4 md:w-1/2 lg:w-1/4">
              <div className="group mb-8 rounded-xl border border-border bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:shadow-primary-900/10">
                <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-all duration-300 group-hover:scale-110 group-hover:text-secondary-600 dark:bg-primary-500/15 dark:text-primary-300 dark:group-hover:bg-primary-500/25 dark:group-hover:text-secondary-400">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-black dark:text-white">
                  {item.title}
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color dark:text-body-color-dark">
                  {item.paragraph}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-secondary-50 p-6 dark:border-primary-500/20 dark:from-primary-500/10 dark:to-secondary-500/10 md:p-8">
          <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
            Lo que recibe al trabajar con nosotros
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {extraBenefits.map((text, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 text-base text-body-color dark:text-body-color-dark"
              >
                <svg
                  className="h-5 w-5 shrink-0 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ProveedoresBenefits;
