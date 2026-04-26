import type { SupabaseClient } from "@supabase/supabase-js";

export type Insumo = {
  id: string;
  nombre: string;
  categoria: string | null;
  unidad_medida: string | null;
  valor_unitario: number | null;
  proveedor_nombre: string | null;
  fecha_ultima_compra: string | null;
  stock_minimo: number | null;
  observaciones: string | null;
  created_at: string;
};

export type InsumoInput = {
  nombre: string;
  categoria?: string | null;
  unidad_medida?: string | null;
  valor_unitario?: number | null;
  proveedor_nombre?: string | null;
  fecha_ultima_compra?: string | null;
  stock_minimo?: number | null;
  observaciones?: string | null;
};

export const INSUMO_CATEGORIAS = [
  "Fungicida",
  "Insecticida",
  "Herbicida",
  "Fertilizante",
  "Abonos",
  "Herramientas",
  "Maquinaria y Equipo",
  "Dotación",
  "Otros",
] as const;

export const INSUMO_UNIDADES = [
  "kg",
  "g",
  "lb",
  "oz",
  "tonelada",
  "L",
  "ml",
  "litros",
  "galones",
  "m³",
  "hectolitro",
  "ha",
  "unidades",
  "bultos",
] as const;

const TABLE = "insumos";
const COLS =
  "id, nombre, categoria, unidad_medida, valor_unitario, proveedor_nombre, fecha_ultima_compra, stock_minimo, observaciones, created_at";

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function numOrNull(v: number | null | undefined): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return v;
}

function normalize(values: InsumoInput) {
  return {
    nombre: values.nombre.trim(),
    categoria: trimOrNull(values.categoria),
    unidad_medida: trimOrNull(values.unidad_medida),
    valor_unitario: numOrNull(values.valor_unitario),
    proveedor_nombre: trimOrNull(values.proveedor_nombre),
    fecha_ultima_compra: trimOrNull(values.fecha_ultima_compra),
    stock_minimo: numOrNull(values.stock_minimo),
    observaciones: trimOrNull(values.observaciones),
  };
}

export async function listInsumos(
  client: SupabaseClient,
): Promise<Insumo[]> {
  const { data, error } = await client
    .from(TABLE)
    .select(COLS)
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Insumo[];
}

export async function createInsumo(
  client: SupabaseClient,
  values: InsumoInput,
): Promise<Insumo> {
  const { data, error } = await client
    .from(TABLE)
    .insert(normalize(values))
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Insumo;
}

export async function updateInsumo(
  client: SupabaseClient,
  id: string,
  values: InsumoInput,
): Promise<Insumo> {
  const { data, error } = await client
    .from(TABLE)
    .update(normalize(values))
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Insumo;
}

export async function deleteInsumo(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
