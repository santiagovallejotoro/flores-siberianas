import type { SupabaseClient } from "@supabase/supabase-js";

export type Categoria =
  | "Establecimiento"
  | "Mantenimiento"
  | "Producción"
  | "Postcosecha";

export const CATEGORIAS: Categoria[] = [
  "Establecimiento",
  "Mantenimiento",
  "Producción",
  "Postcosecha",
];

export type Actividad = {
  id: string;
  proveedor_id: string;
  id_clase_cultivo: string | null;
  id_variedad: string | null;
  nombre_actividad: string;
  semana_actividad: number;
  categoria: Categoria | null;
  tiempo_por_planta_seg: number | null;
  requiere_insumos: boolean | null;
  insumos_json: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ActividadInput = {
  id_clase_cultivo?: string | null;
  id_variedad?: string | null;
  nombre_actividad: string;
  semana_actividad: number;
  categoria?: Categoria | null;
  tiempo_por_planta_seg?: number | null;
  requiere_insumos?: boolean | null;
  insumos_json?: string;
  descripcion?: string | null;
};

const TABLE = "actividades";
const COLS =
  "id, proveedor_id, id_clase_cultivo, id_variedad, nombre_actividad, semana_actividad, categoria, tiempo_por_planta_seg, requiere_insumos, insumos_json, descripcion, created_at, updated_at";

function normalize(values: ActividadInput) {
  const trim = (v: string | null | undefined) => {
    if (v == null) return null;
    const t = v.trim();
    return t === "" ? null : t;
  };
  const num = (v: number | null | undefined) =>
    v == null || Number.isNaN(v) ? null : v;

  return {
    id_clase_cultivo: trim(values.id_clase_cultivo),
    id_variedad: trim(values.id_variedad),
    nombre_actividad: values.nombre_actividad.trim(),
    semana_actividad: num(values.semana_actividad) ?? 0,
    categoria: trim(values.categoria) as Categoria | null,
    tiempo_por_planta_seg: num(values.tiempo_por_planta_seg),
    requiere_insumos: values.requiere_insumos ?? false,
    insumos_json: values.insumos_json?.trim() || "[]",
    descripcion: trim(values.descripcion),
  };
}

export async function listActividades(
  client: SupabaseClient,
): Promise<Actividad[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLS)
    .order("semana_actividad", { ascending: true })
    .order("nombre_actividad", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Actividad[];
}

export async function listActividadesByClase(
  client: SupabaseClient,
  idClaseCultivo: string,
): Promise<Actividad[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLS)
    .eq("id_clase_cultivo", idClaseCultivo)
    .is("id_variedad", null)
    .order("semana_actividad", { ascending: true })
    .order("nombre_actividad", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Actividad[];
}

export async function listActividadesByVariedad(
  client: SupabaseClient,
  idVariedad: string,
): Promise<Actividad[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLS)
    .eq("id_variedad", idVariedad)
    .is("id_clase_cultivo", null)
    .order("semana_actividad", { ascending: true })
    .order("nombre_actividad", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Actividad[];
}

export async function createActividad(
  client: SupabaseClient,
  values: ActividadInput,
): Promise<Actividad> {
  const { data, error } = await client
    .from(TABLE)
    .insert(normalize(values))
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Actividad;
}

export async function updateActividad(
  client: SupabaseClient,
  id: string,
  values: ActividadInput,
): Promise<Actividad> {
  const { data, error } = await client
    .from(TABLE)
    .update(normalize(values))
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Actividad;
}

export async function deleteActividad(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
