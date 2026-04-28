export type StepSlug =
  | "configuracion"
  | "clases"
  | "ubicaciones"
  | "variedades"
  | "insumos"
  | "actividades";

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
    why: "Estos números le dicen al sistema cuánto cuesta un día de trabajo y cómo convertir pesos a dólares. Los usamos para calcular costos, mano de obra y reportes en toda la finca.",
    next: "clases",
  },
  {
    slug: "clases",
    number: 2,
    label: "Clases de Cultivo",
    short: "Clases",
    why: "Las familias de flores que cultivas — por ejemplo HORTENSIA, ROSA, CLAVEL. Cada variedad pertenece a una clase, así que es lo primero que necesitamos.",
    prev: "configuracion",
    next: "ubicaciones",
  },
  {
    slug: "ubicaciones",
    number: 3,
    label: "Ubicaciones",
    short: "Ubicaciones",
    why: "Los lotes, camas o invernaderos donde siembras. Una misma ubicación puede albergar varios cultivos a lo largo del tiempo. Después podrás agregar más.",
    prev: "clases",
    next: "variedades",
  },
  {
    slug: "variedades",
    number: 4,
    label: "Variedades",
    short: "Variedades",
    why: "Cada variedad tiene su tiempo de cosecha en semanas y cuánto rinde por planta. Con esto el sistema arma los ciclos de producción y calcula la cosecha esperada.",
    prev: "ubicaciones",
    next: "insumos",
  },
  {
    slug: "insumos",
    number: 5,
    label: "Insumos (opcional)",
    short: "Insumos",
    why: "Fertilizantes, sustratos, pesticidas — lo que usas en tu finca. Sirven para llevar costos y stock. Puedes saltar este paso y volver más adelante.",
    optional: true,
    prev: "variedades",
    next: "actividades",
  },
  {
    slug: "actividades",
    number: 6,
    label: "Actividades (opcional)",
    short: "Actividades",
    why: "Riego, fertilización, poda, cosecha — el catálogo de tareas que el sistema repite por cada cultivo. Puedes saltar este paso y configurarlo después.",
    optional: true,
    prev: "insumos",
    next: "finalizar",
  },
];

export function getStep(slug: StepSlug): StepMeta {
  const step = STEPS.find((s) => s.slug === slug);
  if (!step) throw new Error(`Unknown step: ${slug}`);
  return step;
}
