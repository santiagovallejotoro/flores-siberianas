import type { SupabaseClient } from "@supabase/supabase-js";

// ── Estado venta — must match DB check constraint exactly ─────────────────────
export type EstadoVenta = "Pendiente" | "Vendido" | "Cancelado";
export const ESTADOS_VENTA: EstadoVenta[] = ["Pendiente", "Vendido", "Cancelado"];

// ── Produccion row ─────────────────────────────────────────────────────────────
export type Produccion = {
  id: string;
  id_ubicacion: string | null;
  id_cultivo: string | null;
  id_ciclo_cultivo: string | null;
  fecha: string | null;
  cantidad_cosechada: number | null;
  unidad: string | null;
  perdidas: number | null;
  motivo_perdida: string | null;
  moneda: string | null;
  precio_venta: number | null;
  costo_total: number | null;
  comprador: string | null;
  estado_venta: EstadoVenta | null;
  observaciones: string | null;
  created_at: string;
};

export type ProduccionInput = {
  id_ubicacion?: string | null;
  id_cultivo?: string | null;
  id_ciclo_cultivo?: string | null;
  fecha?: string | null;
  cantidad_cosechada?: number | null;
  unidad?: string | null;
  perdidas?: number | null;
  motivo_perdida?: string | null;
  moneda?: string | null;
  precio_venta?: number | null;
  costo_total?: number | null;
  comprador?: string | null;
  estado_venta?: EstadoVenta | null;
  observaciones?: string | null;
};

// ── CicloCultivo (from ciclos_cultivo, used in the ciclo picker) ──────────────
export type CicloCultivo = {
  id: string;
  id_cultivo: string;
  ciclo_produccion: string | null;
  nro_semana: number | null;
  fecha_planeada: string | null;
  cantidad_planeada: number | null;
  estado: string | null;
};

// ── Internal helpers ──────────────────────────────────────────────────────────

const TABLE = "produccion";
const COLS =
  "id, id_ubicacion, id_cultivo, id_ciclo_cultivo, fecha, " +
  "cantidad_cosechada, unidad, perdidas, motivo_perdida, moneda, " +
  "precio_venta, costo_total, comprador, estado_venta, observaciones, created_at";

const CICLOS_COLS =
  "id, id_cultivo, ciclo_produccion, nro_semana, fecha_planeada, cantidad_planeada, estado";

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

function normalize(values: ProduccionInput) {
  return {
    id_ubicacion: fkOrNull(values.id_ubicacion),
    id_cultivo: fkOrNull(values.id_cultivo),
    id_ciclo_cultivo: fkOrNull(values.id_ciclo_cultivo),
    fecha: trim(values.fecha) ?? null,
    cantidad_cosechada: numOrNull(values.cantidad_cosechada),
    unidad: trim(values.unidad) ?? null,
    perdidas: numOrNull(values.perdidas),
    motivo_perdida: trim(values.motivo_perdida) ?? null,
    moneda: trim(values.moneda) ?? "COP",
    precio_venta: numOrNull(values.precio_venta),
    costo_total: numOrNull(values.costo_total),
    comprador: trim(values.comprador) ?? null,
    estado_venta: (trim(values.estado_venta) ?? "Pendiente") as EstadoVenta,
    observaciones: trim(values.observaciones) ?? null,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listProducciones(
  client: SupabaseClient,
  fechaInicio?: string | null,
  fechaFin?: string | null,
): Promise<Produccion[]> {
  let query = client.from(TABLE).select(COLS);
  if (fechaInicio) query = query.gte("fecha", fechaInicio);
  if (fechaFin) query = query.lte("fecha", fechaFin);
  query = query
    .order("fecha", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Produccion[];
}

export async function createProduccion(
  client: SupabaseClient,
  values: ProduccionInput,
): Promise<Produccion> {
  const { data, error } = await client
    .from(TABLE)
    .insert(normalize(values))
    .select(COLS)
    .single();
  if (error) throw error;
  return data as unknown as Produccion;
}

export async function updateProduccion(
  client: SupabaseClient,
  id: string,
  values: ProduccionInput,
): Promise<Produccion> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...normalize(values), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as unknown as Produccion;
}

export async function deleteProduccion(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function listCiclosCultivo(
  client: SupabaseClient,
  cultivoId: string,
): Promise<CicloCultivo[]> {
  const { data, error } = await client
    .from("ciclos_cultivo")
    .select(CICLOS_COLS)
    .eq("id_cultivo", cultivoId)
    .order("nro_semana", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CicloCultivo[];
}
