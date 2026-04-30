import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReportFilters = {
  year: number;
  weekStart: number;
  weekEnd: number;
  ubicaciones: string[]; // ['ALL'] means all
  variedades: string[]; // ['ALL'] means all
  /** Si ambas existen, filtra por rango de fechas en lugar de año + semanas ISO. */
  fechaDesde?: string;
  fechaHasta?: string;
};

export type CicloReportRow = {
  weekNum: number;
  /** Año de la semana ISO (puede no coincidir con el año del calendario de la fila cerca de enero) */
  isoYear: number;
  dateRange: string;
  ubicacionCultivo: string;
  variedad: string;
  observaciones: string | null;
  cantidadPlaneada: number;
};

export type ActividadReportRow = {
  weekNum: number;
  dateRange: string;
  ubicacionCultivo: string;
  actividad: string;
  observaciones: string | null;
  tiempoHoras: number;
};

export type InsumoReportRow = {
  weekNum: number;
  dateRange: string;
  ubicacionCultivo: string;
  insumo: string;
  observaciones: string | null;
  cantidadRequerida: number;
  unidad: string;
  costoEstimado: number;
};

// ── ISO week arithmetic ───────────────────────────────────────────────────────

/** Returns the Monday date of ISO week `week` in `year`. */
export function getISOWeekStart(year: number, week: number): Date {
  // Jan 4 is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // 1=Mon … 7=Sun
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1));
  const result = new Date(week1Monday);
  result.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return result;
}

/** Año al que pertenece el número de semana ISO (W en ISO 8601). */
export function getISOWeekYear(d: Date): number {
  const t = new Date(d.valueOf());
  t.setUTCDate(t.getUTCDate() + 3 - (t.getUTCDay() + 6) % 7);
  return t.getUTCFullYear();
}

