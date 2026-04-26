import type { SupabaseClient } from "@supabase/supabase-js";

export type ClaseCultivo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
};

const TABLE = "clases_cultivo";
const COLS = "id, nombre, descripcion, created_at";

export async function listClases(client: SupabaseClient): Promise<ClaseCultivo[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLS)
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ClaseCultivo[];
}

export async function createClase(
  client: SupabaseClient,
  values: { nombre: string; descripcion?: string | null },
): Promise<ClaseCultivo> {
  const { data, error } = await client
    .from(TABLE)
    .insert({
      nombre: values.nombre.trim().toUpperCase(),
      descripcion: values.descripcion?.trim() || null,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return data as ClaseCultivo;
}

export async function updateClase(
  client: SupabaseClient,
  id: string,
  values: { nombre: string; descripcion?: string | null },
): Promise<ClaseCultivo> {
  const { data, error } = await client
    .from(TABLE)
    .update({
      nombre: values.nombre.trim().toUpperCase(),
      descripcion: values.descripcion?.trim() || null,
    })
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as ClaseCultivo;
}

export async function deleteClase(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
