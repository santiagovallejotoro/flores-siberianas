import type { SupabaseClient } from "@supabase/supabase-js";
import { listCostos, type TipoCosto } from "@/lib/farm/costos";
import { listCultivos } from "@/lib/farm/cultivos";
import { listInsumos } from "@/lib/farm/insumos";
import { listProducciones } from "@/lib/farm/produccion";
import {
  fetchReportCiclos,
  listIsoWeekSlotsInDateRange,
  type CicloReportRow,
} from "@/lib/farm/reportes";

export type DashboardKpis = {
  cultivosActivos: number;
  costosPeriodo: number;
  ingresosPeriodo: number;
  actividadesPlanificadas: number;
  unidadesCosechadas: number;
  insumosBajoMinimo: number;
};

export const COST_STACK_KEYS = [
  "INSUMO",
  "MANO_OBRA",
  "ARRENDAMIENTO",
  "SERVICIO",
  "OTRO",
  "GENERAL",
] as const;

export type CostStackKey = (typeof COST_STACK_KEYS)[number];

/** One month in the financial (calendar year) chart */
export type FinancialMonthRow = {
  monthIndex: number;
  label: string;
  INSUMO: number;
  MANO_OBRA: number;
  ARRENDAMIENTO: number;
  SERVICIO: number;
  OTRO: number;
  GENERAL: number;
  ingresos: number;
  neto: number;
};

export type ProduccionMonthRow = {
  monthKey: string;
  label: string;
  unidades: number;
};

export type InventarioRiskRow = {
  nombre: string;
  unidad_medida: string | null;
  stock_actual: number;
  stock_minimo: number;
  deficit: number;
};

export type DashboardPayload = {
  kpis: DashboardKpis;
  financialMonthly: FinancialMonthRow[];
  produccionMonthly: ProduccionMonthRow[];
  inventarioRisk: InventarioRiskRow[];
  financialYear: number;
  ciclosProgramados: CicloReportRow[];
  /** Eje del gráfico de producción programada = semanas que cruzan [from, to]. */
  ciclosChartWeeks: { isoYear: number; week: number }[];
  /** Rango de fechas con el que se armó el payload (normalizado: puede intercambiar Desde/Hasta). */
  filterFrom: string;
  filterTo: string;
};

function emptyFinancialRow(monthIndex: number, label: string): FinancialMonthRow {
  return {
    monthIndex,
    label,
    INSUMO: 0,
    MANO_OBRA: 0,
    ARRENDAMIENTO: 0,
    SERVICIO: 0,
    OTRO: 0,
    GENERAL: 0,
    ingresos: 0,
    neto: 0,
  };
}

function monthLabelEs(year: number, month0: number): string {
  const d = new Date(year, month0, 1);
  return d.toLocaleDateString("es-CO", { month: "short", year: "numeric" });
}

/** `month1_12` en `year` se solapa con [rangeStart, rangeEnd] (YYYY-MM-DD) por orden lexicográfico. */
function monthOverlapsDateRange(
  year: number,
  month1: number,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const p = (n: number) => String(n).padStart(2, "0");
  const a = `${year}-${p(month1)}-01`;
  const lastD = new Date(year, month1, 0).getDate();
  const b = `${year}-${p(month1)}-${p(lastD)}`;
  return a <= rangeEnd && b >= rangeStart;
}

function ymFromFecha(fecha: string | null): string | null {
  if (!fecha || fecha.length < 7) return null;
  return fecha.slice(0, 7);
}

function ingresoRow(p: {
  cantidad_cosechada: number | null;
  precio_venta: number | null;
}): number {
  if (p.precio_venta == null || Number.isNaN(p.precio_venta)) return 0;
  const q = p.cantidad_cosechada ?? 0;
  if (Number.isNaN(q)) return 0;
  return q * p.precio_venta;
}

export async function countActividadesPlanificadas(
  client: SupabaseClient,
  fechaInicio: string,
  fechaFin: string,
): Promise<number> {
  const { data, error } = await client
    .from("actividades_cultivo")
    .select("id, cultivos(estado)")
    .gte("fecha_planeada", fechaInicio)
    .lte("fecha_planeada", fechaFin);
  if (error) throw error;
  let n = 0;
  for (const row of data ?? []) {
    const c = (row as { cultivos?: { estado?: string | null } | null }).cultivos;
    const est = c?.estado ?? null;
    if (est === "Activo" || est === "Planificado") n += 1;
  }
  return n;
}

function addCostoToMonthRow(row: FinancialMonthRow, tipo: TipoCosto, total: number): void {
  if (tipo === "INSUMO") row.INSUMO += total;
  else if (tipo === "MANO_OBRA") row.MANO_OBRA += total;
  else if (tipo === "ARRENDAMIENTO") row.ARRENDAMIENTO += total;
  else if (tipo === "SERVICIO") row.SERVICIO += total;
  else if (tipo === "OTRO") row.OTRO += total;
  else if (tipo === "GENERAL") row.GENERAL += total;
  else row.OTRO += total;
}

