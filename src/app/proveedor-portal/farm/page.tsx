import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mi Finca | Portal Proveedor",
  robots: { index: false, follow: false },
};

const FARM_SECTIONS = [
  {
    group: "Cultivos",
    items: [
      {
        title: "Cultivos",
        description: "Lista y gestión de todos tus cultivos activos y planificados.",
        href: "/proveedor-portal/farm/cultivos",
      },
    ],
  },
  {
    group: "Catálogos",
    items: [
      { title: "Clases de Cultivo", description: "HORTENSIA, ROSA, CLAVEL y más.", href: "/proveedor-portal/farm/catalogos/clases" },
      { title: "Ubicaciones", description: "Lotes, camas e invernaderos.", href: "/proveedor-portal/farm/catalogos/ubicaciones" },
      { title: "Variedades", description: "Variedades por clase y ciclo de producción.", href: "/proveedor-portal/farm/catalogos/variedades" },
      { title: "Insumos", description: "Materiales y fertilizantes disponibles.", href: "/proveedor-portal/farm/catalogos/insumos" },
      { title: "Actividades", description: "Actividades de mantenimiento y cosecha.", href: "/proveedor-portal/farm/catalogos/actividades" },
    ],
  },
  {
    group: "Análisis",
    items: [
      { title: "Reportes", description: "Producción, costos y mano de obra.", href: "/proveedor-portal/farm/reportes" },
    ],
  },
];

export default function FarmPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black dark:text-white">Mi Finca</h2>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Gestión integral de tu operación agrícola
        </p>
      </div>

      <div className="space-y-8">
        {FARM_SECTIONS.map((section) => (
          <div key={section.group}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-body-color dark:text-body-color-dark">
              {section.group}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.items.map((item) => (
                <Link key={item.href} href={item.href} className="block group">
                  <div className="rounded-xl border border-stroke bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:border-strokedark dark:bg-dark dark:hover:border-primary/30">
                    <h4 className="mb-1 font-semibold text-black transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-primary-300">
                      {item.title}
                    </h4>
                    <p className="text-sm text-body-color dark:text-body-color-dark">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
