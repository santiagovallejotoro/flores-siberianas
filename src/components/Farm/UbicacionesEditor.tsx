"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSPASassClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/Common/ConfirmProvider";
import {
  type Ubicacion,
  type UbicacionInput,
  createUbicacion,
  deleteUbicacion,
  updateUbicacion,
} from "@/lib/farm/ubicaciones";

interface UbicacionesEditorProps {
  initialUbicaciones: Ubicacion[];
}

type Banner = { kind: "success" | "error"; text: string } | null;

type FormState = {
  nombre_cultivo: string;
  vereda: string;
  municipio: string;
  area_m2: string;
  observaciones: string;
};

const EMPTY_FORM: FormState = {
  nombre_cultivo: "",
  vereda: "",
  municipio: "",
  area_m2: "",
  observaciones: "",
};

function toInput(form: FormState): UbicacionInput {
  const area = form.area_m2.trim();
  const parsed = area === "" ? null : Number(area);
  return {
    nombre_cultivo: form.nombre_cultivo,
    vereda: form.vereda,
    municipio: form.municipio,
    area_m2: parsed,
    observaciones: form.observaciones,
  };
}

function fromUbicacion(u: Ubicacion): FormState {
  return {
    nombre_cultivo: u.nombre_cultivo ?? "",
    vereda: u.vereda ?? "",
    municipio: u.municipio ?? "",
    area_m2: u.area_m2 == null ? "" : String(u.area_m2),
    observaciones: u.observaciones ?? "",
  };
}

function sortByNombre(a: Ubicacion, b: Ubicacion) {
  return (a.nombre_cultivo ?? "").localeCompare(b.nombre_cultivo ?? "");
}

function errorMessageFromUnknown(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return fallback;
}

const inputCls =
  "w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white";
const labelCls =
  "mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark";

