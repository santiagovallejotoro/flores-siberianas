"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSPASassClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/Common/ConfirmProvider";
import Modal from "@/components/Common/Modal";
import Select from "@/components/Common/Select";
import {
  type Actividad,
  type ActividadInput,
  type Categoria,
  CATEGORIAS,
  createActividad,
  deleteActividad,
  listActividadesByClase,
  listActividadesByVariedad,
  updateActividad,
} from "@/lib/farm/actividades";
import type { ClaseCultivo } from "@/lib/farm/clases";
import type { Variedad } from "@/lib/farm/variedades";
import type { Insumo } from "@/lib/farm/insumos";

// ─── Insumo item inside insumos_json ──────────────────────────────────────────
type InsumoItem = {
  id: string;
  nombre: string;
  cantidad_por_planta: number;
  unidad_medida_por_planta: string;
};

const UNIDADES_INSUMO = ["g", "mg", "ml", "L", "kg", "bultos", "unidades"] as const;

function parseInsumosJson(raw: string): InsumoItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((it: InsumoItem) => ({
      id: it.id ?? "",
      nombre: it.nombre ?? "",
      cantidad_por_planta: Number(it.cantidad_por_planta) || 0,
      unidad_medida_por_planta: it.unidad_medida_por_planta || "g",
    }));
  } catch {
    return [];
  }
}

// ─── Filter types ──────────────────────────────────────────────────────────────
type FilterTipo = "clase" | "variedad";

interface ActividadesEditorProps {
  clases: ClaseCultivo[];
  variedades: Variedad[];
  insumos: Insumo[];
}

type Banner = { kind: "success" | "error"; text: string } | null;

// ─── Form state ────────────────────────────────────────────────────────────────
type FormState = {
  nombre_actividad: string;
  semana_actividad: string;
  categoria: Categoria | "";
  tiempo_por_planta_seg: string;
  requiere_insumos: boolean;
  descripcion: string;
  insumos_list: InsumoItem[];
};

const EMPTY_FORM: FormState = {
  nombre_actividad: "",
  semana_actividad: "0",
  categoria: "Mantenimiento",
  tiempo_por_planta_seg: "30",
  requiere_insumos: false,
  descripcion: "",
  insumos_list: [],
};

function fromActividad(a: Actividad): FormState {
  return {
    nombre_actividad: a.nombre_actividad,
    semana_actividad: String(a.semana_actividad),
    categoria: a.categoria ?? "",
    tiempo_por_planta_seg:
      a.tiempo_por_planta_seg != null ? String(a.tiempo_por_planta_seg) : "",
    requiere_insumos: a.requiere_insumos ?? false,
    descripcion: a.descripcion ?? "",
    insumos_list: parseInsumosJson(a.insumos_json),
  };
}

