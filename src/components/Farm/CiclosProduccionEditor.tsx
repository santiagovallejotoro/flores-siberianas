"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSPASassClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/Common/ConfirmProvider";
import {
  type CicloProduccion,
  actualizarCiclosBatch,
  deleteAllCiclosByVariedad,
  deleteCiclo,
  generarCiclosProduccion,
  listCiclosByVariedad,
} from "@/lib/farm/ciclos";
import type { Variedad } from "@/lib/farm/variedades";
import Select from "@/components/Common/Select";

interface CiclosProduccionEditorProps {
  variedades: Variedad[];
  initialVariedadId: string | null;
  initialCiclos: CicloProduccion[];
}

type Banner = { kind: "success" | "error"; text: string } | null;

type RowState = {
  id: string;
  nombre_ciclo: string;
  nro_semana: string;
  porcentaje_produccion: string;
  descripcion: string;
  actividades_semana: string;
};

function rowFromCiclo(c: CicloProduccion): RowState {
  return {
    id: c.id,
    nombre_ciclo: c.nombre_ciclo,
    nro_semana: String(c.nro_semana),
    porcentaje_produccion: String(c.porcentaje_produccion),
    descripcion: c.descripcion ?? "",
    actividades_semana: c.actividades_semana ?? "",
  };
}

function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return fallback;
}

const inputCls =
  "w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white";

