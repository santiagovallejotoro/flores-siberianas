const markets = [
  { name: "EE.UU.", flag: "🇺🇸" },
  { name: "Holanda", flag: "🇳🇱" },
  { name: "Alemania", flag: "🇩🇪" },
  { name: "Reino Unido", flag: "🇬🇧" },
  { name: "Canadá", flag: "🇨🇦" },
  { name: "Japón", flag: "🇯🇵" },
];

const ProveedoresMarkets = () => {
  return (
    <section className="overflow-hidden py-8 md:py-12 lg:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            Su flor viaja al mundo
          </h2>
          <p className="text-base text-body-color dark:text-body-color-dark md:text-lg">
            Cuando vende con nosotros, su trabajo llega a estos países y más.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {markets.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-6 py-4 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <span className="text-2xl" aria-hidden>
                {m.flag}
              </span>
              <span className="font-semibold text-black dark:text-white">{m.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProveedoresMarkets;
