const faqs = [
  {
    q: "¿Tienen que recoger la flor en la comercializadora o ustedes van a la finca?",
    a: "Usted trae la flor a nuestra comercializadora de Lunes a Viernes, 7:00 AM - 10:00 AM. Así cuidamos la cadena de frío y revisamos la calidad en el momento.",
  },
  {
    q: "¿Necesito registro ICA para vender?",
    a: "Sí es obligatorio. Si no lo tiene, puede ponerse en contacto con nosotros para ofrecerle soporte en la comercialización de su flor y orientación para obtener el registro.",
  },
  {
    q: "¿Cuánto me pagan por tallo?",
    a: "Los precios son acordados previamente, de acuerdo a la variedad, el grado, volúmenes y cumplimiento de parámetros de calidad de la finca. Sin sorpresas.",
  },
  {
    q: "¿Qué pasa si mi flor no cumple la calidad?",
    a: "Si no cumple, le indicamos cuáles tallos no califican y se le retornan en el momento de la recepción.",
  },
];

const ProveedoresFAQ = () => {
  return (
    <section className="overflow-hidden py-8 md:py-12 lg:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            Preguntas comunes
          </h2>
        </div>

        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <h3 className="mb-3 text-lg font-bold text-black dark:text-white">{item.q}</h3>
              <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProveedoresFAQ;
