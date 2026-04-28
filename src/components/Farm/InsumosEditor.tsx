"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSPASassClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/Common/ConfirmProvider";
import {
  type Insumo,
  type InsumoInput,
  INSUMO_CATEGORIAS,
  INSUMO_UNIDADES,
  createInsumo,
  deleteInsumo,
  updateInsumo,
} from "@/lib/farm/insumos";
import Select from "@/components/Common/Select";

interface InsumosEditorProps {
  initialInsumos: Insumo[];
}

type Banner = { kind: "success" | "error"; text: string } | null;

const CATEGORIA_OTRO = "__otro__";
const UNIDAD_OTRO = "__otro__";

type FormState = {
  nombre: string;
  categoriaSelect: string;
  categoriaOtro: string;
  unidadSelect: string;
  unidadOtro: string;
  valor_unitario: string;
  proveedor_nombre: string;
  fecha_ultima_compra: string;
  stock_minimo: string;
  observaciones: string;
};

const EMPTY_FORM: FormState = {
  nombre: "",
  categoriaSelect: "",
  categoriaOtro: "",
  unidadSelect: "",
  unidadOtro: "",
  valor_unitario: "",
  proveedor_nombre: "",
  fecha_ultima_compra: "",
  stock_minimo: "",
  observaciones: "",
};

