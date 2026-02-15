const points = [
  "Fertilizantes, insumos, abonos y herramientas a mejor precio",
  "Convenios en El Carmen de Viboral y Rionegro",
];

const ProveedoresInputAlliances = () => {
  return (
    <section className="overflow-hidden border-t border-body-color/[.15] py-8 dark:border-white/[.15] md:py-12 lg:py-16">
      <div className="container">
        <div className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-secondary-50 p-6 dark:border-primary-500/20 dark:from-primary-500/10 dark:to-secondary-500/10 md:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
              Insumos más baratos
            </h2>
            <p className="mb-6 text-base text-body-color dark:text-body-color-dark md:text-lg">
              Tenemos convenios con almacenes agropecuarios para que usted compre fertilizantes, insumos, abonos y herramientas a mejor precio:
            </p>
            <ul className="mx-auto flex max-w-xl flex-col gap-3 text-left">
              {points.map((text, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 text-base text-body-color dark:text-body-color-dark"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white dark:bg-primary-600">
                    ✓
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProveedoresInputAlliances;