/** Returns the ISO week number (1–53) for a given date. */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Converts year + weekStart + weekEnd to ISO date strings for DB range filter. */
export function weekRangeToDateRange(
  year: number,
  weekStart: number,
  weekEnd: number,
): { start: string; end: string } {
  const start = getISOWeekStart(year, weekStart);
  const endMonday = getISOWeekStart(year, weekEnd);
  const end = new Date(endMonday);
  end.setUTCDate(endMonday.getUTCDate() + 6); // Sunday of weekEnd
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

/** Returns a short human-readable label for an ISO week, e.g. "12 ene – 18 ene". */
export function formatWeekRange(year: number, week: number): string {
  const mon = getISOWeekStart(year, week);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

/** Cada (año ISO, nº semana) que toca al menos un día de [desde, hasta] (inclusive, fechas YYYY-MM-DD). */
export function listIsoWeekSlotsInDateRange(
  fechaDesde: string,
  fechaHasta: string,
): { isoYear: number; week: number }[] {
  if (!fechaDesde || !fechaHasta || fechaDesde > fechaHasta) return [];
  const seen = new Set<string>();
  const out: { isoYear: number; week: number }[] = [];
  const d0 = new Date(fechaDesde + "T12:00:00.000Z");
  const d1 = new Date(fechaHasta + "T12:00:00.000Z");
  for (let t = d0.getTime(); t <= d1.getTime(); t += 86400000) {
    const d = new Date(t);
    const w = getISOWeek(d);
    const iy = getISOWeekYear(d);
    const k = `${iy}|${w}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ isoYear: iy, week: w });
  }
  out.sort((a, b) => a.isoYear - b.isoYear || a.week - b.week);
  return out;
}

// ── Month → approximate week range (from FarmPanel) ──────────────────────────

export const MONTH_WEEK_RANGES: Record<number, [number, number]> = {
  1: [1, 4], 2: [5, 8], 3: [9, 13], 4: [14, 17],
  5: [18, 22], 6: [23, 26], 7: [27, 30], 8: [31, 35],
  9: [36, 39], 10: [40, 44], 11: [45, 48], 12: [49, 53],
};

// ── Fetch helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch ciclos_cultivo rows for the Producción por Semana report.
 * Joins cultivos → ubicaciones + variedades via PostgREST embeds.
 */
export async function fetchReportCiclos(
  client: SupabaseClient,
  filters: ReportFilters,
): Promise<CicloReportRow[]> {
  const { start, end } =
    filters.fechaDesde && filters.fechaHasta
      ? { start: filters.fechaDesde, end: filters.fechaHasta }
      : weekRangeToDateRange(filters.year, filters.weekStart, filters.weekEnd);

  const { data, error } = await client
    .from("ciclos_cultivo")
    .select(
      `fecha_planeada, cantidad_planeada, ciclo_produccion,
       cultivos (
         numero_cultivo, id_ubicacion, id_variedad, observaciones,
         ubicaciones ( nombre_cultivo, vereda ),
         variedades ( nombre )
       )`,
    )
    .gte("fecha_planeada", start)
    .lte("fecha_planeada", end)
    .not("fecha_planeada", "is", null)
    .not("cantidad_planeada", "is", null)
    .order("fecha_planeada", { ascending: true });

  if (error) throw error;

  type CicloRaw = {
    fecha_planeada: string;
    cantidad_planeada: number | null;
    ciclo_produccion: string | null;
    cultivos: {
      numero_cultivo: string;
      id_ubicacion: string | null;
      id_variedad: string | null;
      observaciones: string | null;
      ubicaciones: { nombre_cultivo: string | null; vereda: string | null } | null;
      variedades: { nombre: string } | null;
    } | null;
  };

  const rows: CicloReportRow[] = [];
  for (const raw of data ?? []) {
    const r = raw as unknown as CicloRaw;

    const fecha = new Date(r.fecha_planeada);
    const weekNum = getISOWeek(fecha);
    const isoYear = getISOWeekYear(fecha);
    const cultivo = r.cultivos;

    // Client-side ubicacion/variedad filter
    if (
      filters.ubicaciones[0] !== "ALL" &&
      !filters.ubicaciones.includes(cultivo?.id_ubicacion ?? "")
    )
      continue;
    if (
      filters.variedades[0] !== "ALL" &&
      !filters.variedades.includes(cultivo?.id_variedad ?? "")
    )
      continue;

    const ubicacionName =
      cultivo?.ubicaciones?.nombre_cultivo ??
      cultivo?.ubicaciones?.vereda ??
      "—";
    const variedad = cultivo?.variedades?.nombre ?? "—";

    rows.push({
      weekNum,
      isoYear,
      dateRange: formatWeekRange(isoYear, weekNum),
      ubicacionCultivo: `${ubicacionName} – ${cultivo?.numero_cultivo ?? "—"}`,
      variedad,
      observaciones:
        [cultivo?.observaciones, r.ciclo_produccion].filter(Boolean).join(" · ") || null,
      cantidadPlaneada: r.cantidad_planeada ?? 0,
    });
  }

  return rows.sort(
    (a, b) => a.isoYear - b.isoYear || a.weekNum - b.weekNum,
  );
}

/**
 * Fetch actividades_cultivo rows for the Mano de Obra report.
 */
export async function fetchReportActividades(
  client: SupabaseClient,
  filters: ReportFilters,
): Promise<ActividadReportRow[]> {
  const { start, end } = weekRangeToDateRange(filters.year, filters.weekStart, filters.weekEnd);

  const { data, error } = await client
    .from("actividades_cultivo")
    .select(
      `fecha_planeada, nombre_actividad, tiempo_requerido_min, observaciones,
       cultivos (
         numero_cultivo, id_ubicacion, id_variedad, observaciones,
         ubicaciones ( nombre_cultivo, vereda )
       )`,
    )
    .gte("fecha_planeada", start)
    .lte("fecha_planeada", end)
    .not("fecha_planeada", "is", null)
    .order("fecha_planeada", { ascending: true });

  if (error) throw error;

  type ActividadRaw = {
    fecha_planeada: string;
    nombre_actividad: string | null;
    tiempo_requerido_min: number | null;
    observaciones: string | null;
    cultivos: {
      numero_cultivo: string;
      id_ubicacion: string | null;
      id_variedad: string | null;
      observaciones: string | null;
      ubicaciones: { nombre_cultivo: string | null; vereda: string | null } | null;
    } | null;
  };

  const rows: ActividadReportRow[] = [];
  for (const raw of data ?? []) {
    const r = raw as unknown as ActividadRaw;

    const fecha = new Date(r.fecha_planeada);
    const weekNum = getISOWeek(fecha);
    const cultivo = r.cultivos;

    if (
      filters.ubicaciones[0] !== "ALL" &&
      !filters.ubicaciones.includes(cultivo?.id_ubicacion ?? "")
    )
      continue;
    if (
      filters.variedades[0] !== "ALL" &&
      !filters.variedades.includes(cultivo?.id_variedad ?? "")
    )
      continue;

    const ubicacionNameAct =
      cultivo?.ubicaciones?.nombre_cultivo ??
      cultivo?.ubicaciones?.vereda ??
      "—";

    rows.push({
      weekNum,
      dateRange: formatWeekRange(filters.year, weekNum),
      ubicacionCultivo: `${ubicacionNameAct} – ${cultivo?.numero_cultivo ?? "—"}`,
      actividad: r.nombre_actividad ?? "—",
      observaciones:
        [cultivo?.observaciones, r.observaciones].filter(Boolean).join(" · ") || null,
      tiempoHoras: (r.tiempo_requerido_min ?? 0) / 60,
    });
  }

  return rows.sort((a, b) => a.weekNum - b.weekNum);
}

/**
 * Fetch insumos_cultivo rows for the Materiales report.
 * Joins insumos to get valor_unitario for costo fallback.
 */
export async function fetchReportInsumos(
  client: SupabaseClient,
  filters: ReportFilters,
): Promise<InsumoReportRow[]> {
  const { start, end } = weekRangeToDateRange(filters.year, filters.weekStart, filters.weekEnd);

  const { data, error } = await client
    .from("insumos_cultivo")
    .select(
      `fecha_planeada, nombre_insumo, cantidad_requerida, costo_estimado, unidad_medida, observaciones,
       insumos ( nombre, valor_unitario ),
       cultivos (
         numero_cultivo, id_ubicacion, id_variedad, observaciones,
         ubicaciones ( nombre_cultivo, vereda )
       )`,
    )
    .gte("fecha_planeada", start)
    .lte("fecha_planeada", end)
    .not("fecha_planeada", "is", null)
    .order("fecha_planeada", { ascending: true });

  if (error) throw error;

  type InsumoRaw = {
    fecha_planeada: string;
    nombre_insumo: string | null;
    cantidad_requerida: number | null;
    costo_estimado: number | null;
    unidad_medida: string | null;
    observaciones: string | null;
    insumos: { nombre: string | null; valor_unitario: number | null } | null;
    cultivos: {
      numero_cultivo: string;
      id_ubicacion: string | null;
      id_variedad: string | null;
      observaciones: string | null;
      ubicaciones: { nombre_cultivo: string | null; vereda: string | null } | null;
    } | null;
  };

  const rows: InsumoReportRow[] = [];
  for (const raw of data ?? []) {
    const r = raw as unknown as InsumoRaw;

    const fecha = new Date(r.fecha_planeada);
    const weekNum = getISOWeek(fecha);
    const cultivo = r.cultivos;

    if (
      filters.ubicaciones[0] !== "ALL" &&
      !filters.ubicaciones.includes(cultivo?.id_ubicacion ?? "")
    )
      continue;
    if (
      filters.variedades[0] !== "ALL" &&
      !filters.variedades.includes(cultivo?.id_variedad ?? "")
    )
      continue;

    const cantidad = r.cantidad_requerida ?? 0;
    const costoEstimado =
      r.costo_estimado ??
      (r.insumos?.valor_unitario != null ? cantidad * r.insumos.valor_unitario : 0);

    const ubicacionNameIns =
      cultivo?.ubicaciones?.nombre_cultivo ??
      cultivo?.ubicaciones?.vereda ??
      "—";

    rows.push({
      weekNum,
      dateRange: formatWeekRange(filters.year, weekNum),
      ubicacionCultivo: `${ubicacionNameIns} – ${cultivo?.numero_cultivo ?? "—"}`,
      insumo: r.nombre_insumo ?? r.insumos?.nombre ?? "—",
      observaciones:
        [cultivo?.observaciones, r.observaciones].filter(Boolean).join(" · ") || null,
      cantidadRequerida: cantidad,
      unidad: r.unidad_medida ?? "—",
      costoEstimado,
    });
  }

  return rows.sort((a, b) => a.weekNum - b.weekNum);
}
