import { getISOWeekStart } from "@/lib/farm/reportes";
import type { ProduccionWeekSlot } from "@/lib/farm/reportes-chart";

/** Ventana fija (mes-día) en calendario UTC, dentro del mismo año natural (sin cruce de diciembre–enero). */
export type MercadoFestividad = {
  id: string;
  nombre: string;
  pesoPorcentual: number;
  /** Texto humano: semanas + fechas (referencia, no alineación ISO exacta). */
  notaLeyenda: string;
  /** Rango anual: mes 1-12, día, mes, día. */
  desde: { mes: number; dia: number };
  hasta: { mes: number; dia: number };
};

export const MERCADO_FESTIVIDADES: readonly MercadoFestividad[] = [
  {
    id: "san_valentin",
    nombre: "San Valentín",
    pesoPorcentual: 15,
    notaLeyenda: "Sem. 4–6 (20 ene – 10 feb)",
    desde: { mes: 1, dia: 20 },
    hasta: { mes: 2, dia: 10 },
  },
  {
    id: "dia_madre",
    nombre: "Día de la Madre",
    pesoPorcentual: 30,
    notaLeyenda: "Sem. 16–19 (14 abr – 5 may)",
    desde: { mes: 4, dia: 14 },
    hasta: { mes: 5, dia: 5 },
  },
  {
    id: "bodas_primavera_verano",
    nombre: "Bodas (primavera–verano)",
    pesoPorcentual: 25,
    notaLeyenda: "Sem. 22–34 (26 may – 25 ago)",
    desde: { mes: 5, dia: 26 },
    hasta: { mes: 8, dia: 25 },
  },
  {
    id: "accion_gracias",
    nombre: "Acción de Gracias",
    pesoPorcentual: 15,
    notaLeyenda: "Sem. 44–47 (27 oct – 17 nov)",
    desde: { mes: 10, dia: 27 },
    hasta: { mes: 11, dia: 17 },
  },
  {
    id: "navidad",
    nombre: "Navidad",
    pesoPorcentual: 15,
    notaLeyenda: "Sem. 49–52 (1 dic – 22 dic)",
    desde: { mes: 12, dia: 1 },
    hasta: { mes: 12, dia: 22 },
  },
] as const;

/** Fondo pálido por tramo (ReferenceArea). */
export const MERCADO_FESTIVIDAD_FILL: Record<string, string> = {
  san_valentin: "rgba(244, 114, 182, 0.16)",
  dia_madre: "rgba(34, 197, 94, 0.14)",
  bodas_primavera_verano: "rgba(56, 189, 248, 0.12)",
  accion_gracias: "rgba(245, 158, 11, 0.14)",
  navidad: "rgba(99, 102, 241, 0.14)",
};

/** Color sólido para bordes y chips (misma paleta que el gráfico). */
export const MERCADO_FESTIVIDAD_ACCENT: Record<string, string> = {
  san_valentin: "rgb(244, 114, 182)",
  dia_madre: "rgb(34, 197, 94)",
  bodas_primavera_verano: "rgb(56, 189, 248)",
  accion_gracias: "rgb(245, 158, 11)",
  navidad: "rgb(99, 102, 241)",
};

const MS_DAY = 86400000;

/**
 * Día (instante) dentro del rango fijo de la festividad en el año natural y del día.
 * Usa bordes medianoche/fin de día en UTC.
 */
function instanteEnVentana(
  utcNoon: number,
  f: Pick<MercadoFestividad, "desde" | "hasta">,
): boolean {
  const d = new Date(utcNoon);
  const y = d.getUTCFullYear();
  const t0 = Date.UTC(
    y,
    f.desde.mes - 1,
    f.desde.dia,
    0,
    0,
    0,
    0,
  );
  const t1 = Date.UTC(y, f.hasta.mes - 1, f.hasta.dia, 23, 59, 59, 999);
  if (t0 <= t1) {
    return utcNoon >= t0 && utcNoon <= t1;
  }
  // Si algún rango cruzara año, extender; no aplica a las 5 ventanas actuales.
  return false;
}

/** Cualquier día (UTC) de la semana ISO cae en el rango de fechas de la ventana. */
export function slotTocaVentana(
  isoYear: number,
  week: number,
  f: MercadoFestividad,
): boolean {
  const mon = getISOWeekStart(isoYear, week);
  for (let i = 0; i < 7; i += 1) {
    const t = new Date(mon.getTime() + i * MS_DAY);
    t.setUTCHours(12, 0, 0, 0);
    if (instanteEnVentana(t.getTime(), f)) return true;
  }
  return false;
}

export function intersectaRangoVisible(
  weekSlots: ProduccionWeekSlot[] | readonly ProduccionWeekSlot[],
  f: MercadoFestividad,
): boolean {
  for (const s of weekSlots) {
    if (slotTocaVentana(s.isoYear, s.week, f)) return true;
  }
  return false;
}

export type RowRef = { weekLabel: string; weekNum: number; isoYear: number };

/**
 * Tramos consecutivos en el eje X cuya semana toca la ventana. Uno o más
 * pares (x1, x2) por gaps en los datos.
 */
export function tramosReferencePara(
  data: readonly RowRef[],
  f: MercadoFestividad,
): { x1: string; x2: string; fill: string }[] {
  const segs: { x1: string; x2: string; fill: string }[] = [];
  const fill = MERCADO_FESTIVIDAD_FILL[f.id] ?? "rgba(0,0,0,0.08)";
  let i = 0;
  while (i < data.length) {
    if (!slotTocaVentana(data[i]!.isoYear, data[i]!.weekNum, f)) {
      i += 1;
      continue;
    }
    const start = i;
    let j = i;
    while (
      j + 1 < data.length &&
      slotTocaVentana(data[j + 1]!.isoYear, data[j + 1]!.weekNum, f)
    ) {
      j += 1;
    }
    segs.push({
      x1: data[start]!.weekLabel,
      x2: data[j]!.weekLabel,
      fill,
    });
    i = j + 1;
  }
  return segs;
}
