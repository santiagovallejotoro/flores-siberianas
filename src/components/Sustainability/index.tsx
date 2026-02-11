import SectionTitle from "../Common/SectionTitle";

const SustainabilitySection = () => {
  const certifications = [
    {
      name: "BASC",
      fullName: "Business Alliance for Secure Commerce",
    },
    {
      name: "Florverde®",
      fullName: "Sustainable Flowers",
    },
  ];

  const practices = [
    "Fair labor practices supporting the local community",
    "Responsible water management and resource optimization",
    "Environmentally conscious agricultural processes",
  ];

  return (
    <section id="sustainability" className="bg-gray-light py-16 dark:bg-bg-color-dark md:py-20 lg:py-28">
      <div className="container">
        <SectionTitle
          title="Socially Responsible. Environmentally Conscious."
          paragraph="We operate with a long-term vision, balancing productivity with responsibility."
          center
        />

        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4 lg:w-1/2">
            <div className="mb-8 rounded-lg bg-white p-8 shadow-one dark:bg-dark">
              <h3 className="mb-6 text-xl font-bold text-black dark:text-white">
                Our Commitment
              </h3>
              <ul className="space-y-4">
                {practices.map((practice, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-3 mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                      ✓
                    </span>
                    <span className="text-base text-body-color dark:text-body-color-dark">
                      {practice}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="w-full px-4 lg:w-1/2">
            <div className="mb-8 rounded-lg bg-white p-8 shadow-one dark:bg-dark">
              <h3 className="mb-6 text-xl font-bold text-black dark:text-white">
                Compliance & Standards
              </h3>
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="flex items-center rounded-lg border border-body-color/10 p-4 dark:border-white/10"
                  >
                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-lg font-bold text-primary">
                        {cert.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-black dark:text-white">
                        {cert.name}
                      </h4>
                      <p className="text-sm text-body-color dark:text-body-color-dark">
                        {cert.fullName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-body-color dark:text-body-color-dark">
                These frameworks ensure secure, transparent, and sustainable international trade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SustainabilitySection;
