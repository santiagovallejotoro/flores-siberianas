import SectionTitle from "../Common/SectionTitle";

const MarketsSection = () => {
  const markets = [
    {
      region: "Russia & CIS",
      icon: "🇷🇺",
      description:
        "We specialize in large-head, high-durability varieties preferred by the Russian market. Our Siberiana grade is engineered to maintain turgidity and structure during extended transit times.",
    },
    {
      region: "Asia & Europe",
      icon: "🌏",
      description:
        "Precision and consistency define these markets. We meet strict phytosanitary, aesthetic, and uniformity standards, with special attention to color stability and petal symmetry.",
    },
  ];

  return (
    <section id="markets" className="py-16 md:py-20 lg:py-28">
      <div className="container">
        <SectionTitle
          title="A Seamless Bridge to Every Continent"
          paragraph="Flores Siberianas exports to over 30 countries, with a primary focus on Europe, Asia, and Russia."
          center
        />

        <div className="-mx-4 flex flex-wrap justify-center">
          {markets.map((market, index) => (
            <div key={index} className="w-full px-4 md:w-1/2 lg:w-1/2">
              <div className="mb-8 rounded-lg bg-white p-8 shadow-one dark:bg-dark">
                <div className="mb-4 flex items-center">
                  <span className="mr-4 text-4xl">{market.icon}</span>
                  <h3 className="text-xl font-bold text-black dark:text-white sm:text-2xl">
                    {market.region}
                  </h3>
                </div>
                <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark">
                  {market.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex flex-wrap justify-center gap-4">
            <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              Phytosanitary Compliance
            </span>
            <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              Cold-Chain Integrity
            </span>
            <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              Reliable Delivery
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketsSection;
