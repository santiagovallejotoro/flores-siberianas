"use client";

import { useState } from "react";

const faqs = [
  {
    q: "¿Para qué sirve el portal de proveedores?",
    a: "Proveedor: Herramienta tecnológica para ayudarle a planear y administrar su cultivo. Historial de compra, inspecciones de calidad, pagos. Pronósticos, planificación de producción por programación y métricas de rendimiento de su cultivo. Herramienta de administración y control de gastos y costos de cultivo. Portal de uso EXCLUSIVO para nuestros principales proveedores y aliados estratégicos",
  },
  {
    q: "¿Recepción de la flor y horarios?",
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="overflow-hidden py-8 md:py-12 lg:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            Preguntas comunes
          </h2>
        </div>

        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-border bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
              >
                <button
                  type="button"
                  id={`faq-trigger-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="text-lg font-bold text-black dark:text-white">
                    {item.q}
                  </span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-body-color transition-transform duration-200 dark:text-body-color-dark ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${index}`}
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-6 pb-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProveedoresFAQ;
