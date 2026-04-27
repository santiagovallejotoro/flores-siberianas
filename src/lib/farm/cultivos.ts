import type { SupabaseClient } from "@supabase/supabase-js";

/** Must match `cultivos_estado_check` in Postgres (no migration needed). */
export type EstadoCultivo =
  | "Planificado"
  | "Activo"
  | "Finalizado"
  | "Cancelado";

export const ESTADOS_CULTIVO: EstadoCultivo[] = [
  "Planificado",
  "Activo",
  "Finalizado",
  "Cancelado",
];

export type Cultivo = {
  id: string;
  numero_cultivo: string;
  id_variedad: string | null;
  id_ubicacion: string | null;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  total_plantas: number | null;
  tasa_produccion_planta: number | null;
  area_m2: number | null;
  numero_camas: number | null;
  estado: EstadoCultivo | null;
  observaciones: string | null;
  created_at: string;
};

export type CultivoInput = {
  numero_cultivo: string;
  id_variedad?: string | null;
  id_ubicacion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin_estimada?: string | null;
  total_plantas?: number | null;
  tasa_produccion_planta?: number | null;
  area_m2?: number | null;
  numero_camas?: number | null;
  estado?: EstadoCultivo | null;
  observaciones?: string | null;
};

const TABLE = "cultivos";
const COLS =
  "id, numero_cultivo, id_variedad, id_ubicacion, fecha_inicio, fecha_fin_estimada, total_plantas, tasa_produccion_planta, area_m2, numero_camas, estado, observaciones, created_at";

function trim(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function numOrNull(v: number | null | undefined): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return v;
}

function normalize(values: CultivoInput) {
  return {
    numero_cultivo: values.numero_cultivo.trim(),
    id_variedad: trim(values.id_variedad) ?? null,
    id_ubicacion: trim(values.id_ubicacion) ?? null,
    fecha_inicio: trim(values.fecha_inicio) ?? null,
    fecha_fin_estimada: trim(values.fecha_fin_estimada) ?? null,
    total_plantas: numOrNull(values.total_plantas),
    tasa_produccion_planta: numOrNull(values.tasa_produccion_planta),
    area_m2: numOrNull(values.area_m2),
    numero_camas: numOrNull(values.numero_camas),
    estado: (trim(values.estado) ?? null) as EstadoCultivo | null,
    observaciones: trim(values.observaciones) ?? null,
  };
}

export async function listCultivos(client: SupabaseClient): Promise<Cultivo[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLS)
    .order("fecha_inicio", { ascending: false })
    .order("numero_cultivo", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Cultivo[];
}

export async function createCultivo(
  client: SupabaseClient,
  values: CultivoInput,
): Promise<Cultivo> {
  const row = {
    ...normalize(values),
    /** Default "Activo" = cultivo en campo (replaces legacy sheet "En Progreso"). */
    estado: (values.estado ?? "Activo") as EstadoCultivo,
  };
  const { data, error } = await client
    .from(TABLE)
    .insert(row)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Cultivo;
}

export async function updateCultivo(
  client: SupabaseClient,
  id: string,
  values: CultivoInput,
): Promise<Cultivo> {
  const { data, error } = await client
    .from(TABLE)
    .update(normalize(values))
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Cultivo;
}

export async function deleteCultivo(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

/**
 * Calculates fecha_fin_estimada from fecha_inicio + ciclo_en_semanas.
 * Returns undefined if either value is missing.
 */
export function calcFechaFin(
  fechaInicio: string | null | undefined,
  cicloEnSemanas: number | null | undefined,
): string | undefined {
  if (!fechaInicio || !cicloEnSemanas || cicloEnSemanas <= 0) return undefined;
  const d = new Date(fechaInicio);
  if (isNaN(d.getTime())) return undefined;
  d.setDate(d.getDate() + cicloEnSemanas * 7);
  return d.toISOString().slice(0, 10);
}