export async function buildDashboardPayload(
  client: SupabaseClient,
  input: { from: string; to: string; financialYear: number },
): Promise<DashboardPayload> {
  const { financialYear } = input;
  const dStart = input.from <= input.to ? input.from : input.to;
  const dEnd = input.from <= input.to ? input.to : input.from;
  const yStart = `${financialYear}-01-01`;
  const yEnd = `${financialYear}-12-31`;
  const finRangeStart = dStart < yStart ? yStart : dStart;
  const finRangeEnd = dEnd > yEnd ? yEnd : dEnd;
  const hasFinRange = finRangeStart <= finRangeEnd;

  const ciclosChartWeeks = listIsoWeekSlotsInDateRange(dStart, dEnd);

  const [
    cultivos,
    costosKpi,
    produccionKpi,
    insumos,
    actividadesPlanificadas,
    ciclosProgramados,
    costosInFin,
    produccionInFin,
  ] = await Promise.all([
    listCultivos(client),
    listCostos(client, dStart, dEnd),
    listProducciones(client, dStart, dEnd),
    listInsumos(client),
    countActividadesPlanificadas(client, dStart, dEnd),
    fetchReportCiclos(client, {
      year: financialYear,
      weekStart: 1,
      weekEnd: 53,
      ubicaciones: ["ALL"],
      variedades: ["ALL"],
      fechaDesde: dStart,
      fechaHasta: dEnd,
    }),
    hasFinRange
      ? listCostos(client, finRangeStart, finRangeEnd)
      : Promise.resolve(
          [] as Awaited<ReturnType<typeof listCostos>>,
        ),
    hasFinRange
      ? listProducciones(client, finRangeStart, finRangeEnd)
      : Promise.resolve(
          [] as Awaited<ReturnType<typeof listProducciones>>,
        ),
  ]);

  const cultivosActivos = cultivos.filter((c) => c.estado === "Activo").length;

  const costosPeriodo = costosKpi.reduce((s, c) => {
    if (!c.fecha) return s;
    return s + (c.costo_total ?? 0);
  }, 0);

  const ingresosPeriodo = produccionKpi.reduce((s, p) => s + ingresoRow(p), 0);

  const unidadesCosechadas = produccionKpi.reduce(
    (s, p) => s + (p.cantidad_cosechada ?? 0),
    0,
  );

  const insumosBajoMinimo = insumos.filter(
    (i) => i.stock_minimo != null && i.stock_actual < i.stock_minimo,
  ).length;

  const kpis: DashboardKpis = {
    cultivosActivos,
    costosPeriodo,
    ingresosPeriodo,
    actividadesPlanificadas,
    unidadesCosechadas,
    insumosBajoMinimo,
  };

  const financialByMonth = new Map<number, FinancialMonthRow>();
  for (let m = 0; m < 12; m++) {
    financialByMonth.set(m + 1, emptyFinancialRow(m + 1, monthLabelEs(financialYear, m)));
  }

  for (const c of costosInFin) {
    const f = c.fecha;
    if (!f) continue;
    const month = parseInt(f.slice(5, 7), 10);
    if (month < 1 || month > 12) continue;
    const row = financialByMonth.get(month)!;
    addCostoToMonthRow(row, c.tipo_costo, c.costo_total ?? 0);
  }

  for (const p of produccionInFin) {
    const key = ymFromFecha(p.fecha);
    if (!key || !key.startsWith(String(financialYear))) continue;
    const month = parseInt(key.slice(5, 7), 10);
    if (month < 1 || month > 12) continue;
    const row = financialByMonth.get(month)!;
    row.ingresos += ingresoRow(p);
  }

  const financialMonthly: FinancialMonthRow[] = [];
  for (let m = 1; m <= 12; m++) {
    const row = financialByMonth.get(m)!;
    const costosMes = COST_STACK_KEYS.reduce((s, k) => s + row[k], 0);
    row.neto = row.ingresos - costosMes;
    financialMonthly.push(row);
  }

  const financialInFilterRange = financialMonthly.filter((row) =>
    monthOverlapsDateRange(financialYear, row.monthIndex, dStart, dEnd),
  );

  const prodMap = new Map<string, number>();
  for (const p of produccionKpi) {
    const key = ymFromFecha(p.fecha);
    if (!key) continue;
    prodMap.set(key, (prodMap.get(key) ?? 0) + (p.cantidad_cosechada ?? 0));
  }
  const sortedKeys = [...prodMap.keys()].sort();
  const produccionMonthly: ProduccionMonthRow[] = sortedKeys.map((monthKey) => {
    const [yy, mm] = monthKey.split("-").map(Number);
    const label = monthLabelEs(yy, mm - 1);
    return { monthKey, label, unidades: prodMap.get(monthKey) ?? 0 };
  });

  const inventarioRisk: InventarioRiskRow[] = insumos
    .filter((i) => i.stock_minimo != null)
    .map((i) => {
      const deficit = i.stock_actual - (i.stock_minimo ?? 0);
      return {
        nombre: i.nombre,
        unidad_medida: i.unidad_medida,
        stock_actual: i.stock_actual,
        stock_minimo: i.stock_minimo ?? 0,
        deficit,
      };
    })
    .filter((r) => r.deficit < 0)
    .sort((a, b) => a.deficit - b.deficit)
    .slice(0, 8);

  return {
    kpis,
    financialMonthly: financialInFilterRange,
    produccionMonthly,
    inventarioRisk,
    financialYear,
    ciclosProgramados,
    ciclosChartWeeks,
    filterFrom: dStart,
    filterTo: dEnd,
  };
}
