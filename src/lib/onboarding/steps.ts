export type StepSlug =
  | "configuracion"
  | "clases"
  | "ubicaciones"
  | "variedades"
  | "insumos"
  | "actividades"
  | "ciclos";

export type StepMeta = {
  slug: StepSlug;
  number: number;
  /** Full title shown in step header. */
  label: string;
  /** Compact label for the progress bar. */
  short: string;
  /** Plain-language explanation shown above the editor. */
  why: string;
  optional?: boolean;
  prev?: StepSlug;
  /** "finalizar" sends the user to /farm/cultivos. */
  next?: StepSlug | "finalizar";
};

export const STEPS: StepMeta[] = [
  {
    slug: "configuracion",
    number: 1,
    label: "Configuración económica",
    short: "Configuración",
    why: "Define el costo del jornal y la tasa de cambio. Con esto el sistema calcula tus costos de mano de obra, insumos y reportes en pesos y dólares.",
    next: "clases",
  },
  {
    slug: "clases",
    number: 2,
    label: "Clases de cultivo",
    short: "Clases",
    why: "Las familias de flores que cultivas (Hortensia, Rosa, Clavel). Agrupar tus variedades en clases te permite definir actividades comunes una sola vez por clase, en lugar de repetirlas variedad por variedad.",
    prev: "configuracion",
    next: "ubicaciones",
  },
  {
    slug: "ubicaciones",
    number: 3,
    label: "Ubicaciones",
    short: "Ubicaciones",
    why: "Tus fincas o lotes de producción. Cada ubicación puede tener varias clases y variedades. Sirve para separar costos, cosechas y rendimientos por predio.",
    prev: "clases",
    next: "variedades",
  },
  {
    slug: "variedades",
    number: 4,
    label: "Variedades",
    short: "Variedades",
    why: "El ciclo y rendimiento por planta de cada variedad. Es la base para planear tu cosecha (cuánta y cuándo), tus insumos y tu mano de obra.",
    prev: "ubicaciones",
    next: "insumos",
  },
  {
    slug: "insumos",
    number: 5,
    label: "Insumos (opcional)",
    short: "Insumos",
    why: "Fertilizantes, sustratos y pesticidas con su costo unitario. Definirlos aquí te permite proyectar gastos y controlar inventario. Puedes saltar este paso y completarlo después.",
    optional: true,
    prev: "variedades",
    next: "actividades",
  },
  {
    slug: "actividades",
    number: 6,
    label: "Actividades (opcional)",
    short: "Actividades",
    why: "Las tareas del campo (siembra, poda, abonada, corte semana 1, corte semana 2). Las defines una vez, a nivel de clase o variedad, y al programarlas el sistema calcula las fechas. Si añades tiempo por planta e insumos, también proyecta tu personal y consumo según las plantas programadas.",
    optional: true,
    prev: "insumos",
    next: "ciclos",
  },
  {
    slug: "ciclos",
    number: 7,
    label: "Ciclos de producción",
    short: "Ciclos",
    why: "Plantillas semanales de corte por variedad. Genera los ciclos con un clic y ajusta los porcentajes si tu campo se comporta distinto. Es la base para que el sistema proyecte tu cosecha semana a semana.",
    prev: "actividades",
    next: "finalizar",
  },
];

export function getStep(slug: StepSlug): StepMeta {
  const step = STEPS.find((s) => s.slug === slug);
  if (!step) throw new Error(`Unknown step: ${slug}`);
  return step;
}
