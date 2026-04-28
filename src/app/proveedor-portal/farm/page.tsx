import { Metadata } from "next";
import Link from "next/link";
import { createSSRSassClient } from "@/lib/supabase/server";
import { getOnboardingStatus, type OnboardingStatus } from "@/lib/farm/onboarding";

export const metadata: Metadata = {
  title: "Mi Finca | Portal Proveedor",
  robots: { index: false, follow: false },
};

type SetupKey =
  | "configuracion"
  | "clases"
  | "ubicaciones"
  | "variedades"
  | "insumos"
  | "actividades"
  | "ciclos";

type SetupRow = {
  key: SetupKey;
  number: number;
  title: string;
  description: string;
  href: string;
  optional?: boolean;
};

const SETUP_ROWS: SetupRow[] = [
  {
    key: "configuracion",
    number: 1,
    title: "Configuración económica",
    description:
      "Tasa de cambio, jornal y SMMLV — base para todos los cálculos de costos.",
    href: "/proveedor-portal/farm/catalogos/configuracion",
  },
  {
    key: "clases",
    number: 2,
    title: "Clases de cultivo",
    description: "Las familias de flores que cultivas (HORTENSIA, ROSA, CLAVEL).",
    href: "/proveedor-portal/farm/catalogos/clases",
  },
  {
    key: "ubicaciones",
    number: 3,
    title: "Ubicaciones",
    description: "Lotes, camas e invernaderos donde siembras.",
    href: "/proveedor-portal/farm/catalogos/ubicaciones",
  },
  {
    key: "variedades",
    number: 4,
    title: "Variedades",
    description: "Ciclo en semanas, rendimiento por planta y semana de inicio de corte.",
    href: "/proveedor-portal/farm/catalogos/variedades",
  },
  {
    key: "insumos",
    number: 5,
    title: "Insumos",
    description: "Fertilizantes, sustratos y materiales con su costo unitario.",
    href: "/proveedor-portal/farm/catalogos/insumos",
    optional: true,
  },
  {
    key: "actividades",
    number: 6,
    title: "Actividades",
    description: "Catálogo de tareas: riego, fertilización, poda, cosecha, empaque.",
    href: "/proveedor-portal/farm/catalogos/actividades",
    optional: true,
  },
  {
    key: "ciclos",
    number: 7,
    title: "Ciclos de producción",
    description:
      "Plantillas semanales de corte por variedad. Se generan al guardar la variedad.",
    href: "/proveedor-portal/farm/catalogos/ciclos",
  },
];

type OperationCard = {
  title: string;
  description: string;
  href: string;
};

const OPERATION_CARDS: OperationCard[] = [
  {
    title: "Cultivos",
    description: "Lotes activos, planificados y finalizados.",
    href: "/proveedor-portal/farm/cultivos",
  },
  {
    title: "Producción",
    description: "Registra cosechas, pérdidas y precios de venta.",
    href: "/proveedor-portal/farm/produccion",
  },
  {
    title: "Costos",
    description: "Mano de obra, insumos y otros gastos por cultivo.",
    href: "/proveedor-portal/farm/costos",
  },
  {
    title: "Inventario",
    description: "Stock de insumos y movimientos.",
    href: "/proveedor-portal/farm/inventario",
  },
  {
    title: "Reportes",
    description: "Análisis de producción, costos y mano de obra.",
    href: "/proveedor-portal/farm/reportes",
  },
];

type RowStatus =
  | { kind: "done"; label: string }
  | { kind: "empty"; label: string }
  | { kind: "info"; label: string };