function toInput(
  form: FormState,
  tipo: FilterTipo,
  entidadId: string,
): ActividadInput {
  const num = (v: string) => {
    if (v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };
  return {
    nombre_actividad: form.nombre_actividad.trim(),
    semana_actividad: num(form.semana_actividad) ?? 0,
    categoria: form.categoria === "" ? null : (form.categoria as Categoria),
    tiempo_por_planta_seg: num(form.tiempo_por_planta_seg),
    requiere_insumos: form.requiere_insumos,
    insumos_json: form.requiere_insumos
      ? JSON.stringify(form.insumos_list)
      : "[]",
    descripcion: form.descripcion.trim() || null,
    id_clase_cultivo: tipo === "clase" ? entidadId : null,
    id_variedad: tipo === "variedad" ? entidadId : null,
  };
}

// ─── Inline insumo add-row state ──────────────────────────────────────────────
type InsumoRowState = {
  id: string;
  cantidad: string;
  unidad: string;
};

const EMPTY_INSUMO_ROW: InsumoRowState = { id: "", cantidad: "", unidad: "g" };

// ─── Main component ───────────────────────────────────────────────────────────
export default function ActividadesEditor({
  clases,
  variedades,
  insumos,
}: ActividadesEditorProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();

  const [banner, setBanner] = useState<Banner>(null);
  const [filterTipo, setFilterTipo] = useState<FilterTipo>("clase");
  const [entidadId, setEntidadId] = useState<string>("");
  const [actividades, setActividades] = useState<Actividad[] | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Actividad | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Insumo add-row within modal
  const [insumoRow, setInsumoRow] = useState<InsumoRowState>(EMPTY_INSUMO_ROW);
  const [insumoRowError, setInsumoRowError] = useState<string>("");

  function showBanner(b: Banner) {
    setBanner(b);
    if (b) setTimeout(() => setBanner(null), 3500);
  }

  async function loadActividades(tipo: FilterTipo, id: string) {
    if (!id) {
      setActividades(null);
      return;
    }
    setLoadingList(true);
    try {
      const client = createSPASassClient().getSupabaseClient();
      const rows =
        tipo === "clase"
          ? await listActividadesByClase(client, id)
          : await listActividadesByVariedad(client, id);
      setActividades(rows);
    } catch (err) {
      showBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Error al cargar",
      });
      setActividades([]);
    } finally {
      setLoadingList(false);
    }
  }

  function handleTipoChange(tipo: FilterTipo) {
    setFilterTipo(tipo);
    setEntidadId("");
    setActividades(null);
  }

  function handleEntidadChange(id: string) {
    setEntidadId(id);
    loadActividades(filterTipo, id);
  }

  function openCreate() {
    if (!entidadId) return;
    setEditing(null);
    setForm(EMPTY_FORM);
    setInsumoRow(EMPTY_INSUMO_ROW);
    setInsumoRowError("");
    setModalOpen(true);
  }

  function openEdit(a: Actividad) {
    setEditing(a);
    setForm(fromActividad(a));
    setInsumoRow(EMPTY_INSUMO_ROW);
    setInsumoRowError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ─── Insumo list management ────────────────────────────────────────────────
  function addInsumoRow() {
    setInsumoRowError("");
    if (!insumoRow.id) {
      setInsumoRowError("Seleccione un insumo.");
      return;
    }
    const cantidad = parseFloat(insumoRow.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      setInsumoRowError("Ingrese una cantidad válida.");
      return;
    }
    const insumo = insumos.find((i) => i.id === insumoRow.id);
    if (!insumo) return;
    const newItem: InsumoItem = {
      id: insumo.id,
      nombre: insumo.nombre,
      cantidad_por_planta: cantidad,
      unidad_medida_por_planta: insumoRow.unidad,
    };
    setForm((prev) => ({
      ...prev,
      insumos_list: [...prev.insumos_list, newItem],
    }));
    setInsumoRow(EMPTY_INSUMO_ROW);
  }

  function removeInsumoItem(idx: number) {
    setForm((prev) => ({
      ...prev,
      insumos_list: prev.insumos_list.filter((_, i) => i !== idx),
    }));
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre_actividad.trim()) {
      showBanner({ kind: "error", text: "El nombre es obligatorio." });
      return;
    }
    if (!entidadId) return;

    const client = createSPASassClient().getSupabaseClient();
    setSaving(true);
    try {
      const input = toInput(form, filterTipo, entidadId);
      if (editing) {
        const updated = await updateActividad(client, editing.id, input);
        setActividades((prev) =>
          prev
            ? prev.map((a) => (a.id === editing.id ? updated : a))
            : [updated],
        );
        showBanner({
          kind: "success",
          text: `"${updated.nombre_actividad}" actualizada.`,
        });
      } else {
        const created = await createActividad(client, input);
        setActividades((prev) => (prev ? [...prev, created] : [created]));
        showBanner({
          kind: "success",
          text: `"${created.nombre_actividad}" agregada.`,
        });
      }
      setModalOpen(false);
      startTransition(() => router.refresh());
    } catch (err) {
      showBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Error al guardar",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(a: Actividad) {
    await confirm({
      title: `Eliminar "${a.nombre_actividad}"`,
      description:
        "Esta actividad será eliminada del catálogo. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      tone: "danger",
      onConfirm: async () => {
        const client = createSPASassClient().getSupabaseClient();
        try {
          await deleteActividad(client, a.id);
          setActividades((prev) =>
            prev ? prev.filter((x) => x.id !== a.id) : [],
          );
          showBanner({
            kind: "success",
            text: `"${a.nombre_actividad}" eliminada.`,
          });
          startTransition(() => router.refresh());
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error al eliminar";
          showBanner({ kind: "error", text: msg });
          throw err;
        }
      },
    });
  }

  const entidadLabel =
    filterTipo === "clase"
      ? "Seleccionar Clase de Cultivo"
      : "Seleccionar Variedad";
  const entidadPlaceholder =
    filterTipo === "clase"
      ? "Seleccione una clase…"
      : "Seleccione una variedad…";

  const selectedName =
    filterTipo === "clase"
      ? clases.find((c) => c.id === entidadId)?.nombre
      : variedades.find((v) => v.id === entidadId)?.nombre;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Banner */}
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

      {/* Filter card */}
      <div className="rounded-xl border border-stroke bg-white p-5 dark:border-strokedark dark:bg-dark">
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="Filtrar por"
            value={filterTipo}
            onChange={(e) => handleTipoChange(e.target.value as FilterTipo)}
            wrapperClassName="min-w-[160px]"
          >
            <option value="clase">Clase de Cultivo</option>
            <option value="variedad">Variedad</option>
          </Select>

          <Select
            label={entidadLabel}
            value={entidadId}
            onChange={(e) => handleEntidadChange(e.target.value)}
            wrapperClassName="min-w-[220px] flex-1"
          >
            <option value="">{entidadPlaceholder}</option>
            {filterTipo === "clase"
              ? clases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))
              : variedades.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                    {v.tipo_cultivo ? ` (${v.tipo_cultivo})` : ""}
                  </option>
                ))}
          </Select>
        </div>
      </div>

      {/* Content area */}
      {!entidadId ? (
        <div className="rounded-xl border border-dashed border-stroke bg-white/50 p-12 text-center dark:border-strokedark dark:bg-dark/40">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-body-color/40 dark:text-body-color-dark/40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <p className="text-sm text-body-color dark:text-body-color-dark">
            Selecciona una clase de cultivo o variedad para ver sus actividades.
          </p>
        </div>
      ) : loadingList ? (
        <div className="flex items-center justify-center py-16">
          <svg
            className="h-6 w-6 animate-spin text-primary"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeOpacity="0.25"
            />
            <path
              d="M22 12a10 10 0 0 1-10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {actividades && actividades.length > 0 && (
                <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary dark:bg-primary-500/15 dark:text-primary-300">
                  {actividades.length}{" "}
                  {actividades.length === 1 ? "actividad" : "actividades"}
                </span>
              )}
              {selectedName && (
                <span className="text-sm font-medium text-black dark:text-white">
                  {selectedName}
                </span>
              )}
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
              Nueva actividad
            </button>
          </div>

          {/* Empty / table */}
          {actividades && actividades.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stroke bg-white/50 p-12 text-center dark:border-strokedark dark:bg-dark/40">
              <p className="text-sm text-body-color dark:text-body-color-dark">
                No hay actividades para esta{" "}
                {filterTipo === "clase" ? "clase" : "variedad"}. Crea la
                primera con el botón de arriba.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-stroke dark:border-strokedark">
                    {[
                      "Nombre",
                      "Semana",
                      "Categoría",
                      "Tiempo (seg/planta)",
                      "Insumos",
                      "Descripción",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-color dark:text-body-color-dark"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {(actividades ?? []).map((a) => {
                    const items = parseInsumosJson(a.insumos_json);
                    return (
                      <tr
                        key={a.id}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium text-black dark:text-white">
                          {a.nombre_actividad}
                        </td>
                        <td className="px-4 py-3 text-body-color dark:text-body-color-dark">
                          {a.semana_actividad === 0 ? (
                            <span className="text-xs italic opacity-60">
                              General
                            </span>
                          ) : (
                            `Sem ${a.semana_actividad}`
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {a.categoria ? (
                            <span className="inline-flex items-center rounded-full bg-primary-100/60 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary-500/10 dark:text-primary-300">
                              {a.categoria}
                            </span>
                          ) : (
                            <span className="text-xs italic opacity-40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-body-color dark:text-body-color-dark">
                          {a.tiempo_por_planta_seg != null ? (
                            a.tiempo_por_planta_seg
                          ) : (
                            <span className="text-xs italic opacity-40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {a.requiere_insumos ? (
                            items.length > 0 ? (
                              <div className="space-y-0.5">
                                {items.map((it, i) => (
                                  <div
                                    key={i}
                                    className="text-xs text-body-color dark:text-body-color-dark"
                                  >
                                    <span className="font-medium text-black dark:text-white">
                                      {it.nombre}
                                    </span>{" "}
                                    — {it.cantidad_por_planta}{" "}
                                    {it.unidad_medida_por_planta}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                Sin configurar
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-body-color/50 dark:text-body-color-dark/50">
                              No
                            </span>
                          )}
                        </td>
                        <td className="max-w-xs px-4 py-3 text-xs text-body-color dark:text-body-color-dark">
                          <span className="line-clamp-2">
                            {a.descripcion ?? (
                              <span className="italic opacity-40">—</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(a)}
                              className="rounded-lg border border-stroke px-2.5 py-1.5 text-xs font-medium text-body-color transition-colors hover:border-primary/40 hover:text-primary dark:border-strokedark dark:text-body-color-dark dark:hover:border-primary/30 dark:hover:text-primary-300"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(a)}
                              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-body-color/60 dark:text-body-color-dark/60">
            Semana 0 = actividad general, no asociada a una semana específica.
          </p>
        </div>
      )}

      {/* ─── Create / Edit modal ─────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        title={editing ? "Editar actividad" : "Nueva actividad"}
        description={
          editing
            ? `Actualiza los datos de "${editing.nombre_actividad}".`
            : selectedName
              ? `Nueva actividad para ${filterTipo === "clase" ? "clase" : "variedad"}: ${selectedName}.`
              : "Define una nueva actividad."
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
              form="actividad-form"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeOpacity="0.25"
                  />
                  <path
                    d="M22 12a10 10 0 0 1-10 10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {editing ? "Guardar cambios" : "Crear actividad"}
            </button>
          </>
        }
      >
        <form id="actividad-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <label
                htmlFor="act-nombre"
                className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark"
              >
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="act-nombre"
                type="text"
                required
                autoFocus
                autoComplete="off"
                value={form.nombre_actividad}
                onChange={(e) => setField("nombre_actividad", e.target.value)}
                placeholder="Ej. Riego, Fertilización, Poda"
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
              />
            </div>

            {/* Semana */}
            <div>
              <label
                htmlFor="act-semana"
                className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark"
              >
                Semana de Actividad
              </label>
              <input
                id="act-semana"
                type="number"
                min={0}
                step={1}
                value={form.semana_actividad}
                onChange={(e) => setField("semana_actividad", e.target.value)}
                placeholder="0 = general"
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
              />
              <p className="mt-1 text-xs text-body-color/60 dark:text-body-color-dark/60">
                0 = actividad general
              </p>
            </div>

            {/* Categoría */}
            <Select
              id="act-categoria"
              label="Categoría"
              value={form.categoria}
              onChange={(e) =>
                setField("categoria", e.target.value as Categoria | "")
              }
            >
              <option value="">Sin categoría</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            {/* Tiempo por planta */}
            <div>
              <label
                htmlFor="act-tiempo"
                className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark"
              >
                Tiempo por planta (seg)
              </label>
              <input
                id="act-tiempo"
                type="number"
                min={0}
                step={1}
                value={form.tiempo_por_planta_seg}
                onChange={(e) =>
                  setField("tiempo_por_planta_seg", e.target.value)
                }
                placeholder="Ej. 30"
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
              />
            </div>

            {/* Requiere Insumos toggle */}
            <div className="flex items-center gap-3">
              <input
                id="act-insumos"
                type="checkbox"
                checked={form.requiere_insumos}
                onChange={(e) => {
                  setField("requiere_insumos", e.target.checked);
                  if (!e.target.checked) {
                    setField("insumos_list", []);
                    setInsumoRow(EMPTY_INSUMO_ROW);
                    setInsumoRowError("");
                  }
                }}
                className="h-4 w-4 rounded border-stroke accent-primary"
              />
              <label
                htmlFor="act-insumos"
                className="text-xs font-medium text-body-color dark:text-body-color-dark"
              >
                Requiere insumos
              </label>
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label
                htmlFor="act-descripcion"
                className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark"
              >
                Descripción
              </label>
              <textarea
                id="act-descripcion"
                rows={2}
                value={form.descripcion}
                onChange={(e) => setField("descripcion", e.target.value)}
                placeholder="Descripción opcional de la actividad"
                className="w-full resize-none rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
              />
            </div>
          </div>

          {/* ─── Insumos panel (visible when requiere_insumos = true) ─────── */}
          {form.requiere_insumos && (
            <div className="rounded-xl border border-stroke bg-gray-50/60 p-4 dark:border-strokedark dark:bg-white/5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-body-color dark:text-body-color-dark">
                Insumos por planta
              </p>

              {/* Current list */}
              {form.insumos_list.length > 0 ? (
                <ul className="mb-4 space-y-1.5">
                  {form.insumos_list.map((it, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-stroke bg-white px-3 py-2 text-xs dark:border-strokedark dark:bg-dark"
                    >
                      <span>
                        <span className="font-medium text-black dark:text-white">
                          {it.nombre}
                        </span>
                        <span className="ml-2 text-body-color dark:text-body-color-dark">
                          {it.cantidad_por_planta} {it.unidad_medida_por_planta}
                          /planta
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeInsumoItem(idx)}
                        className="ml-3 rounded p-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Quitar insumo"
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
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4 text-xs italic text-body-color/60 dark:text-body-color-dark/60">
                  Aún no hay insumos. Agrega uno abajo.
                </p>
              )}

              {/* Add row */}
              <div className="border-t border-stroke pt-3 dark:border-strokedark">
                <p className="mb-2 text-xs font-medium text-body-color dark:text-body-color-dark">
                  Agregar insumo
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_90px_90px_auto]">
                  {/* Insumo select */}
                  <Select
                    variant="sm"
                    value={insumoRow.id}
                    onChange={(e) => {
                      setInsumoRow((r) => ({ ...r, id: e.target.value }));
                      setInsumoRowError("");
                    }}
                  >
                    <option value="">Seleccione insumo…</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre}
                        {i.categoria ? ` (${i.categoria})` : ""}
                      </option>
                    ))}
                  </Select>

                  {/* Cantidad */}
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={insumoRow.cantidad}
                    onChange={(e) => {
                      setInsumoRow((r) => ({ ...r, cantidad: e.target.value }));
                      setInsumoRowError("");
                    }}
                    placeholder="Cant."
                    className="rounded-lg border border-stroke bg-white px-3 py-2 text-xs text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
                  />

                  {/* Unidad */}
                  <Select
                    variant="sm"
                    value={insumoRow.unidad}
                    onChange={(e) =>
                      setInsumoRow((r) => ({ ...r, unidad: e.target.value }))
                    }
                  >
                    {UNIDADES_INSUMO.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Select>

                  {/* Add button */}
                  <button
                    type="button"
                    onClick={addInsumoRow}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-600"
                  >
                    <svg
                      width="13"
                      height="13"
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
                    Agregar
                  </button>
                </div>

                {insumoRowError && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                    {insumoRowError}
                  </p>
                )}

                {insumos.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No tienes insumos en tu catálogo. Agrégalos primero en{" "}
                    <a
                      href="/proveedor-portal/farm/catalogos/insumos"
                      className="underline"
                    >
                      Catálogo → Insumos
                    </a>
                    .
                  </p>
                )}
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
