import type { CicloReportRow } from "@/lib/farm/reportes";
import { formatWeekRange } from "@/lib/farm/reportes";

/** Máximo de series apiladas; el resto se agrupa en "Otros". */
const MAX_NAMED_SERIES = 7;
const OTHERS_LABEL = "Otros";

export type ProduccionGroupBy = "variedad" | "cultivo";

export type ProduccionWeekSlot = { isoYear: number; week: number };

export type ProduccionChartSeries = {
  dataKey: string;
  name: string;
};

export type ProduccionChartBuild = {
  data: Record<string, string | number>[];
  series: ProduccionChartSeries[];
};

function slotKey(isoYear: number, week: number): string {
  return `${isoYear}|${week}`;
}

function groupKey(r: CicloReportRow, groupBy: ProduccionGroupBy): string {
  return groupBy === "variedad" ? (r.variedad || "—") : (r.ubicacionCultivo || "—");
}

/**
 * Pivotea ciclos a datos Recharts: barras apiladas por semana, cantidad planeada
 * acumulada por variedad o por cultivo. `weekSlots` define el eje X (orden y rango).
 */
export function buildCiclosProduccionChartData(
  rows: CicloReportRow[],
  groupBy: ProduccionGroupBy,
  weekSlots: ProduccionWeekSlot[],
): ProduccionChartBuild {
  if (weekSlots.length === 0) {
    return { data: [], series: [] };
  }

  const slotSet = new Set(weekSlots.map((s) => slotKey(s.isoYear, s.week)));
  const inRange = rows.filter((r) => slotSet.has(slotKey(r.isoYear, r.weekNum)));

  const totalByGroup = new Map<string, number>();
  const bySlot = new Map<string, Map<string, number>>();

  for (const r of inRange) {
    const g = groupKey(r, groupBy);
    const q = r.cantidadPlaneada;
    totalByGroup.set(g, (totalByGroup.get(g) ?? 0) + q);
    const sk = slotKey(r.isoYear, r.weekNum);
    if (!bySlot.has(sk)) bySlot.set(sk, new Map());
    const wk = bySlot.get(sk)!;
    wk.set(g, (wk.get(g) ?? 0) + q);
  }

  const ordered = [...totalByGroup.entries()].sort((a, b) => b[1] - a[1]);
  const hasOthers = ordered.length > MAX_NAMED_SERIES;
  const named: string[] = hasOthers
    ? ordered.slice(0, MAX_NAMED_SERIES).map(([k]) => k)
    : ordered.map(([k]) => k);
  const othersSet = hasOthers
    ? new Set(ordered.slice(MAX_NAMED_SERIES).map(([k]) => k))
    : new Set<string>();

  const series: ProduccionChartSeries[] = named.map((name, i) => {
    const dataKey = `v${i}`;
    const short = name.length > 36 ? `${name.slice(0, 33).trim()}…` : name;
    return { dataKey, name: short };
  });
  if (hasOthers) {
    series.push({ dataKey: "vOthers", name: OTHERS_LABEL });
  }

  const multiYear = new Set(weekSlots.map((s) => s.isoYear)).size > 1;
  const data: Record<string, string | number>[] = [];
  let acumulado = 0;

  for (const slot of weekSlots) {
    const sk = slotKey(slot.isoYear, slot.week);
    const wk = bySlot.get(sk) ?? new Map();
    const row: Record<string, string | number> = {
      weekNum: slot.week,
      isoYear: slot.isoYear,
      weekLabel: multiYear
        ? `S${slot.week}·${String(slot.isoYear).slice(2)}`
        : `S${slot.week}`,
      dateRange: formatWeekRange(slot.isoYear, slot.week),
    };

    for (let i = 0; i < named.length; i++) {
      row[`v${i}`] = wk.get(named[i]!) ?? 0;
    }
    if (hasOthers) {
      let o = 0;
      for (const [g, q] of wk) {
        if (othersSet.has(g)) o += q;
      }
      row.vOthers = o;
    }

    let totalSemana = 0;
    for (const s of series) {
      totalSemana += Number(row[s.dataKey] ?? 0);
    }
    row.totalSemana = totalSemana;
    acumulado += totalSemana;
    row.acumulado = acumulado;
    data.push(row);
  }

  return { data, series };
}

export const PRODUCCION_CHART_COLORS: string[] = [
  "hsl(170, 55%, 42%)",
  "hsl(270, 40%, 52%)",
  "hsl(32, 80%, 48%)",
  "hsl(200, 55%, 48%)",
  "hsl(0, 50%, 48%)",
  "hsl(48, 75%, 45%)",
  "hsl(300, 40%, 50%)",
  "hsl(85, 35%, 45%)",
];
