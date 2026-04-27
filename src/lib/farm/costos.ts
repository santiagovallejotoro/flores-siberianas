import type { SupabaseClient } from "@supabase/supabase-js";

// ── TipoCosto — must match DB check constraint exactly ───────────────────────
export type TipoCosto =
  | "MANO_OBRA"
  | "INSUMO"
  | "GENERAL"
  | "OTRO"
  | "ARRENDAMIENTO"
  | "SERVICIO";
export const TIPOS_COSTO: TipoCosto[] = [
  "MANO_OBRA",
  "INSUMO",
  "GENERAL",
  "OTRO",
  "ARRENDAMIENTO",
  "SERVICIO",
];

// ── Costo row ──────────────────────────────────────────────────────────────────
export type Costo = {
  id: string;
  id_ubicacion: string | null;
  id_cultivo: string | null;
  fecha: string | null;
  tipo_costo: TipoCosto;
  descripcion: string | null;
  cantidad: number | null;
  unidad: string | null;
  costo_unitario: number | null;
  costo_total: number | null;
  id_insumo: string | null;
  id_actividad: string | null;
  responsable: string | null;
  observaciones: string | null;
  created_at: string;
};

export type CostoInput = {
  id_ubicacion?: string | null;
  id_cultivo?: string | null;
  fecha?: string | null;
  tipo_costo: TipoCosto;
  descripcion?: string | null;
  cantidad?: number | null;
  unidad?: string | null;
  costo_unitario?: number | null;
  costo_total?: number | null;
  id_insumo?: string | null;
  id_actividad?: string | null;
  responsable?: string | null;
  observaciones?: string | null;
};

// ── Contextual picker types ───────────────────────────────────────────────────

export type InsumosCultivoRow = {
  id: string;
  id_insumo: string | null;
  id_actividad_cultivo: string | null;
  nombre_insumo: string | null;
  nro_semana: number | null;
  fecha_planeada: string | null;
  cantidad_requerida: number | null;
  unidad_medida: string | null;
};

export type ActividadesCultivoRow = {
  id: string;
  id_actividad: string | null;
  nombre_actividad: string | null;
  nro_semana: number | null;
  fecha_planeada: string | null;
  tiempo_requerido_min: number | null;
};

// ── Internal helpers ──────────────────────────────────────────────────────────

const TABLE = "costos";
const COLS =
  "id, id_ubicacion, id_cultivo, fecha, tipo_costo, descripcion, " +
  "cantidad, unidad, costo_unitario, costo_total, id_insumo, id_actividad, " +
  "responsable, observaciones, created_at";

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

function normalize(values: CostoInput) {
  return {
    id_ubicacion: fkOrNull(values.id_ubicacion),
    id_cultivo: fkOrNull(values.id_cultivo),
    fecha: trim(values.fecha) ?? null,
    tipo_costo: values.tipo_costo,
    descripcion: trim(values.descripcion) ?? null,
    cantidad: numOrNull(values.cantidad),
    unidad: trim(values.unidad) ?? null,
    costo_unitario: numOrNull(values.costo_unitario),
    costo_total: numOrNull(values.costo_total),
    id_insumo: fkOrNull(values.id_insumo),
    id_actividad: fkOrNull(values.id_actividad),
    responsable: trim(values.responsable) ?? null,
    observaciones: trim(values.observaciones) ?? null,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listCostos(
  client: SupabaseClient,
  fechaInicio?: string | null,
  fechaFin?: string | null,
): Promise<Costo[]> {
  let query = client.from(TABLE).select(COLS);
  if (fechaInicio) query = query.gte("fecha", fechaInicio);
  if (fechaFin) query = query.lte("fecha", fechaFin);
  query = query
    .order("fecha", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Costo[];
}

export async function createCosto(
  client: SupabaseClient,
  values: CostoInput,
): Promise<Costo> {
  const { data, error } = await client
    .from(TABLE)
    .insert(normalize(values))
    .select(COLS)
    .single();
  if (error) throw error;
  return data as unknown as Costo;
}

export async function updateCosto(
  client: SupabaseClient,
  id: string,
  values: CostoInput,
): Promise<Costo> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...normalize(values), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as unknown as Costo;
}

export async function deleteCosto(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function listInsumosCultivoForCultivo(
  client: SupabaseClient,
  cultivoId: string,
): Promise<InsumosCultivoRow[]> {
  const { data, error } = await client
    .from("insumos_cultivo")
    .select(
      "id, id_insumo, id_actividad_cultivo, nombre_insumo, nro_semana, fecha_planeada, cantidad_requerida, unidad_medida",
    )
    .eq("id_cultivo", cultivoId)
    .order("nro_semana", { ascending: true });
  if (error) throw error;
  return (data ?? []) as InsumosCultivoRow[];
}

export async function listActividadesCultivoForCultivo(
  client: SupabaseClient,
  cultivoId: string,
): Promise<ActividadesCultivoRow[]> {
  const { data, error } = await client
    .from("actividades_cultivo")
    .select(
      "id, id_actividad, nombre_actividad, nro_semana, fecha_planeada, tiempo_requerido_min",
    )
    .eq("id_cultivo", cultivoId)
    .order("nro_semana", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ActividadesCultivoRow[];
}
