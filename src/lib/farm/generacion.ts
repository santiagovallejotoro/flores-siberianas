import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cultivo } from "@/lib/farm/cultivos";
import type { ClaseCultivo } from "@/lib/farm/clases";
import type { Actividad } from "@/lib/farm/actividades";
import type { Variedad } from "@/lib/farm/variedades";

// ── Shared types ─────────────────────────────────────────────────────────────

export type GenStatus = {
  ciclosCount: number;
  actividadesCount: number;
  insumosCount: number;
};

export type SourceType = "Variedad" | "Clase";

export type SourceOption = {
  type: SourceType;
  label: string;
  count: number;
  claseId?: string;
};

type InsumoJsonLine = {
  id?: string;
  nombre?: string;
  nombre_insumo?: string;
  cantidad_por_planta?: number;
  unidad_medida_por_planta?: string;
  unidad?: string;
};

// ── addWeeks helper ───────────────────────────────────────────────────────────

function addWeeks(fechaInicio: string | null | undefined, weeks: number): string | null {
  if (!fechaInicio) return null;
  const d = new Date(fechaInicio);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

// ── getCultivoGenerationStatus ────────────────────────────────────────────────

/**
 * Batch-fetch generation status for a list of cultivo IDs.
 * Runs 3 GROUP BY count queries in parallel.
 */
export async function getCultivoGenerationStatus(
  client: SupabaseClient,
  cultivoIds: string[],
): Promise<Map<string, GenStatus>> {
  if (cultivoIds.length === 0) return new Map();

  const [ciclosRes, actividadesRes, insumosRes] = await Promise.all([
    client
      .from("ciclos_cultivo")
      .select("id_cultivo")
      .in("id_cultivo", cultivoIds),
    client
      .from("actividades_cultivo")
      .select("id_cultivo")
      .in("id_cultivo", cultivoIds),
    client
      .from("insumos_cultivo")
      .select("id_cultivo")
      .in("id_cultivo", cultivoIds),
  ]);

  if (ciclosRes.error) throw ciclosRes.error;
  if (actividadesRes.error) throw actividadesRes.error;
  if (insumosRes.error) throw insumosRes.error;

  const ciclosCount = new Map<string, number>();
  const actividadesCount = new Map<string, number>();
  const insumosCount = new Map<string, number>();

  for (const row of ciclosRes.data ?? []) {
    const id = (row as { id_cultivo: string }).id_cultivo;
    ciclosCount.set(id, (ciclosCount.get(id) ?? 0) + 1);
  }
  for (const row of actividadesRes.data ?? []) {
    const id = (row as { id_cultivo: string }).id_cultivo;
    actividadesCount.set(id, (actividadesCount.get(id) ?? 0) + 1);
  }
  for (const row of insumosRes.data ?? []) {
    const id = (row as { id_cultivo: string }).id_cultivo;
    insumosCount.set(id, (insumosCount.get(id) ?? 0) + 1);
  }

  const result = new Map<string, GenStatus>();
  for (const id of cultivoIds) {
    result.set(id, {
      ciclosCount: ciclosCount.get(id) ?? 0,
      actividadesCount: actividadesCount.get(id) ?? 0,
      insumosCount: insumosCount.get(id) ?? 0,
    });
  }
  return result;
}

// ── generarCiclosCultivo ──────────────────────────────────────────────────────

/**
 * Materialises `ciclos_cultivo` for a cultivo from its variety's
 * `ciclo_produccion` template rows. Deletes existing rows first.
 */
export async function generarCiclosCultivo(
  client: SupabaseClient,
  cultivo: Cultivo,
): Promise<{ count: number }> {
  if (!cultivo.id_variedad) {
    throw new Error("El cultivo no tiene una variedad asignada.");
  }

  // Load the variety template
  const { data: plantilla, error: tErr } = await client
    .from("ciclo_produccion")
    .select(
      "id, nombre_ciclo, nro_semana, porcentaje_produccion",
    )
    .eq("id_variedad", cultivo.id_variedad)
    .order("nro_semana", { ascending: true });
  if (tErr) throw tErr;
  if (!plantilla || plantilla.length === 0) {
    throw new Error(
      "La variedad no tiene ciclos de producción definidos. Genéralos primero en el catálogo de Variedades.",
    );
  }

  // Load variety for rendimiento
  const { data: varData } = await client
    .from("variedades")
    .select("rendimiento_esperado_por_planta, unidad_rendimiento")
    .eq("id", cultivo.id_variedad)
    .single();
  const rendimiento = (varData as Variedad | null)?.rendimiento_esperado_por_planta ?? null;

  // Delete existing
  const { error: delErr } = await client
    .from("ciclos_cultivo")
    .delete()
    .eq("id_cultivo", cultivo.id);
  if (delErr) throw delErr;

  // Build new rows
  const rows = (plantilla as Array<{
    nombre_ciclo: string;
    nro_semana: number;
    porcentaje_produccion: number;
  }>).map((p, i) => {
    const tasa = p.porcentaje_produccion / 100;
    const cantidad =
      rendimiento != null && cultivo.total_plantas != null
        ? Math.round(tasa * rendimiento * cultivo.total_plantas * 10) / 10
        : null;

    return {
      id_cultivo: cultivo.id,
      consecutivo: i + 1,
      ciclo_produccion: p.nombre_ciclo,
      nro_semana: p.nro_semana,
      fecha_planeada: addWeeks(cultivo.fecha_inicio, p.nro_semana),
      tasa_produccion: tasa,
      cantidad_planeada: cantidad,
      estado: "Pendiente",
    };
  });

  const { error: insErr } = await client.from("ciclos_cultivo").insert(rows);
  if (insErr) throw insErr;

  return { count: rows.length };
}

// ── getActividadesSources ─────────────────────────────────────────────────────

/**
 * Checks which activity sources are available for a cultivo:
 * - "Variedad": actividades with id_variedad = cultivo.id_variedad
 * - "Clase": actividades with id_clase_cultivo matching the variety's tipo_cultivo
 */
export async function getActividadesSources(
  client: SupabaseClient,
  cultivo: Cultivo,
  variedades: Variedad[],
  clases: ClaseCultivo[],
): Promise<SourceOption[]> {
  const variedad = cultivo.id_variedad
    ? variedades.find((v) => v.id === cultivo.id_variedad)
    : null;

  const sources: SourceOption[] = [];

  if (cultivo.id_variedad) {
    const { data: varActs, error } = await client
      .from("actividades")
      .select("id")
      .eq("id_variedad", cultivo.id_variedad)
      .is("id_clase_cultivo", null);
    if (error) throw error;
    if ((varActs ?? []).length > 0) {
      sources.push({
        type: "Variedad",
        label: `Variedad: ${variedad?.nombre ?? cultivo.id_variedad}`,
        count: (varActs ?? []).length,
      });
    }
  }

  if (variedad?.tipo_cultivo) {
    const clase = clases.find(
      (c) =>
        c.nombre.toUpperCase() === (variedad.tipo_cultivo ?? "").toUpperCase(),
    );
    if (clase) {
      const { data: claseActs, error } = await client
        .from("actividades")
        .select("id")
        .eq("id_clase_cultivo", clase.id)
        .is("id_variedad", null);
      if (error) throw error;
      if ((claseActs ?? []).length > 0) {
        sources.push({
          type: "Clase",
          label: `Clase: ${clase.nombre}`,
          count: (claseActs ?? []).length,
          claseId: clase.id,
        });
      }
    }
  }

  return sources;
}

// ── generarActividadesCultivo ─────────────────────────────────────────────────

/**
 * Materialises `actividades_cultivo` from a template source. Deletes existing rows first.
 */
export async function generarActividadesCultivo(
  client: SupabaseClient,
  cultivo: Cultivo,
  source: SourceOption,
): Promise<{ count: number }> {
  const actividades = await fetchActividadesBySource(client, cultivo, source);
  if (actividades.length === 0) {
    throw new Error("No se encontraron actividades para la fuente seleccionada.");
  }

  const { error: delErr } = await client
    .from("actividades_cultivo")
    .delete()
    .eq("id_cultivo", cultivo.id);
  if (delErr) throw delErr;

  const rows = actividades.map((a, i) => ({
    id_cultivo: cultivo.id,
    id_actividad: a.id,
    consecutivo: i + 1,
    nombre_actividad: a.nombre_actividad,
    nro_semana: a.semana_actividad,
    fecha_planeada: addWeeks(cultivo.fecha_inicio, a.semana_actividad),
    tiempo_requerido_min:
      a.tiempo_por_planta_seg != null && cultivo.total_plantas != null
        ? Math.ceil((a.tiempo_por_planta_seg * cultivo.total_plantas) / 60)
        : null,
    estado: "Pendiente",
  }));

  const { error: insErr } = await client
    .from("actividades_cultivo")
    .insert(rows);
  if (insErr) throw insErr;

  return { count: rows.length };
}

// ── generarInsumosCultivo ─────────────────────────────────────────────────────

/**
 * Materialises `insumos_cultivo` by expanding `insumos_json` from actividades
 * templates. Deletes existing rows first.
 * Insumos rows are linked to `actividades_cultivo` when those rows already exist.
 */
export async function generarInsumosCultivo(
  client: SupabaseClient,
  cultivo: Cultivo,
  source: SourceOption,
): Promise<{ count: number }> {
  const actividades = await fetchActividadesBySource(client, cultivo, source);
  const actividadesConInsumos = actividades.filter(
    (a) => a.requiere_insumos && a.insumos_json && a.insumos_json !== "[]",
  );

  if (actividadesConInsumos.length === 0) {
    throw new Error(
      "No hay actividades con insumos definidos para la fuente seleccionada.",
    );
  }

  // Fetch existing actividades_cultivo to link insumos to them
  const { data: actCultivo } = await client
    .from("actividades_cultivo")
    .select("id, id_actividad")
    .eq("id_cultivo", cultivo.id);
  const actCultivoByActividadId = new Map(
    (actCultivo ?? []).map((r) => [
      (r as { id: string; id_actividad: string }).id_actividad,
      (r as { id: string; id_actividad: string }).id,
    ]),
  );

  // Delete existing
  const { error: delErr } = await client
    .from("insumos_cultivo")
    .delete()
    .eq("id_cultivo", cultivo.id);
  if (delErr) throw delErr;

  const rows: Array<Record<string, unknown>> = [];
  let consecutivo = 1;

  for (const actividad of actividadesConInsumos) {
    let lines: InsumoJsonLine[] = [];
    try {
      lines = JSON.parse(actividad.insumos_json) as InsumoJsonLine[];
    } catch {
      continue;
    }
    if (!Array.isArray(lines)) continue;

    const actCultivoId = actCultivoByActividadId.get(actividad.id) ?? null;

    for (const line of lines) {
      const nombre = line.nombre ?? line.nombre_insumo ?? null;
      const cantidadPorPlanta = line.cantidad_por_planta ?? null;
      const unidad = line.unidad_medida_por_planta ?? line.unidad ?? null;

      rows.push({
        id_cultivo: cultivo.id,
        id_actividad_cultivo: actCultivoId,
        id_insumo: line.id ?? null,
        consecutivo: consecutivo++,
        nombre_insumo: nombre,
        nro_semana: actividad.semana_actividad,
        fecha_planeada: addWeeks(cultivo.fecha_inicio, actividad.semana_actividad),
        cantidad_requerida:
          cantidadPorPlanta != null && cultivo.total_plantas != null
            ? cantidadPorPlanta * cultivo.total_plantas
            : null,
        unidad_medida: unidad,
        estado: "Pendiente",
      });
    }
  }

  if (rows.length === 0) {
    throw new Error(
      "No se pudieron generar insumos: revise que las actividades tengan líneas de insumos definidas.",
    );
  }

  const { error: insErr } = await client.from("insumos_cultivo").insert(rows);
  if (insErr) throw insErr;

  return { count: rows.length };
}

// ── internal helpers ──────────────────────────────────────────────────────────

async function fetchActividadesBySource(
  client: SupabaseClient,
  cultivo: Cultivo,
  source: SourceOption,
): Promise<Actividad[]> {
  const COLS =
    "id, nombre_actividad, semana_actividad, tiempo_por_planta_seg, requiere_insumos, insumos_json";

  if (source.type === "Variedad" && cultivo.id_variedad) {
    const { data, error } = await client
      .from("actividades")
      .select(COLS)
      .eq("id_variedad", cultivo.id_variedad)
      .is("id_clase_cultivo", null)
      .order("semana_actividad", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Actividad[];
  }

  if (source.type === "Clase" && source.claseId) {
    const { data, error } = await client
      .from("actividades")
      .select(COLS)
      .eq("id_clase_cultivo", source.claseId)
      .is("id_variedad", null)
      .order("semana_actividad", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Actividad[];
  }

  return [];
}
