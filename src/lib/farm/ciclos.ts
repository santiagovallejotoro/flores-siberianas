import type { SupabaseClient } from "@supabase/supabase-js";
import type { Variedad } from "@/lib/farm/variedades";

export type CicloProduccion = {
  id: string;
  id_variedad: string;
  nombre_ciclo: string;
  nro_semana: number;
  porcentaje_produccion: number;
  descripcion: string | null;
  actividades_semana: string | null;
  created_at: string;
};

export type CicloUpdateInput = {
  nombre_ciclo: string;
  nro_semana: number;
  porcentaje_produccion: number;
  descripcion?: string | null;
  actividades_semana?: string | null;
};

const TABLE = "ciclo_produccion";
const COLS =
  "id, id_variedad, nombre_ciclo, nro_semana, porcentaje_produccion, descripcion, actividades_semana, created_at";

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/**
 * Peak-in-the-middle % distribution across N weekly cuts (legacy Sheet shape).
 * Port of `calcularDistribucionProduccion` (.cursor/farm/Code.gs:1579) — kept
 * line-for-line so behavior matches the legacy Sheet exactly.
 */
export function calcularDistribucionProduccion(numCortes: number): number[] {
  if (numCortes <= 0) return [];
  if (numCortes === 1) return [100];

  const raw: number[] = [];
  let total = 0;
  for (let i = 0; i < numCortes; i++) {
    const position = i / (numCortes - 1);
    const distance = Math.abs(position - 0.5);
    const value = Math.max(0.3, 1 - distance * 1.5);
    raw.push(value);
    total += value;
  }

  const normalized = raw.map((v) => Math.round(((v / total) * 100) * 10) / 10);
  const sum = normalized.reduce((a, b) => a + b, 0);
  normalized[normalized.length - 1] = Math.round((normalized[normalized.length - 1] + (100 - sum)) * 10) / 10;
  return normalized;
}

export async function listCiclosByVariedad(
  client: SupabaseClient,
  variedadId: string,
): Promise<CicloProduccion[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLS)
    .eq("id_variedad", variedadId)
    .order("nro_semana", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CicloProduccion[];
}

export async function updateCiclo(
  client: SupabaseClient,
  id: string,
  values: CicloUpdateInput,
): Promise<CicloProduccion> {
  const { data, error } = await client
    .from(TABLE)
    .update({
      nombre_ciclo: values.nombre_ciclo.trim(),
      nro_semana: Math.trunc(values.nro_semana),
      porcentaje_produccion: values.porcentaje_produccion,
      descripcion: trimOrNull(values.descripcion),
      actividades_semana: trimOrNull(values.actividades_semana),
    })
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as CicloProduccion;
}

export async function deleteCiclo(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllCiclosByVariedad(
  client: SupabaseClient,
  variedadId: string,
): Promise<void> {
  const { error: delErr } = await client
    .from(TABLE)
    .delete()
    .eq("id_variedad", variedadId);
  if (delErr) throw delErr;

  const { error: vErr } = await client
    .from("variedades")
    .update({ tiene_ciclos_produccion: false })
    .eq("id", variedadId);
  if (vErr) throw vErr;
}

export type GenerarResult = {
  ciclos: CicloProduccion[];
  numCortes: number;
};

/**
 * Regenerate the production cycles for a variedad.
 * Based on `generarCiclosProduccion` (.cursor/farm/Code.gs:1471), with a
 * deliberate fix: **the first corte uses `semana_inicio_corte` itself** (not
 * start+1), and cortes run **inclusive** through week `ciclo_en_semanas`, so
 * `numCortes = cicloSemanas - semanaInicio + 1` when both are 1-based week
 * indices within the cycle.
 */
export async function generarCiclosProduccion(
  client: SupabaseClient,
  variedad: Pick<Variedad, "id" | "ciclo_en_semanas" | "semana_inicio_corte">,
): Promise<GenerarResult> {
  const cicloSemanas = Number(variedad.ciclo_en_semanas) || 0;
  const semanaInicio = Number(variedad.semana_inicio_corte) || 0;

  if (cicloSemanas <= 0 || semanaInicio <= 0) {
    throw new Error(
      "Debe especificar Ciclo en Semanas y Semana Inicio Corte en la variedad.",
    );
  }
  if (semanaInicio > cicloSemanas) {
    throw new Error(
      "Semana Inicio Corte no puede ser mayor que Ciclo en Semanas.",
    );
  }

  const numCortes = cicloSemanas - semanaInicio + 1;
  const percentages = calcularDistribucionProduccion(numCortes);

  const { error: delError } = await client
    .from(TABLE)
    .delete()
    .eq("id_variedad", variedad.id);
  if (delError) throw delError;

  const newRows = percentages.map((pct, i) => {
    const corteNum = i + 1;
    const nroSemana = semanaInicio + i;
    return {
      id_variedad: variedad.id,
      nombre_ciclo: `Corte ${corteNum}`,
      nro_semana: nroSemana,
      porcentaje_produccion: pct,
      descripcion: `Semana ${nroSemana} del ciclo`,
      actividades_semana: null as string | null,
    };
  });

  const { data: inserted, error: insError } = await client
    .from(TABLE)
    .insert(newRows)
    .select(COLS);
  if (insError) throw insError;

  const { error: vErr } = await client
    .from("variedades")
    .update({ tiene_ciclos_produccion: true })
    .eq("id", variedad.id);
  if (vErr) throw vErr;

  return {
    ciclos: (inserted ?? []) as CicloProduccion[],
    numCortes,
  };
}

export async function actualizarCiclosBatch(
  client: SupabaseClient,
  updates: Array<{ id: string; values: CicloUpdateInput }>,
): Promise<CicloProduccion[]> {
  const results: CicloProduccion[] = [];
  for (const u of updates) {
    results.push(await updateCiclo(client, u.id, u.values));
  }
  return results;
}