/** YYYY-MM-DD en hora local para `<input type="date">` */
function fechaLocalHoy(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function emptyNewForm(): FormState {
  return { ...EMPTY_FORM, fecha_ultima_compra: fechaLocalHoy() };
}

const CATEGORIAS = INSUMO_CATEGORIAS as readonly string[];
const UNIDADES = INSUMO_UNIDADES as readonly string[];

function fromInsumo(i: Insumo): FormState {
  const cat = i.categoria ?? "";
  const isCatPredef = cat !== "" && CATEGORIAS.includes(cat);
  const unidad = i.unidad_medida ?? "";
  const isUnidadPredef = unidad !== "" && UNIDADES.includes(unidad);
  return {
    nombre: i.nombre,
    categoriaSelect: cat === "" ? "" : isCatPredef ? cat : CATEGORIA_OTRO,
    categoriaOtro: !isCatPredef ? cat : "",
    unidadSelect: unidad === "" ? "" : isUnidadPredef ? unidad : UNIDAD_OTRO,
    unidadOtro: !isUnidadPredef ? unidad : "",
    valor_unitario: i.valor_unitario == null ? "" : String(i.valor_unitario),
    proveedor_nombre: i.proveedor_nombre ?? "",
    fecha_ultima_compra: i.fecha_ultima_compra ?? "",
    stock_minimo: i.stock_minimo == null ? "" : String(i.stock_minimo),
    observaciones: i.observaciones ?? "",
  };
}

function toInput(form: FormState): InsumoInput {
  const categoria =
    form.categoriaSelect === CATEGORIA_OTRO
      ? form.categoriaOtro.trim()
      : form.categoriaSelect;
  const unidad_medida =
    form.unidadSelect === UNIDAD_OTRO
      ? form.unidadOtro.trim()
      : form.unidadSelect;
  const valor = form.valor_unitario.trim();
  const stock = form.stock_minimo.trim();
  return {
    nombre: form.nombre,
    categoria: categoria === "" ? null : categoria,
    unidad_medida: unidad_medida === "" ? null : unidad_medida,
    valor_unitario: valor === "" ? null : Number(valor),
    proveedor_nombre: form.proveedor_nombre,
    fecha_ultima_compra: form.fecha_ultima_compra || null,
    stock_minimo: stock === "" ? null : Number(stock),
    observaciones: form.observaciones,
  };
}

function sortByNombre(a: Insumo, b: Insumo) {
  return a.nombre.localeCompare(b.nombre);
}

function errorMessageFromUnknown(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return fallback;
}

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const inputCls =
  "w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white";
const labelCls =
  "mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark";
const hintCls =
  "mt-1.5 block text-xs leading-snug text-body-color/75 dark:text-body-color-dark/70";

export default function InsumosEditor({ initialInsumos }: InsumosEditorProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [items, setItems] = useState<Insumo[]>(initialInsumos);
  const [banner, setBanner] = useState<Banner>(null);
  const [isPending, startTransition] = useTransition();

  const [newForm, setNewForm] = useState<FormState>(emptyNewForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  function showBanner(b: Banner) {
    setBanner(b);
    if (b) setTimeout(() => setBanner(null), 3500);
  }

  function validate(form: FormState): string | null {
    if (!form.nombre.trim()) return "Ingresa un nombre para el insumo.";
    if (
      form.categoriaSelect === CATEGORIA_OTRO &&
      !form.categoriaOtro.trim()
    ) {
      return 'Especifica la categoría cuando seleccionas "Otro".';
    }
    if (form.unidadSelect === UNIDAD_OTRO && !form.unidadOtro.trim()) {
      return 'Especifica la unidad cuando seleccionas "Otro".';
    }
    if (form.valor_unitario.trim() !== "") {
      const n = Number(form.valor_unitario);
      if (!Number.isFinite(n) || n < 0)
        return "El valor unitario debe ser un número positivo.";
    }
    if (form.stock_minimo.trim() !== "") {
      const n = Number(form.stock_minimo);
      if (!Number.isFinite(n) || n < 0)
        return "El stock mínimo debe ser un número positivo.";
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
      const created = await createInsumo(client, toInput(newForm));
      setItems((prev) => [...prev, created].sort(sortByNombre));
      setNewForm(emptyNewForm());
      showBanner({
        kind: "success",
        text: `Insumo "${created.nombre}" agregado.`,
      });
      startTransition(() => router.refresh());
    } catch (e) {
      showBanner({
        kind: "error",
        text: errorMessageFromUnknown(e, "Error al agregar el insumo"),
      });
    }
  }

  function startEdit(i: Insumo) {
    setEditingId(i.id);
    setEditForm(fromInsumo(i));
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
      const updated = await updateInsumo(client, id, toInput(editForm));
      setItems((prev) =>
        prev.map((x) => (x.id === id ? updated : x)).sort(sortByNombre),
      );
      cancelEdit();
      showBanner({ kind: "success", text: "Cambios guardados." });
      startTransition(() => router.refresh());
    } catch (e) {
      showBanner({
        kind: "error",
        text: errorMessageFromUnknown(e, "Error al guardar"),
      });
    }
  }

  async function handleDelete(i: Insumo) {
    await confirm({
      title: `Eliminar "${i.nombre}"`,
      description:
        "Este insumo dejará de estar disponible para nuevas actividades y costos. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      tone: "danger",
      onConfirm: async () => {
        const client = createSPASassClient().getSupabaseClient();
        try {
          await deleteInsumo(client, i.id);
          setItems((prev) => prev.filter((x) => x.id !== i.id));
          showBanner({ kind: "success", text: `"${i.nombre}" eliminado.` });
          startTransition(() => router.refresh());
        } catch (e) {
          showBanner({
            kind: "error",
            text: errorMessageFromUnknown(e, "Error al eliminar"),
          });
          throw e;
        }
      },
    });
  }

  function renderFormFields(
    form: FormState,
    setForm: React.Dispatch<React.SetStateAction<FormState>>,
    idPrefix: string,
  ) {
    return (
      <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label htmlFor={`${idPrefix}-nombre`} className={labelCls}>
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id={`${idPrefix}-nombre`}
              type="text"
              value={form.nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombre: e.target.value }))
              }
              placeholder="Abono Nutrimon 15-15-15"
              className={inputCls}
              autoComplete="off"
            />
          </div>

          <Select
            id={`${idPrefix}-cat`}
            label="Categoría"
            value={form.categoriaSelect}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                categoriaSelect: e.target.value,
                categoriaOtro:
                  e.target.value === CATEGORIA_OTRO ? f.categoriaOtro : "",
              }))
            }
          >
            <option value="">Seleccione…</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={CATEGORIA_OTRO}>Otro (especificar)</option>
          </Select>

          {form.categoriaSelect === CATEGORIA_OTRO && (
            <div>
              <label htmlFor={`${idPrefix}-cat-otro`} className={labelCls}>
                Categoría (otro)
              </label>
              <input
                id={`${idPrefix}-cat-otro`}
                type="text"
                value={form.categoriaOtro}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoriaOtro: e.target.value }))
                }
                placeholder="Especificar categoría"
                className={inputCls}
              />
            </div>
          )}

          <Select
            id={`${idPrefix}-unidad`}
            label="Unidad de medida"
            hint="La misma unidad con la que vas a registrar el consumo en las actividades del cultivo (kilogramos, gramos, miligramos, litro…)."
            value={form.unidadSelect}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                unidadSelect: e.target.value,
                unidadOtro:
                  e.target.value === UNIDAD_OTRO ? f.unidadOtro : "",
              }))
            }
          >
            <option value="">Seleccione…</option>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
            <option value={UNIDAD_OTRO}>Otro (especificar)</option>
          </Select>

          {form.unidadSelect === UNIDAD_OTRO && (
            <div>
              <label htmlFor={`${idPrefix}-unidad-otro`} className={labelCls}>
                Unidad (otro)
              </label>
              <input
                id={`${idPrefix}-unidad-otro`}
                type="text"
                value={form.unidadOtro}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unidadOtro: e.target.value }))
                }
                placeholder="Especificar unidad"
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label htmlFor={`${idPrefix}-valor`} className={labelCls}>
              Valor unitario (COP)
            </label>
            <input
              id={`${idPrefix}-valor`}
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={form.valor_unitario}
              onChange={(e) =>
                setForm((f) => ({ ...f, valor_unitario: e.target.value }))
              }
              placeholder="85000"
              className={inputCls}
              autoComplete="off"
            />
            <p className={hintCls}>
              Precio por esa unidad: si eliges kilogramos, gramos o miligramos, pon el costo de una unidad de esa
              medida (ej.: pesos por kg, por gramo o por mg).
            </p>
          </div>

          <div>
            <label htmlFor={`${idPrefix}-stock`} className={labelCls}>
              Stock mínimo
            </label>
            <input
              id={`${idPrefix}-stock`}
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={form.stock_minimo}
              onChange={(e) =>
                setForm((f) => ({ ...f, stock_minimo: e.target.value }))
              }
              placeholder="2"
              className={inputCls}
              autoComplete="off"
            />
            <p className={hintCls}>
              Sirve para las alertas de compra en inventario: cuando el stock baja de este nivel, verás aviso para
              reponer.
            </p>
          </div>

          <div>
            <label htmlFor={`${idPrefix}-prov`} className={labelCls}>
              Proveedor
            </label>
            <input
              id={`${idPrefix}-prov`}
              type="text"
              value={form.proveedor_nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, proveedor_nombre: e.target.value }))
              }
              placeholder="Agroquímicos del Oriente"
              className={inputCls}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor={`${idPrefix}-fecha`} className={labelCls}>
              Fecha última compra
            </label>
            <input
              id={`${idPrefix}-fecha`}
              type="date"
              value={form.fecha_ultima_compra}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  fecha_ultima_compra: e.target.value,
                }))
              }
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${idPrefix}-obs`} className={labelCls}>
            Observaciones
          </label>
          <textarea
            id={`${idPrefix}-obs`}
            rows={2}
            value={form.observaciones}
            onChange={(e) =>
              setForm((f) => ({ ...f, observaciones: e.target.value }))
            }
            placeholder="Notas, dosificación, almacenamiento…"
            className={inputCls}
          />
        </div>
      </>
    );
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
          Agregar nuevo insumo
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          {renderFormFields(newForm, setNewForm, "new")}
          <div className="flex justify-end">
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
            Insumos existentes
          </h2>
          <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary dark:bg-primary-500/15 dark:text-primary-300">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-body-color dark:text-body-color-dark">
              Aún no tienes insumos registrados. Agrega el primero arriba.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stroke dark:divide-strokedark">
            {items.map((i) => {
              const isEditing = editingId === i.id;
              return (
                <li key={i.id} className="px-5 py-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      {renderFormFields(editForm, setEditForm, `edit-${i.id}`)}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(i.id)}
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
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-black dark:text-white">
                            {i.nombre}
                          </p>
                          {i.categoria && (
                            <span className="rounded-full bg-secondary-100/60 px-2 py-0.5 text-[11px] font-medium text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-300">
                              {i.categoria}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-body-color dark:text-body-color-dark">
                          {i.valor_unitario != null ? (
                            <>
                              <span className="tabular-nums">
                                {COP.format(i.valor_unitario)}
                              </span>
                              {i.unidad_medida && (
                                <>
                                  {" / "}
                                  <span>{i.unidad_medida}</span>
                                </>
                              )}
                            </>
                          ) : i.unidad_medida ? (
                            <span>Unidad: {i.unidad_medida}</span>
                          ) : (
                            <span className="opacity-70">Sin precio</span>
                          )}
                          {i.stock_minimo != null && (
                            <>
                              {" · "}
                              <span className="tabular-nums">
                                Stock mín. {i.stock_minimo}
                              </span>
                            </>
                          )}
                          {i.proveedor_nombre && (
                            <>
                              {" · "}
                              <span>{i.proveedor_nombre}</span>
                            </>
                          )}
                        </p>
                        {i.observaciones && (
                          <p className="mt-1 truncate text-xs text-body-color/80 dark:text-body-color-dark/70">
                            {i.observaciones}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(i)}
                          className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-body-color hover:border-primary/40 hover:text-primary dark:border-strokedark dark:text-body-color-dark dark:hover:border-primary/30 dark:hover:text-primary-300"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(i)}
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