export default function UbicacionesEditor({
  initialUbicaciones,
}: UbicacionesEditorProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [items, setItems] = useState<Ubicacion[]>(initialUbicaciones);
  const [banner, setBanner] = useState<Banner>(null);
  const [isPending, startTransition] = useTransition();

  const [newForm, setNewForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  function showBanner(b: Banner) {
    setBanner(b);
    if (b) setTimeout(() => setBanner(null), 3500);
  }

  function validate(form: FormState): string | null {
    if (!form.nombre_cultivo.trim() && !form.vereda.trim()) {
      return "Ingresa al menos un Nombre de cultivo o una Vereda.";
    }
    if (form.area_m2.trim() !== "") {
      const n = Number(form.area_m2);
      if (!Number.isFinite(n) || n < 0) {
        return "El área debe ser un número positivo.";
      }
    }
    return null;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(newForm);
    if (err) {
      showBanner({ kind: "error", text: err });
      return;
    }
    const client = createSPASassClient().getSupabaseClient();
    try {
      const created = await createUbicacion(client, toInput(newForm));
      setItems((prev) => [...prev, created].sort(sortByNombre));
      setNewForm(EMPTY_FORM);
      showBanner({
        kind: "success",
        text: `Ubicación "${created.nombre_cultivo ?? created.vereda ?? "sin nombre"}" agregada.`,
      });
      startTransition(() => router.refresh());
    } catch (e) {
      const msg = errorMessageFromUnknown(e, "Error al agregar la ubicación");
      showBanner({ kind: "error", text: msg });
    }
  }

  function startEdit(u: Ubicacion) {
    setEditingId(u.id);
    setEditForm(fromUbicacion(u));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  async function handleSaveEdit(id: string) {
    const err = validate(editForm);
    if (err) {
      showBanner({ kind: "error", text: err });
      return;
    }
    const client = createSPASassClient().getSupabaseClient();
    try {
      const updated = await updateUbicacion(client, id, toInput(editForm));
      setItems((prev) =>
        prev.map((x) => (x.id === id ? updated : x)).sort(sortByNombre),
      );
      cancelEdit();
      showBanner({ kind: "success", text: "Cambios guardados." });
      startTransition(() => router.refresh());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      showBanner({ kind: "error", text: msg });
    }
  }

  async function handleDelete(u: Ubicacion) {
    const label = u.nombre_cultivo ?? u.vereda ?? "esta ubicación";
    await confirm({
      title: `Eliminar "${label}"`,
      description:
        "Los cultivos vinculados se quedarán sin ubicación. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      tone: "danger",
      onConfirm: async () => {
        const client = createSPASassClient().getSupabaseClient();
        try {
          await deleteUbicacion(client, u.id);
          setItems((prev) => prev.filter((x) => x.id !== u.id));
          showBanner({ kind: "success", text: `"${label}" eliminada.` });
          startTransition(() => router.refresh());
        } catch (e) {
          const msg = errorMessageFromUnknown(e, "Error al eliminar");
          showBanner({ kind: "error", text: msg });
          throw e;
        }
      },
    });
  }

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

      {/* Add form */}
      <section className="rounded-xl border border-stroke bg-white p-5 dark:border-strokedark dark:bg-dark">
        <h2 className="mb-3 text-base font-semibold text-black dark:text-white">
          Agregar nueva ubicación
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="newNombre" className={labelCls}>
                Nombre de cultivo
              </label>
              <input
                id="newNombre"
                type="text"
                value={newForm.nombre_cultivo}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, nombre_cultivo: e.target.value }))
                }
                placeholder="Lote 1 — Hortensia"
                className={inputCls}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="newVereda" className={labelCls}>
                Vereda
              </label>
              <input
                id="newVereda"
                type="text"
                value={newForm.vereda}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, vereda: e.target.value }))
                }
                placeholder="La Esperanza"
                className={inputCls}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="newMunicipio" className={labelCls}>
                Municipio
              </label>
              <input
                id="newMunicipio"
                type="text"
                value={newForm.municipio}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, municipio: e.target.value }))
                }
                placeholder="El Carmen de Viboral"
                className={inputCls}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="newArea" className={labelCls}>
                Área (m²)
              </label>
              <input
                id="newArea"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={newForm.area_m2}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, area_m2: e.target.value }))
                }
                placeholder="1200"
                className={inputCls}
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label htmlFor="newObs" className={labelCls}>
              Observaciones
            </label>
            <textarea
              id="newObs"
              rows={2}
              value={newForm.observaciones}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, observaciones: e.target.value }))
              }
              placeholder="Detalles del lote, acceso, condiciones del suelo…"
              className={inputCls}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-body-color/70 dark:text-body-color-dark/60">
              Una ubicación puede albergar varios cultivos a lo largo del tiempo.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              + Agregar
            </button>
          </div>
        </form>
      </section>

      {/* List */}
      <section className="rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark">
        <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-strokedark">
          <h2 className="text-base font-semibold text-black dark:text-white">
            Ubicaciones existentes
          </h2>
          <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary dark:bg-primary-500/15 dark:text-primary-300">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-body-color dark:text-body-color-dark">
              Aún no tienes ubicaciones registradas. Agrega la primera arriba.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stroke dark:divide-strokedark">
            {items.map((u) => {
              const isEditing = editingId === u.id;
              return (
                <li key={u.id} className="px-5 py-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label className={labelCls}>Nombre de cultivo</label>
                          <input
                            type="text"
                            value={editForm.nombre_cultivo}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                nombre_cultivo: e.target.value,
                              }))
                            }
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Vereda</label>
                          <input
                            type="text"
                            value={editForm.vereda}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, vereda: e.target.value }))
                            }
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Municipio</label>
                          <input
                            type="text"
                            value={editForm.municipio}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                municipio: e.target.value,
                              }))
                            }
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Área (m²)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            value={editForm.area_m2}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                area_m2: e.target.value,
                              }))
                            }
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Observaciones</label>
                        <textarea
                          rows={2}
                          value={editForm.observaciones}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              observaciones: e.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(u.id)}
                          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-600"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-body-color hover:bg-gray-100 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-black dark:text-white">
                          {u.nombre_cultivo ?? "Sin nombre"}
                        </p>
                        <p className="mt-0.5 text-sm text-body-color dark:text-body-color-dark">
                          {[u.vereda, u.municipio].filter(Boolean).join(" — ") ||
                            "Sin ubicación geográfica"}
                          {u.area_m2 != null && (
                            <>
                              {" · "}
                              <span className="tabular-nums">
                                {u.area_m2.toLocaleString("es-CO")} m²
                              </span>
                            </>
                          )}
                        </p>
                        {u.observaciones && (
                          <p className="mt-1 truncate text-xs text-body-color/80 dark:text-body-color-dark/70">
                            {u.observaciones}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-body-color hover:border-primary/40 hover:text-primary dark:border-strokedark dark:text-body-color-dark dark:hover:border-primary/30 dark:hover:text-primary-300"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
