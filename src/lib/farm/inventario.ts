import type { SupabaseClient } from "@supabase/supabase-js";

// ── TipoMovimiento — must match DB check constraint ──────────────────────────
export type TipoMovimiento = "ENTRADA" | "SALIDA" | "AJUSTE";
export const TIPOS_MOVIMIENTO: TipoMovimiento[] = [
  "ENTRADA",
  "SALIDA",
  "AJUSTE",
];

// ── Movimiento row ────────────────────────────────────────────────────────────
export type Movimiento = {
  id: string;
  id_insumo: string;
  tipo: TipoMovimiento;
  cantidad: number;
  unidad: string;
  fecha: string;
  id_ubicacion: string;
  id_cultivo: string | null;
  descripcion: string | null;
  precio_unitario: number | null;
  costo_total: number | null;
  referencia: string | null;
  id_insumos_cultivo: string | null;
  id_costo: string | null;
  created_at: string;
};

export type MovimientoInput = {
  id_insumo: string;
  tipo: TipoMovimiento;
  cantidad: number;
  unidad: string;
  fecha: string;
  id_ubicacion: string;
  id_cultivo?: string | null;
  descripcion?: string | null;
  precio_unitario?: number | null;
  costo_total?: number | null;
  referencia?: string | null;
  id_insumos_cultivo?: string | null;
  id_costo?: string | null;
};

// ── NecesidadCompra row (purchase report) ─────────────────────────────────────
export type NecesidadCompra = {
  id_insumo: string;
  nombre: string;
  unidad_medida: string | null;
  stock_actual: number;
  stock_minimo: number | null;
  requerido_total: number;
  deficit: number;
};

// ── Internal helpers ──────────────────────────────────────────────────────────

const TABLE = "inventario_movimientos";
const COLS =
  "id, id_insumo, tipo, cantidad, unidad, fecha, id_ubicacion, id_cultivo, " +
  "descripcion, precio_unitario, costo_total, referencia, id_insumos_cultivo, id_costo, created_at";

function trim(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function numOrNull(v: number | null | undefined): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return v;
}

function fkOrNull(v: string | null | undefined): string | null {
  const t = trim(v);
  return t ?? null;
}

function normalize(values: MovimientoInput) {
  return {
    id_insumo: values.id_insumo,
    tipo: values.tipo,
    cantidad: values.cantidad,
    unidad: values.unidad,
    fecha: values.fecha,
    id_ubicacion: values.id_ubicacion,
    id_cultivo: fkOrNull(values.id_cultivo),
    descripcion: trim(values.descripcion) ?? null,
    precio_unitario: numOrNull(values.precio_unitario),
    costo_total: numOrNull(values.costo_total),
    referencia: trim(values.referencia) ?? null,
    id_insumos_cultivo: fkOrNull(values.id_insumos_cultivo),
    id_costo: fkOrNull(values.id_costo),
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export interface ListMovimientosFilters {
  fechaInicio?: string | null;
  fechaFin?: string | null;
  id_insumo?: string | null;
  id_ubicacion?: string | null;
  tipo?: TipoMovimiento | null;
}

export async function listMovimientos(
  client: SupabaseClient,
  filters: ListMovimientosFilters = {},
): Promise<Movimiento[]> {
  let query = client.from(TABLE).select(COLS);
  if (filters.fechaInicio) query = query.gte("fecha", filters.fechaInicio);
  if (filters.fechaFin) query = query.lte("fecha", filters.fechaFin);
  if (filters.id_insumo) query = query.eq("id_insumo", filters.id_insumo);
  if (filters.id_ubicacion)
    query = query.eq("id_ubicacion", filters.id_ubicacion);
  if (filters.tipo) query = query.eq("tipo", filters.tipo);
  query = query
    .order("fecha", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Movimiento[];
}

export async function createMovimiento(
  client: SupabaseClient,
  values: MovimientoInput,
): Promise<Movimiento> {
  const { data, error } = await client
    .from(TABLE)
    .insert(normalize(values))
    .select(COLS)
    .single();
  if (error) throw error;
  return data as unknown as Movimiento;
}

export async function deleteMovimiento(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function deleteMovimientosByCostoId(
  client: SupabaseClient,
  costoId: string,
): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .delete()
    .eq("id_costo", costoId);
  if (error) throw error;
}

// ── Purchase report ───────────────────────────────────────────────────────────
// Joins insumos_cultivo (planned requirements for active/planned cultivos)
// with insumos.stock_actual to calculate the deficit.

export async function listNecesidadCompra(
  client: SupabaseClient,
  estadoCultivo?: string | null,
  fechaInicio?: string | null,
  fechaFin?: string | null,
): Promise<NecesidadCompra[]> {
  // Step 1: fetch all insumos_cultivo with their insumo details
  // joining through cultivos to filter by estado
  let cultivosQuery = client
    .from("cultivos")
    .select("id")
    .in("estado", estadoCultivo ? [estadoCultivo] : ["Activo", "Planificado"]);
  const { data: cultivosData, error: cultivosError } = await cultivosQuery;
  if (cultivosError) throw cultivosError;

  const cultivoIds = (cultivosData ?? []).map((c: { id: string }) => c.id);
  if (cultivoIds.length === 0) return [];

  let icQuery = client
    .from("insumos_cultivo")
    .select("id_insumo, cantidad_requerida")
    .in("id_cultivo", cultivoIds)
    .not("id_insumo", "is", null);
  if (fechaInicio) icQuery = icQuery.gte("fecha_planeada", fechaInicio);
  if (fechaFin) icQuery = icQuery.lte("fecha_planeada", fechaFin);
  const { data: icData, error: icError } = await icQuery;
  if (icError) throw icError;

  // Step 2: aggregate required amounts per insumo
  const requeridoMap = new Map<string, number>();
  for (const row of icData ?? []) {
    if (!row.id_insumo) continue;
    const prev = requeridoMap.get(row.id_insumo) ?? 0;
    requeridoMap.set(row.id_insumo, prev + (row.cantidad_requerida ?? 0));
  }

  if (requeridoMap.size === 0) return [];

  // Step 3: fetch the insumos involved
  const { data: insumosData, error: insumosError } = await client
    .from("insumos")
    .select("id, nombre, unidad_medida, stock_actual, stock_minimo")
    .in("id", Array.from(requeridoMap.keys()));
  if (insumosError) throw insumosError;

  // Step 4: build report rows
  const result: NecesidadCompra[] = [];
  for (const ins of insumosData ?? []) {
    const requerido = requeridoMap.get(ins.id) ?? 0;
    const deficit = Math.max(0, requerido - ins.stock_actual);
    const bajominimo =
      ins.stock_minimo != null && ins.stock_actual <= ins.stock_minimo;
    // Include if there is a deficit OR stock is below minimum
    if (deficit > 0 || bajominimo) {
      result.push({
        id_insumo: ins.id,
        nombre: ins.nombre,
        unidad_medida: ins.unidad_medida,
        stock_actual: ins.stock_actual,
        stock_minimo: ins.stock_minimo,
        requerido_total: requerido,
        deficit,
      });
    }
  }

  return result.sort((a, b) => b.deficit - a.deficit);
}
