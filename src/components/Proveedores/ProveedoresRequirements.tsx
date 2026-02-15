const municipalities = [
  "Carmen de Viboral",
  "La Ceja",
  "Rionegro",
  "La Unión",
  "Abejorral",
  "Marinilla",
];

const requirements = [
  {
    title: "Buena calidad y consistencia",
    description: "Tallos derechos, cabezas del tamaño que se pide y con buen follaje. No leñosos. Sin maltrato.",
  },
  {
    title: "Sanidad",
    description:
      "Cultivos limpios de plagas y enfermedades.",
  },
  {
    title: "Ganas de mejorar",
    description: "Queremos productores que quieran crecer y mejorar junto con nosotros.",
  },
];

const ProveedoresRequirements = () => {
  return (
    <section className="overflow-hidden py-8 md:py-12 lg:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            ¿Qué necesita para vender?
          </h2>
          <p className="mb-6 text-base text-body-color dark:text-body-color-dark md:text-lg">
            Trabajamos con productores del Oriente Antioqueño:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {municipalities.map((muni) => (
              <span
                key={muni}
                className="rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300"
              >
                {muni}
              </span>
            ))}
          </div>
        </div>

        <div className="-mx-4 flex flex-wrap justify-center">
          {requirements.map((item, index) => (
            <div key={index} className="w-full px-4 md:w-1/3">
              <div className="mb-8 rounded-xl border border-border bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
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

export default ProveedoresRequirements;