function getRowStatus(row: SetupRow, s: OnboardingStatus): RowStatus {
  switch (row.key) {
    case "configuracion":
      return s.configuracionDone
        ? { kind: "done", label: "Listo" }
        : { kind: "empty", label: "Sin configurar" };
    case "clases":
      return s.clasesCount > 0
        ? { kind: "done", label: `${s.clasesCount} registrada${s.clasesCount === 1 ? "" : "s"}` }
        : { kind: "empty", label: "Sin configurar" };
    case "ubicaciones":
      return s.ubicacionesCount > 0
        ? { kind: "done", label: `${s.ubicacionesCount} registrada${s.ubicacionesCount === 1 ? "" : "s"}` }
        : { kind: "empty", label: "Sin configurar" };
    case "variedades":
      return s.variedadesCount > 0
        ? { kind: "done", label: `${s.variedadesCount} registrada${s.variedadesCount === 1 ? "" : "s"}` }
        : { kind: "empty", label: "Sin configurar" };
    case "insumos":
      return s.insumosCount > 0
        ? { kind: "done", label: `${s.insumosCount} registrado${s.insumosCount === 1 ? "" : "s"}` }
        : { kind: "empty", label: "Opcional" };
    case "actividades":
      return s.actividadesCount > 0
        ? { kind: "done", label: `${s.actividadesCount} registrada${s.actividadesCount === 1 ? "" : "s"}` }
        : { kind: "empty", label: "Opcional" };
    case "ciclos":
      return s.variedadesCount > 0
        ? { kind: "info", label: "Listo para revisar" }
        : { kind: "empty", label: "Necesita variedades" };
  }
}

const STATUS_BADGE_CLS: Record<RowStatus["kind"], string> = {
  done: "bg-primary-100 text-primary dark:bg-primary-500/15 dark:text-primary-300",
  empty:
    "bg-gray-100 text-body-color dark:bg-white/10 dark:text-body-color-dark",
  info: "bg-secondary-100 text-secondary-600 dark:bg-secondary-500/10 dark:text-secondary-400",
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default async function FarmPage() {
  const supabase = await createSSRSassClient();
  const status = await getOnboardingStatus(supabase.getSupabaseClient());

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">Mi Finca</h2>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Gestión integral de tu operación agrícola.
        </p>
      </div>

      {/* ── Configuración ────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary dark:text-primary-300">
            Configuración
          </h3>
          <p className="text-xs text-body-color dark:text-body-color-dark">
            Define una sola vez. Después se reutiliza en cada cultivo.
          </p>
        </div>

        <ol className="overflow-hidden rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark">
          {SETUP_ROWS.map((row, idx) => {
            const st = getRowStatus(row, status);
            const isDone = st.kind === "done";
            return (
              <li
                key={row.key}
                className={
                  idx === 0
                    ? ""
                    : "border-t border-stroke dark:border-strokedark"
                }
              >
                <Link
                  href={row.href}
                  className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 sm:px-5"
                >
                  <span
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      isDone
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-body-color dark:bg-white/10 dark:text-body-color-dark",
                    ].join(" ")}
                  >
                    {isDone ? <CheckIcon /> : row.number}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="font-semibold text-black dark:text-white">
                        {row.title}
                      </p>
                      {row.optional && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-body-color dark:bg-white/10 dark:text-body-color-dark">
                          Opcional
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-body-color dark:text-body-color-dark sm:whitespace-normal">
                      {row.description}
                    </p>
                  </div>

                  <span
                    className={[
                      "hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex",
                      STATUS_BADGE_CLS[st.kind],
                    ].join(" ")}
                  >
                    {st.label}
                  </span>

                  <span className="shrink-0 text-body-color/60 transition-colors group-hover:text-primary dark:text-body-color-dark/50 dark:group-hover:text-primary-300">
                    <ArrowRight />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── Operación ─────────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary dark:text-primary-300">
            Operación
          </h3>
          <p className="text-xs text-body-color dark:text-body-color-dark">
            Día a día de tu finca.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {OPERATION_CARDS.map((card) => {
            const blocked =
              card.title === "Cultivos" && status.variedadesCount === 0;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group block rounded-xl border border-stroke bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:border-strokedark dark:bg-dark dark:hover:border-primary/30"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-black transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-primary-300">
                    {card.title}
                  </h4>
                  {blocked && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-body-color dark:bg-white/10 dark:text-body-color-dark">
                      Necesita variedades
                    </span>
                  )}
                </div>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
