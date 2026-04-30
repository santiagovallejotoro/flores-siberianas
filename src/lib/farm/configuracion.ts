import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfigVar = {
  proveedor_id: string;
  variable: string;
  valor: string;
  descripcion: string | null;
};

export type ConfigMap = Record<string, string>;

// ─── Known variables ──────────────────────────────────────────────────────────

export type KnownVariable =
  | "TASA_CAMBIO"
  | "SMMLV"
  | "JORNAL_DIA"
  | "HORAS_JORNAL";

export const CONFIG_FIELDS: {
  variable: KnownVariable;
  label: string;
  descripcion: string;
  type: "number" | "integer";
  placeholder: string;
  default: string;
}[] = [
  {
    variable: "TASA_CAMBIO",
    label: "Tasa de cambio (USD → COP)",
    descripcion: "Valor del dólar en pesos colombianos",
    type: "number",
    placeholder: "3600",
    default: "3600",
  },
  {
    variable: "SMMLV",
    label: "Salario mínimo mensual legal vigente (COP)",
    descripcion:
      "SMMLV vigente en pesos colombianos, con prestaciones sociales incluidas, o lo que te cuesta realmente",
    type: "integer",
    placeholder: "2800000",
    default: "2800000",
  },
  {
    variable: "JORNAL_DIA",
    label: "Valor jornal por día (COP)",
    descripcion: "Costo de un jornal de trabajo por día",
    type: "integer",
    placeholder: "116000",
    default: "116000",
  },
  {
    variable: "HORAS_JORNAL",
    label: "Horas por jornal",
    descripcion: "Horas de trabajo por jornal diario",
    type: "number",
    placeholder: "8",
    default: "8",
  },
];

const TABLE = "configuracion";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listConfiguracion(
  client: SupabaseClient,
): Promise<ConfigVar[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("proveedor_id, variable, valor, descripcion")
    .order("variable");
  if (error) throw error;
  return (data ?? []) as ConfigVar[];
}

export async function upsertConfigVar(
  client: SupabaseClient,
  variable: string,
  valor: string,
  descripcion?: string | null,
): Promise<ConfigVar> {
  const { data, error } = await client
    .from(TABLE)
    .upsert(
      { variable, valor: valor.trim(), descripcion: descripcion ?? null },
      { onConflict: "proveedor_id,variable" },
    )
    .select("proveedor_id, variable, valor, descripcion")
    .single();
  if (error) throw error;
  return data as ConfigVar;
}

export async function upsertConfigBatch(
  client: SupabaseClient,
  entries: { variable: string; valor: string; descripcion?: string | null }[],
): Promise<void> {
  const rows = entries.map((e) => ({
    variable: e.variable,
    valor: e.valor.trim(),
    descripcion: e.descripcion ?? null,
  }));
  const { error } = await client
    .from(TABLE)
    .upsert(rows, { onConflict: "proveedor_id,variable" });
  if (error) throw error;
}

/** Build a map of variable → valor from a ConfigVar array */
export function toConfigMap(rows: ConfigVar[]): ConfigMap {
  return Object.fromEntries(rows.map((r) => [r.variable, r.valor]));
}

/** Return default ConfigVar rows that should exist for every new proveedor */
export function defaultConfigRows(): {
  variable: string;
  valor: string;
  descripcion: string;
}[] {
  return CONFIG_FIELDS.map((f) => ({
    variable: f.variable,
    valor: f.default,
    descripcion: f.descripcion,
  }));
}
