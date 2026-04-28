"use client";
import { usePathname } from "next/navigation";

export default function AuthBrandPanel() {
  const pathname = usePathname();
  const isProvider = pathname?.includes("proveedor");

  if (isProvider) {
    return (
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-gradient-to-br from-primary-700 to-primary-500 p-12">
        <div className="max-w-lg">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Únete a la red de proveedores más sólida
          </h2>
          <p className="mb-10 text-primary-100 text-lg leading-relaxed">
            Accede a tu portal de proveedor para gestionar disponibilidades, revisar históricos de compra y coordinar tus entregas con Flores Siberianas.
          </p>

          <div className="space-y-5">
            {[
              {
                title: "Alianzas a Largo Plazo",
                text: "Construimos relaciones de confianza garantizando flujos de compra constantes y pagos seguros.",
              },
              {
                title: "Tecnología a tu Alcance",
                text: "Para manejar tu cultivo, planificar la producción y llevar el registro de tus costos y gastos de manera fácil.",
              },
              {
                title: "Exportación Directa",
                text: "Tus hortensias llegarán a los mercados más exclusivos del mundo de la mano de expertos.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-xl bg-white/10 p-5 backdrop-blur-sm border border-white/20"
              >
                <div className="mt-0.5 flex-shrink-0 rounded-full bg-primary-400/40 p-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-sm text-primary-100">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default / Client panel
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-gradient-to-br from-primary-700 to-primary-500 p-12">
      <div className="max-w-lg">
        <h2 className="mb-4 text-3xl font-bold text-white">
          Colombian Hydrangeas for the World&apos;s Finest Markets
        </h2>
        <p className="mb-10 text-primary-100 text-lg leading-relaxed">
          Access your client portal to manage orders, track shipments, and explore our full catalog of premium hydrangeas.
        </p>

        <div className="space-y-5">
          {[
            {
              title: "12+ Years of Excellence",
              text: "Over a decade of growing and exporting the finest Colombian hydrangeas to 30+ countries.",
            },
            {
              title: "365-Day Supply",
              text: "Year-round availability from the ideal altitude and volcanic soils of Carmen de Viboral.",
            },
            {
              title: "Technology-Driven Quality",
              text: "Data-informed cultivation and post-harvest processes for consistent, reliable quality.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-xl bg-white/10 p-5 backdrop-blur-sm border border-white/20"
            >
              <div className="mt-0.5 flex-shrink-0 rounded-full bg-primary-400/40 p-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-0.5 text-sm text-primary-100">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
