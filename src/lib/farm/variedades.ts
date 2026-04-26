import type { SupabaseClient } from "@supabase/supabase-js";

export type UnidadRendimiento = "Tallo" | "kg" | "unidades" | "lb";

export type Variedad = {
  id: string;
  nombre: string;
  tipo_cultivo: string | null;
  id_ubicacion: string | null;
  ciclo_en_semanas: number | null;
  semana_inicio_corte: number | null;
  rendimiento_esperado_por_planta: number | null;
  unidad_rendimiento: UnidadRendimiento | null;
  tiene_ciclos_produccion: boolean;
  observaciones: string | null;
  created_at: string;
};

export type VariedadInput = {
  nombre: string;
  tipo_cultivo?: string | null;
  id_ubicacion?: string | null;
  ciclo_en_semanas?: number | null;
  semana_inicio_corte?: number | null;
  rendimiento_esperado_por_planta?: number | null;
  unidad_rendimiento?: UnidadRendimiento | null;
  observaciones?: string | null;
};

const TABLE = "variedades";
const COLS =
  "id, nombre, tipo_cultivo, id_ubicacion, ciclo_en_semanas, semana_inicio_corte, rendimiento_esperado_por_planta, unidad_rendimiento, tiene_ciclos_produccion, observaciones, created_at";

function normalize(values: VariedadInput) {
  const trim = (v: string | null | undefined) => {
    if (v == null) return null;
    const t = v.trim();
    return t === "" ? null : t;
  };
  const num = (v: number | null | undefined) =>
    v == null || Number.isNaN(v) ? null : v;

  return {
    nombre: values.nombre.trim(),
    tipo_cultivo: trim(values.tipo_cultivo),
    id_ubicacion: trim(values.id_ubicacion),
    ciclo_en_semanas: num(values.ciclo_en_semanas),
    semana_inicio_corte: num(values.semana_inicio_corte),
    rendimiento_esperado_por_planta: num(values.rendimiento_esperado_por_planta),
    unidad_rendimiento: trim(values.unidad_rendimiento) as UnidadRendimiento | null,
    observaciones: trim(values.observaciones),
  };
}

export async function listVariedades(client: SupabaseClient): Promise<Variedad[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLS)
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Variedad[];
}

export async function createVariedad(
  client: SupabaseClient,
  values: VariedadInput,
): Promise<Variedad> {
  const { data, error } = await client
    .from(TABLE)
    .insert(normalize(values))
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Variedad;
}

export async function updateVariedad(
  client: SupabaseClient,
  id: string,
  values: VariedadInput,
): Promise<Variedad> {
  const { data, error } = await client
    .from(TABLE)
    .update(normalize(values))
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Variedad;
}

export async function deleteVariedad(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