export default function CiclosProduccionEditor({
  variedades,
  initialVariedadId,
  initialCiclos,
}: CiclosProduccionEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirm();

  const [variedadId, setVariedadId] = useState<string>(initialVariedadId ?? "");
  const [rows, setRows] = useState<RowState[]>(initialCiclos.map(rowFromCiclo));
  const [banner, setBanner] = useState<Banner>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [, startTransition] = useTransition();

  const variedad = useMemo(
    () => variedades.find((v) => v.id === variedadId) ?? null,
    [variedades, variedadId],
  );

  const totalPct = useMemo(() => {
    return rows.reduce(
      (acc, r) => acc + (parseFloat(r.porcentaje_produccion) || 0),
      0,
    );
  }, [rows]);
  const pctOk = Math.abs(totalPct - 100) < 0.1;
  const maxPct = useMemo(() => Math.max(...rows.map(r => parseFloat(r.porcentaje_produccion) || 0), 0), [rows]);

  function showBanner(b: Banner) {
    setBanner(b);
    if (b) setTimeout(() => setBanner(null), 3500);
  }

  async function loadCiclos(id: string) {
    if (!id) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const client = createSPASassClient().getSupabaseClient();
      const data = await listCiclosByVariedad(client, id);
      setRows(data.map(rowFromCiclo));
    } catch (e) {
      showBanner({
        kind: "error",
        text: errorMessage(e, "No se pudieron cargar los ciclos"),
      });
    } finally {
      setLoading(false);
    }
  }

  function handleVariedadChange(next: string) {
    setVariedadId(next);
    // Update URL so the picked variedad is shareable / refresh-stable.
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next) params.set("variedad", next);
    else params.delete("variedad");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
    void loadCiclos(next);
  }

  // Re-load when initialVariedadId changes via the prop (e.g., navigation back).
  useEffect(() => {
    if (initialVariedadId && initialVariedadId !== variedadId) {
      setVariedadId(initialVariedadId);
      void loadCiclos(initialVariedadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialVariedadId]);

  function setRowField(idx: number, field: keyof RowState, value: string) {
    setRows((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function ordenSemanasOk(): boolean {
    for (let i = 1; i < rows.length; i++) {
      const prev = parseInt(rows[i - 1].nro_semana, 10) || 0;
      const cur = parseInt(rows[i].nro_semana, 10) || 0;
      if (cur <= prev) return false;
    }
    return true;
  }

  async function persistAll() {
    const client = createSPASassClient().getSupabaseClient();
    setSaving(true);
    try {
      await actualizarCiclosBatch(
        client,
        rows.map((r) => ({
          id: r.id,
          values: {
            nombre_ciclo: r.nombre_ciclo,
            nro_semana: parseInt(r.nro_semana, 10) || 0,
            porcentaje_produccion: parseFloat(r.porcentaje_produccion) || 0,
            descripcion: r.descripcion,
            actividades_semana: r.actividades_semana,
          },
        })),
      );
      showBanner({
        kind: "success",
        text: `${rows.length} ciclos actualizados.`,
      });
      startTransition(() => router.refresh());
    } catch (e) {
      showBanner({
        kind: "error",
        text: errorMessage(e, "Error al guardar cambios"),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!ordenSemanasOk()) {
      showBanner({
        kind: "error",
        text: "Las semanas deben estar en orden ascendente.",
      });
      return;
    }
    if (!pctOk) {
      const ok = await confirm({
        title: "Suma de porcentajes incorrecta",
        description: `La suma actual es ${totalPct.toFixed(
          1,
        )}% y debería ser 100%. ¿Guardar de todas formas?`,
        confirmLabel: "Guardar igual",
        tone: "warning",
      });
      if (!ok) return;
    }
    await persistAll();
  }

  async function runGenerar(opts: { regenerate: boolean }) {
    if (!variedad) {
      showBanner({ kind: "error", text: "Selecciona una variedad." });
      return;
    }
    const ok = await confirm({
      title: opts.regenerate ? "Regenerar ciclos" : "Generar ciclos",
      description: opts.regenerate
        ? "Se eliminarán los ciclos actuales y se reemplazarán por una nueva distribución automática (más corte en el pico del ciclo, menos al inicio y al final). Esta acción no se puede deshacer."
        : "Se generarán automáticamente los ciclos a partir del Ciclo en Semanas y la Semana Inicio Corte de la variedad.",
      confirmLabel: opts.regenerate ? "Regenerar" : "Generar",
      tone: opts.regenerate ? "danger" : "info",
    });
    if (!ok) return;

    const client = createSPASassClient().getSupabaseClient();
    setGenerating(true);
    try {
      const result = await generarCiclosProduccion(client, variedad);
      setRows(result.ciclos.map(rowFromCiclo));
      showBanner({
        kind: "success",
        text: `${result.numCortes} ciclos ${
          opts.regenerate ? "regenerados" : "generados"
        }.`,
      });
      startTransition(() => router.refresh());
    } catch (e) {
      showBanner({
        kind: "error",
        text: errorMessage(e, "Error al generar ciclos"),
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteRow(idx: number) {
    const r = rows[idx];
    const ok = await confirm({
      title: `Eliminar "${r.nombre_ciclo || `Semana ${r.nro_semana}`}"`,
      description:
        "Se eliminará esta etapa de producción. La suma de porcentajes ya no será 100%.",
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!ok) return;
    const client = createSPASassClient().getSupabaseClient();
    try {
      await deleteCiclo(client, r.id);
      setRows((prev) => prev.filter((_, i) => i !== idx));
      showBanner({ kind: "success", text: "Ciclo eliminado." });
      startTransition(() => router.refresh());
    } catch (e) {
      showBanner({
        kind: "error",
        text: errorMessage(e, "Error al eliminar"),
      });
    }
  }

  async function handleDeleteAll() {
    if (!variedadId || rows.length === 0) return;
    const ok = await confirm({
      title: "Eliminar todos los ciclos",
      description: `Se eliminarán los ${rows.length} ciclos de "${variedad?.nombre ?? "esta variedad"}". Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar todos",
      tone: "danger",
    });
    if (!ok) return;
    const client = createSPASassClient().getSupabaseClient();
    setSaving(true);
    try {
      await deleteAllCiclosByVariedad(client, variedadId);
      setRows([]);
      showBanner({ kind: "success", text: "Todos los ciclos fueron eliminados." });
      startTransition(() => router.refresh());
    } catch (e) {
      showBanner({ kind: "error", text: errorMessage(e, "Error al eliminar") });
    } finally {
      setSaving(false);
    }
  }

  const canGenerate =
    !!variedad &&
    (variedad.ciclo_en_semanas ?? 0) > 0 &&
    (variedad.semana_inicio_corte ?? 0) > 0 &&
    (variedad.semana_inicio_corte ?? 0) <= (variedad.ciclo_en_semanas ?? 0);

  return (
    <div className="space-y-6">
      {banner && (
        <div
          role="status"
          className={[
            "rounded-lg border px-4 py-3 text-sm",
            banner.kind === "success"
              ? "border-primary-100 bg-primary-100/50 text-primary-600 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
          ].join(" ")}
        >
          {banner.text}
        </div>
      )}

      {/* Variety picker */}
      <section className="rounded-xl border border-stroke bg-white p-5 dark:border-strokedark dark:bg-dark">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <Select
              id="variedad-select"
              label="Seleccionar variedad"
              value={variedadId}
              onChange={(e) => handleVariedadChange(e.target.value)}
            >
              <option value="">Seleccione una variedad…</option>
              {variedades.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                  {v.tipo_cultivo ? ` — ${v.tipo_cultivo}` : ""}
                </option>
              ))}
            </Select>
            {variedad && (
              <p className="mt-2 text-xs text-body-color/80 dark:text-body-color-dark/70">
                Ciclo:{" "}
                <span className="font-medium text-black dark:text-white">
                  {variedad.ciclo_en_semanas ?? "—"} sem
                </span>
                {" · "}
                Inicio corte:{" "}
                <span className="font-medium text-black dark:text-white">
                  {variedad.semana_inicio_corte != null
                    ? `Sem ${variedad.semana_inicio_corte}`
                    : "—"}
                </span>
              </p>
            )}
          </div>
          {variedad && rows.length > 0 && (
            <button
              type="button"
              onClick={() => runGenerar({ regenerate: true })}
              disabled={!canGenerate || generating || saving}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium text-body-color transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-strokedark dark:bg-dark dark:text-body-color-dark dark:hover:border-primary/30 dark:hover:text-primary-300"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
              </svg>
              Regenerar
            </button>
          )}
        </div>
      </section>

      {/* Body */}
      {!variedadId ? (
        <div className="rounded-xl border border-dashed border-stroke bg-white/50 p-12 text-center dark:border-strokedark dark:bg-dark/40">
          <p className="text-sm text-body-color dark:text-body-color-dark">
            Elige una variedad para ver o generar sus ciclos de producción.
          </p>
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-stroke bg-white p-12 text-center dark:border-strokedark dark:bg-dark">
          <p className="text-sm text-body-color dark:text-body-color-dark">
            Cargando ciclos…
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-10 text-center dark:border-amber-500/40 dark:bg-amber-500/10">
          <h3 className="text-base font-semibold text-amber-800 dark:text-amber-300">
            Sin ciclos de producción
          </h3>
          <p className="mt-1 text-sm text-amber-700/90 dark:text-amber-300/80">
            Esta variedad aún no tiene ciclos definidos. Pulsa generar para repartir el corte semana a semana:
            más cosecha en las semanas de plena producción y menos al arranque y al cierre, según el ciclo y la
            semana de inicio de corte de la variedad.
          </p>
          {!canGenerate && variedad && (
            <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-300/70">
              Define <strong>Ciclo en Semanas</strong> y{" "}
              <strong>Semana Inicio Corte</strong> en la variedad para habilitar
              la generación.
            </p>
          )}
          <button
            type="button"
            onClick={() => runGenerar({ regenerate: false })}
            disabled={!canGenerate || generating}
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? "Generando…" : "Generar ciclos"}
          </button>
        </div>
      ) : (
        <>
          {/* Sticky Progress Bar */}
          <div
            className={[
              "flex flex-col gap-3 rounded-xl border p-4 shadow-sm backdrop-blur-md transition-all duration-300 sm:flex-row sm:items-center sm:justify-between",
              pctOk
                ? "border-primary-100 bg-primary-100/90 dark:border-primary-500/30 dark:bg-primary-500/10"
                : totalPct > 100
                  ? "border-red-200 bg-red-50/90 dark:border-red-500/30 dark:bg-red-500/10"
                  : "border-amber-200 bg-amber-50/90 dark:border-amber-500/30 dark:bg-amber-500/10",
            ].join(" ")}
          >
            <div className="flex w-full flex-col gap-2 sm:w-1/2">
               <div className="flex items-center justify-between text-sm">
                 <span className="font-semibold text-black dark:text-white">
                   Progreso Total (100%)
                 </span>
                 <span
                   className={[
                     "tabular-nums font-bold",
                     pctOk
                       ? "text-primary-600 dark:text-primary-300"
                       : totalPct > 100
                         ? "text-red-700 dark:text-red-300"
                         : "text-amber-700 dark:text-amber-300",
                   ].join(" ")}
                 >
                   {totalPct.toFixed(1)}%
                 </span>
               </div>
               <div className="h-2 w-full overflow-hidden rounded-full bg-stroke dark:bg-strokedark">
                 <div
                   className={`h-full rounded-full transition-all duration-500 ${
                     pctOk
                       ? "bg-primary"
                       : totalPct > 100
                         ? "bg-red-500"
                         : "bg-amber-500"
                   }`}
                   style={{ width: `${Math.min(100, Math.max(0, totalPct))}%` }}
                 ></div>
               </div>
            </div>
            
            <div className="mt-2 flex items-center gap-2 sm:mt-0">
               {/* VIEW TOGGLE */}
               <div className="hidden items-center rounded-lg border border-stroke bg-gray-50/50 p-1 dark:border-strokedark dark:bg-dark md:flex mr-2">
                 <button
                   type="button"
                   onClick={() => setViewMode("table")}
                   className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                     viewMode === "table"
                       ? "bg-white text-black shadow-sm dark:bg-white/10 dark:text-white"
                       : "text-body-color hover:text-black dark:text-body-color-dark dark:hover:text-white"
                   }`}
                 >
                   Tabla
                 </button>
                 <button
                   type="button"
                   onClick={() => setViewMode("card")}
                   className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                     viewMode === "card"
                       ? "bg-white text-black shadow-sm dark:bg-white/10 dark:text-white"
                       : "text-body-color hover:text-black dark:text-body-color-dark dark:hover:text-white"
                   }`}
                 >
                   Tarjetas
                 </button>
               </div>
               
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={saving || generating}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
                Vaciar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || generating}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                Guardar cambios
              </button>
            </div>
          </div>

          {/* Table View (Desktop Only) */}
          <div className={`mt-6 ${viewMode === "table" ? "hidden md:block" : "hidden"} rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark`}>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="min-w-[600px] w-full text-sm">
                <thead>
                  <tr className="border-b border-stroke bg-gray-50/60 text-left text-xs uppercase tracking-wide text-body-color dark:border-strokedark dark:bg-white/5 dark:text-body-color-dark">
                    <th className="px-3 py-2 font-medium min-w-[150px]">Nombre</th>
                    <th className="px-3 py-2 font-medium min-w-[100px]">Semana</th>
                    <th className="px-3 py-2 font-medium min-w-[120px]">% Producción</th>
                    <th className="px-3 py-2 font-medium min-w-[200px]">Descripción</th>
                    <th className="w-14 px-3 py-2 font-medium" aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {rows.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          value={r.nombre_ciclo}
                          onChange={(e) => setRowField(idx, "nombre_ciclo", e.target.value)}
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={r.nro_semana}
                          onChange={(e) => setRowField(idx, "nro_semana", e.target.value)}
                          className={`${inputCls} tabular-nums`}
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={r.porcentaje_produccion}
                          onChange={(e) => setRowField(idx, "porcentaje_produccion", e.target.value)}
                          className={`${inputCls} tabular-nums`}
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          value={r.descripcion}
                          onChange={(e) => setRowField(idx, "descripcion", e.target.value)}
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          aria-label={`Eliminar ${r.nombre_ciclo}`}
                          className="rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card Grid / Timeline */}
          <div className={`mt-6 ${viewMode === "table" ? "grid md:hidden" : "grid"} grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}>
            {rows.map((r, idx) => {
              const val = parseFloat(r.porcentaje_produccion) || 0;
              const barWidth = maxPct > 0 ? (val / maxPct) * 100 : 0;
              
              return (
                <div
                  key={r.id}
                  className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-stroke bg-white p-3.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md dark:border-strokedark dark:bg-dark"
                >
                  {/* Background progress indicator (subtle) */}
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-700 dark:bg-primary/40" 
                    style={{ width: `${barWidth}%` }}
                  ></div>

                  <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-strokedark">
                    <input
                      type="text"
                      value={r.nombre_ciclo}
                      onChange={(e) => setRowField(idx, "nombre_ciclo", e.target.value)}
                      className="w-full max-w-[120px] bg-transparent text-sm font-semibold text-black placeholder-body-color/50 outline-none focus:border-b focus:border-primary dark:text-white dark:placeholder-body-color-dark/50"
                      placeholder="Nombre (ej. V1)"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      aria-label={`Eliminar ${r.nombre_ciclo}`}
                      className="rounded-full bg-red-50 p-1.5 text-red-500 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Semana</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={r.nro_semana}
                        onChange={(e) => setRowField(idx, "nro_semana", e.target.value)}
                        className="tabular-nums w-full rounded-lg border border-stroke bg-gray-50 px-2.5 py-1.5 text-sm font-medium text-black outline-none transition-colors focus:border-primary focus:bg-white dark:border-strokedark dark:bg-white/5 dark:text-white dark:focus:bg-dark"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">% Prod</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          inputMode="decimal"
                          value={r.porcentaje_produccion}
                          onChange={(e) => setRowField(idx, "porcentaje_produccion", e.target.value)}
                          className="tabular-nums w-full rounded-lg border border-stroke bg-gray-50 py-1.5 pl-2.5 pr-7 text-sm font-bold text-primary outline-none transition-colors focus:border-primary focus:bg-white dark:border-strokedark dark:bg-white/5 dark:text-primary-300 dark:focus:bg-dark"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-body-color/50 dark:text-body-color-dark/50">%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={r.descripcion}
                      onChange={(e) => setRowField(idx, "descripcion", e.target.value)}
                      className="w-full rounded-lg border border-transparent bg-gray-50/50 px-2.5 py-1.5 text-xs text-black outline-none transition-colors focus:border-stroke focus:bg-white dark:bg-white/5 dark:text-white dark:focus:border-strokedark dark:focus:bg-dark"
                      placeholder="Nota opcional..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 px-2 text-xs text-body-color/80 dark:text-body-color-dark/70">
            Edita los valores en las tarjetas y pulsa <strong>Guardar cambios</strong>.
            Las semanas deben quedar en orden ascendente y la suma de
            porcentajes debe ser 100%.
          </p>
        </>
      )}
    </div>
  );
}
