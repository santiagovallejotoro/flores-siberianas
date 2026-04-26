"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSPASassClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/Common/ConfirmProvider";
import Modal from "@/components/Common/Modal";
import {
  type Variedad,
  type VariedadInput,
  type UnidadRendimiento,
  createVariedad,
  deleteVariedad,
  updateVariedad,
} from "@/lib/farm/variedades";
import { generarCiclosProduccion } from "@/lib/farm/ciclos";
import type { ClaseCultivo } from "@/lib/farm/clases";
import type { Ubicacion } from "@/lib/farm/ubicaciones";
import Select from "@/components/Common/Select";

interface VariedadesEditorProps {
  initialVariedades: Variedad[];
  clases: ClaseCultivo[];
  ubicaciones: Ubicacion[];
}

type Banner = { kind: "success" | "error"; text: string } | null;

const UNIDADES: UnidadRendimiento[] = ["Tallo", "kg", "unidades", "lb"];

const EMPTY_FORM: VariedadInput = {
  nombre: "",
  tipo_cultivo: "",
  id_ubicacion: "",
  ciclo_en_semanas: null,
  semana_inicio_corte: null,
  rendimiento_esperado_por_planta: null,
  unidad_rendimiento: "Tallo",
  observaciones: "",
};

export default function VariedadesEditor({
  initialVariedades,
  clases,
  ubicaciones,
}: VariedadesEditorProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [variedades, setVariedades] = useState<Variedad[]>(initialVariedades);
  const [banner, setBanner] = useState<Banner>(null);
  const [, startTransition] = useTransition();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Variedad | null>(null);
  const [form, setForm] = useState<VariedadInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const ubicacionById = useMemo(() => {
    const m = new Map<string, Ubicacion>();
    for (const u of ubicaciones) m.set(u.id, u);
    return m;
  }, [ubicaciones]);

  function showBanner(b: Banner) {
    setBanner(b);
    if (b) setTimeout(() => setBanner(null), 3500);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(v: Variedad) {
    setEditing(v);
    setForm({
      nombre: v.nombre,
      tipo_cultivo: v.tipo_cultivo ?? "",
      id_ubicacion: v.id_ubicacion ?? "",
      ciclo_en_semanas: v.ciclo_en_semanas,
      semana_inicio_corte: v.semana_inicio_corte,
      rendimiento_esperado_por_planta: v.rendimiento_esperado_por_planta,
      unidad_rendimiento: v.unidad_rendimiento ?? "Tallo",
      observaciones: v.observaciones ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  function setField<K extends keyof VariedadInput>(
    key: K,
    value: VariedadInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setNumberField(
    key: "ciclo_en_semanas" | "semana_inicio_corte" | "rendimiento_esperado_por_planta",
    raw: string,
  ) {
    if (raw === "") return setField(key, null);
    const n = Number(raw);
    setField(key, Number.isNaN(n) ? null : n);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      showBanner({ kind: "error", text: "El nombre es obligatorio." });
      return;
    }

    const client = createSPASassClient().getSupabaseClient();
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateVariedad(client, editing.id, form);
        setVariedades((prev) =>
          prev
            .map((v) => (v.id === editing.id ? updated : v))
            .sort((a, b) => a.nombre.localeCompare(b.nombre)),
        );
        showBanner({ kind: "success", text: `Variedad "${updated.nombre}" actualizada.` });
      } else {
        const created = await createVariedad(client, form);
        setVariedades((prev) =>
          [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)),
        );
        showBanner({ kind: "success", text: `Variedad "${created.nombre}" agregada.` });
      }
      setModalOpen(false);
      startTransition(() => router.refresh());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      showBanner({ kind: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(v: Variedad) {
    await confirm({
      title: `Eliminar "${v.nombre}"`,
      description:
        "Esto también eliminará los ciclos de producción y actividades asociadas a esta variedad. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      tone: "danger",
      onConfirm: async () => {
        const client = createSPASassClient().getSupabaseClient();
        try {
          await deleteVariedad(client, v.id);
          setVariedades((prev) => prev.filter((x) => x.id !== v.id));
          showBanner({ kind: "success", text: `"${v.nombre}" eliminada.` });
          startTransition(() => router.refresh());
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error al eliminar";
          showBanner({ kind: "error", text: msg });
          throw err;
        }
      },
    });
  }

  async function handleGenerarCiclos() {
    if (!editing) return;
    const canGenerate =
      (editing.ciclo_en_semanas ?? 0) > 0 &&
      (editing.semana_inicio_corte ?? 0) > 0 &&
      (editing.semana_inicio_corte ?? 0) < (editing.ciclo_en_semanas ?? 0);

    if (!canGenerate) {
      showBanner({
        kind: "error",
        text: "Define Ciclo en Semanas y Semana Inicio Corte antes de generar los ciclos.",
      });
      return;
    }

    const ok = await confirm({
      title: "Generar ciclos",
      description:
        "Se generarán automáticamente los ciclos a partir del Ciclo en Semanas y la Semana Inicio Corte de la variedad.",
      confirmLabel: "Generar",
      tone: "info",
    });
    if (!ok) return;

    const client = createSPASassClient().getSupabaseClient();
    setGenerating(true);
    try {
      const result = await generarCiclosProduccion(client, editing);
      const updated = { ...editing, tiene_ciclos_produccion: true };
      setEditing(updated);
      setVariedades((prev) =>
        prev.map((v) => (v.id === editing.id ? updated : v)),
      );
      showBanner({
        kind: "success",
        text: `${result.numCortes} ciclos generados para "${editing.nombre}".`,
      });
      startTransition(() => router.refresh());
    } catch (err) {
      showBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Error al generar ciclos",
      });
    } finally {
      setGenerating(false);
    }
  }

  const ubicacionLabel = (u: Ubicacion) => {
    const left = u.nombre_cultivo ?? u.vereda ?? "Sin nombre";
    const right = u.nombre_cultivo && u.vereda ? ` — ${u.vereda}` : "";
    return `${left}${right}`;
  };

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

      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary dark:bg-primary-500/15 dark:text-primary-300">
            {variedades.length} {variedades.length === 1 ? "variedad" : "variedades"}
          </span>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva variedad
        </button>
      </div>

      {/* Empty / list */}
      {variedades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stroke bg-white/50 p-12 text-center dark:border-strokedark dark:bg-dark/40">
          <p className="text-sm text-body-color dark:text-body-color-dark">
            Aún no tienes variedades. Crea la primera con el botón de arriba.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {variedades.map((v) => {
            const ubic = v.id_ubicacion ? ubicacionById.get(v.id_ubicacion) : null;
            return (
              <li
                key={v.id}
                className="flex flex-col rounded-xl border border-stroke bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-strokedark dark:bg-dark"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-black dark:text-white">
                      {v.nombre}
                    </h3>
                    {v.tipo_cultivo && (
                      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-primary dark:text-primary-300">
                        {v.tipo_cultivo}
                      </p>
                    )}
                  </div>

                  {/* Ciclos status badge — Siberian Purple per brand */}
                  {v.tiene_ciclos_produccion ? (
                    <span
                      title="Esta variedad tiene ciclos de producción definidos"
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-1 text-[11px] font-semibold text-secondary-600 dark:bg-secondary-500/10 dark:text-secondary-400"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Ciclos
                    </span>
                  ) : (
                    <span
                      title="Sin ciclos de producción definidos"
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Sin ciclos
                    </span>
                  )}
                </div>

                <dl className="mb-4 grid flex-1 grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-body-color/70 dark:text-body-color-dark/60">Ciclo</dt>
                    <dd className="mt-0.5 font-medium text-black dark:text-white">
                      {v.ciclo_en_semanas != null ? `${v.ciclo_en_semanas} sem` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-body-color/70 dark:text-body-color-dark/60">Inicio corte</dt>
                    <dd className="mt-0.5 font-medium text-black dark:text-white">
                      {v.semana_inicio_corte != null ? `Sem ${v.semana_inicio_corte}` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-body-color/70 dark:text-body-color-dark/60">Rendimiento</dt>
                    <dd className="mt-0.5 font-medium text-black dark:text-white">
                      {v.rendimiento_esperado_por_planta != null
                        ? `${v.rendimiento_esperado_por_planta} ${v.unidad_rendimiento ?? ""}`.trim()
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-body-color/70 dark:text-body-color-dark/60">Ubicación</dt>
                    <dd className="mt-0.5 truncate font-medium text-black dark:text-white">
                      {ubic ? (ubic.nombre_cultivo ?? ubic.vereda ?? "—") : "—"}
                    </dd>
                  </div>
                </dl>

                <div className="flex gap-2 border-t border-stroke pt-3 dark:border-strokedark">
                  <button
                    type="button"
                    onClick={() => openEdit(v)}
                    className="flex-1 rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-body-color transition-colors hover:border-primary/40 hover:text-primary dark:border-strokedark dark:text-body-color-dark dark:hover:border-primary/30 dark:hover:text-primary-300"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(v)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Editor modal */}
      <Modal
        open={modalOpen}
        title={editing ? "Editar variedad" : "Nueva variedad"}
        description={
          editing
            ? `Actualiza los datos de "${editing.nombre}".`
            : "Define una nueva variedad con su ciclo y rendimiento esperado."
        }
        onClose={closeModal}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-body-color hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-strokedark dark:bg-dark dark:text-body-color-dark dark:hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="variedad-form"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {editing ? "Guardar cambios" : "Crear variedad"}
            </button>
          </>
        }
      >
        <form id="variedad-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <label htmlFor="nombre" className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                placeholder="Hortensia Verena"
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
                autoComplete="off"
                autoFocus
              />
            </div>

            {/* Tipo de Cultivo */}
            <Select
              id="tipo"
              label="Tipo de Cultivo"
              value={form.tipo_cultivo ?? ""}
              onChange={(e) => setField("tipo_cultivo", e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {clases.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </Select>

            {/* Ubicación */}
            <Select
              id="ubicacion"
              label="Ubicación típica"
              value={form.id_ubicacion ?? ""}
              onChange={(e) => setField("id_ubicacion", e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id}>
                  {ubicacionLabel(u)}
                </option>
              ))}
            </Select>

            {/* Ciclo en semanas */}
            <div>
              <label htmlFor="ciclo" className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark">
                Ciclo en semanas
              </label>
              <input
                id="ciclo"
                type="number"
                min={1}
                step={1}
                value={form.ciclo_en_semanas ?? ""}
                onChange={(e) => setNumberField("ciclo_en_semanas", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
              />
            </div>

            {/* Semana inicio corte */}
            <div>
              <label htmlFor="inicio" className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark">
                Semana inicio corte
              </label>
              <input
                id="inicio"
                type="number"
                min={1}
                step={1}
                value={form.semana_inicio_corte ?? ""}
                onChange={(e) => setNumberField("semana_inicio_corte", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
              />
            </div>

            {/* Rendimiento + unidad */}
            <div>
              <label htmlFor="rendimiento" className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark">
                Rendimiento esperado por planta
              </label>
              <input
                id="rendimiento"
                type="number"
                min={0}
                step="0.01"
                value={form.rendimiento_esperado_por_planta ?? ""}
                onChange={(e) =>
                  setNumberField("rendimiento_esperado_por_planta", e.target.value)
                }
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
              />
            </div>

            <Select
              id="unidad"
              label="Unidad"
              value={form.unidad_rendimiento ?? "Tallo"}
              onChange={(e) =>
                setField("unidad_rendimiento", e.target.value as UnidadRendimiento)
              }
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>

            {/* Observaciones */}
            <div className="sm:col-span-2">
              <label htmlFor="observaciones" className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark">
                Observaciones
              </label>
              <textarea
                id="observaciones"
                rows={2}
                value={form.observaciones ?? ""}
                onChange={(e) => setField("observaciones", e.target.value)}
                className="w-full resize-none rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
              />
            </div>
          </div>

          {/*
           * ─── Ciclos de Producción panel ─────────────────────────────────────
           * Visible only when editing an existing variedad.
           *
           * Two states:
           *  - tiene_ciclos_produccion === true  →  "Ciclos de Producción Configurados"
           *    (Siberian Purple panel, "Editar Ciclos" button)
           *  - tiene_ciclos_produccion === false →  "Sin Ciclos de Producción"
           *    (amber panel, "Generar Ciclos" button — disabled if ciclo / inicio
           *    are empty)
           *
           * The action buttons are intentionally disabled for now: they will be
           * wired to /proveedor-portal/farm/catalogos/ciclos once that screen
           * (and the corresponding `generar_ciclos_produccion` Postgres RPC) is
           * built. See PLAN_FARM_TO_PROVEEDORES.md §4.B.
           */}
          {editing && (
            <div className="mt-2 border-t border-stroke pt-4 dark:border-strokedark">
              {editing.tiene_ciclos_produccion ? (
                <div className="rounded-xl border border-secondary-200/60 bg-secondary-100/40 p-4 dark:border-secondary-500/30 dark:bg-secondary-500/10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-secondary-600 dark:text-secondary-400">
                        Ciclos de Producción Configurados
                      </p>
                      <p className="mt-0.5 text-xs text-body-color dark:text-body-color-dark">
                        Esta variedad tiene ciclos de producción definidos.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        router.push(
                          `/proveedor-portal/farm/catalogos/ciclos?variedad=${editing!.id}`,
                        );
                      }}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-secondary-600 dark:bg-secondary"
                    >
                      Editar ciclos
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-amber-700 dark:text-amber-300">
                        Sin Ciclos de Producción
                      </p>
                      <p className="mt-0.5 text-xs text-body-color dark:text-body-color-dark">
                        Genera la distribución bell-curve a partir del ciclo y la semana de inicio de corte.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerarCiclos}
                      disabled={generating || saving}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {generating && (
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      )}
                      {generating ? "Generando…" : "Generar ciclos"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
