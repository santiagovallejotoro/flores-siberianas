import type { SupabaseClient } from "@supabase/supabase-js";

export type Ubicacion = {
  id: string;
  nombre_cultivo: string | null;
  vereda: string | null;
  municipio: string | null;
  area_m2: number | null;
  observaciones: string | null;
  created_at: string;
};

export type UbicacionInput = {
  nombre_cultivo?: string | null;
  vereda?: string | null;
  municipio?: string | null;
  area_m2?: number | null;
  observaciones?: string | null;
};

const TABLE = "ubicaciones";
const COLS =
  "id, nombre_cultivo, vereda, municipio, area_m2, observaciones, created_at";

function normalize(values: UbicacionInput) {
  const trim = (v: string | null | undefined) => {
    if (v == null) return null;
    const t = v.trim();
    return t === "" ? null : t;
  };
  const nombre_cultivo = trim(values.nombre_cultivo);
  const vereda = trim(values.vereda);
  /** DB column `ubicaciones.nombre` is NOT NULL; mirror label from cultivo/vereda. */
  const nombre = nombre_cultivo ?? vereda ?? "Sin nombre";
  return {
    nombre,
    nombre_cultivo,
    vereda,
    municipio: trim(values.municipio),
    area_m2:
      values.area_m2 == null || Number.isNaN(values.area_m2)
        ? null
        : values.area_m2,
    observaciones: trim(values.observaciones),
  };
}

export async function listUbicaciones(
  client: SupabaseClient,
): Promise<Ubicacion[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLS)
    .order("nombre_cultivo", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Ubicacion[];
}

export async function createUbicacion(
  client: SupabaseClient,
  values: UbicacionInput,
): Promise<Ubicacion> {
  const { data, error } = await client
    .from(TABLE)
    .insert(normalize(values))
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Ubicacion;
}

export async function updateUbicacion(
  client: SupabaseClient,
  id: string,
  values: UbicacionInput,
): Promise<Ubicacion> {
  const { data, error } = await client
    .from(TABLE)
    .update(normalize(values))
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Ubicacion;
}

export async function deleteUbicacion(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
