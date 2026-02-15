"use client";

const WHATSAPP_NUMBER = "573127810890";

const inputClass =
  "border-stroke w-full rounded-md border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none";

const ProveedoresForm = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = (data.get("name") as string) || "";
    const phone = (data.get("phone") as string) || "";
    const location = (data.get("location") as string) || "";
    const ica = (data.get("ica") as string) || "";
    const varieties = (data.get("varieties") as string) || "";
    const volume = (data.get("volume") as string) || "";

    const lines = [
      `*Registro como proveedor - Flores Siberianas*`,
      ``,
      `Nombre: ${name}`,
      `WhatsApp / Teléfono: ${phone}`,
      `Ubicación de la Finca: ${location}`,
      `Registro ICA: ${ica}`,
      `Variedades que cultiva: ${varieties}`,
      `Volumen estimado mensual (tallos): ${volume}`,
    ];
    const text = lines.join("\n");
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="registro-proveedor" className="overflow-hidden border-t border-body-color/[.15] py-8 dark:border-white/[.15] md:py-12 lg:py-16">
      <div className="container">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
              ¿Quiere vender su hortensia?
            </h2>
            <p className="text-base text-body-color dark:text-body-color-dark md:text-lg">
              Déjenos sus datos. Lo contactamos en 48 horas para visitar su finca.
            </p>
          </div>

          <div className="rounded-xl bg-white px-6 py-8 shadow-three dark:bg-gray-dark sm:px-10 sm:py-10">
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="mb-2 block text-base font-medium text-dark dark:text-white">
                    Su nombre <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Nombre completo"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-base font-medium text-dark dark:text-white">
                    WhatsApp o teléfono <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="300 123 4567"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="mb-2 block text-base font-medium text-dark dark:text-white">
                    Dónde queda su finca <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    placeholder="Vereda y municipio"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ica" className="mb-2 block text-base font-medium text-dark dark:text-white">
                    ¿Tiene registro ICA?
                  </label>
                  <select id="ica" name="ica" className={inputClass}>
                    <option value="">Seleccione una opción</option>
                    <option value="Sí, vigente">Sí, está vigente</option>
                    <option value="En trámite">Lo estoy tramitando</option>
                    <option value="No, pero me interesa obtenerlo">No, pero quiero sacarlo</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="varieties" className="mb-2 block text-base font-medium text-dark dark:text-white">
                    Qué variedades tiene
                  </label>
                  <input
                    type="text"
                    id="varieties"
                    name="varieties"
                    placeholder="Ej. Minigreen, Select White"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="volume" className="mb-2 block text-base font-medium text-dark dark:text-white">
                    Cuántos tallos produce al mes
                  </label>
                  <input
                    type="text"
                    id="volume"
                    name="volume"
                    placeholder="Ej. 5.000 tallos"
                    className={inputClass}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviar por WhatsApp
                  </button>
                </div>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-body-color dark:text-body-color-dark">
              Sus datos son confidenciales. Solo los usamos para contactarlo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProveedoresForm;
