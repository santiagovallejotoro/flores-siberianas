import type { SupabaseClient } from "@supabase/supabase-js";

export const ONBOARDING_STEPS = [
  "configuracion",
  "clases",
  "ubicaciones",
  "variedades",
  "insumos",
  "actividades",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type OnboardingStatus = {
  configuracionDone: boolean;
  clasesCount: number;
  ubicacionesCount: number;
  variedadesCount: number;
  insumosCount: number;
  actividadesCount: number;
  ciclosCount: number;
  /** Required steps done — user can proceed to register cultivos. */
  isComplete: boolean;
};

export async function getOnboardingStatus(
  client: SupabaseClient,
): Promise<OnboardingStatus> {
  const head = (table: string) =>
    client.from(table).select("*", { count: "exact", head: true });

  const [config, clases, ubic, vars, ins, acts, ciclos] = await Promise.all([
    head("configuracion"),
    head("clases_cultivo"),
    head("ubicaciones"),
    head("variedades"),
    head("insumos"),
    head("actividades"),
    head("ciclo_produccion"),
  ]);

  const configuracionDone = (config.count ?? 0) >= 4;
  const clasesCount = clases.count ?? 0;
  const ubicacionesCount = ubic.count ?? 0;
  const variedadesCount = vars.count ?? 0;
  const insumosCount = ins.count ?? 0;
  const actividadesCount = acts.count ?? 0;
  const ciclosCount = ciclos.count ?? 0;

  return {
    configuracionDone,
    clasesCount,
    ubicacionesCount,
    variedadesCount,
    insumosCount,
    actividadesCount,
    ciclosCount,
    isComplete:
      configuracionDone &&
      clasesCount > 0 &&
      ubicacionesCount > 0 &&
      variedadesCount > 0 &&
      ciclosCount > 0,
  };
}
