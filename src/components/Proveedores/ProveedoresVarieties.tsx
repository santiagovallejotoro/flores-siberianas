const grades = [
  {
    name: "Mini",
    headSize: "9–11 cm",
    varieties: ["Minigreen", "Minimojito", "Select White", "Select Blue"],
  },
  {
    name: "Select",
    headSize: "15–16 cm",
    varieties: [
      "Elite Sage green",
      "Elite Dark green",
      "Elite Purple",
      "Shocking Blue",
      "Diamond Emerald",
      "Elite Lavander",
    ],
  },
  {
    name: "Premium",
    headSize: "19–20 cm",
    varieties: ["Premium white", "Premium blue"],
  },
  {
    name: "Jumbo",
    headSize: "25 cm",
    varieties: [
      "Jumbo purple",
      "Jumbo pink",
      "Jumbo White",
      "Jumbo Blue",
      "Antique Green",
      "Antique Red",
      "Antique Emerald",
      "Antique Lemon",
    ],
  },
];

const ProveedoresVarieties = () => {
  return (
    <section className="overflow-hidden border-t border-body-color/[.15] py-8 dark:border-white/[.15] md:py-12 lg:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            Variedades que compramos
          </h2>
          <p className="text-base text-body-color dark:text-body-color-dark md:text-lg">
            Compramos estas variedades en los diferentes tamaños. El tallo debe medir 60 cm.
          </p>
        </div>

        <div className="-mx-4 flex flex-wrap">
          {grades.map((grade, index) => (
            <div key={index} className="w-full px-4 md:w-1/2 lg:w-1/4">
              <div className="mb-8 rounded-xl border border-border bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 flex items-center justify-between border-b border-border pb-3 dark:border-white/10">
                  <h3 className="text-xl font-bold text-black dark:text-white">{grade.name}</h3>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary dark:bg-primary-500/20 dark:text-primary-300">
                    {grade.headSize}
                  </span>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {grade.varieties.map((v) => (
                    <li
                      key={v}
                      className="rounded-md bg-gray-100 px-2 py-1 text-sm text-body-color dark:bg-white/10 dark:text-body-color-dark"
                    >
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProveedoresVarieties;
