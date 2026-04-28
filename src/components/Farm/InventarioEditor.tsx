"use client";

import { useMemo, useState } from "react";
import { createSPASassClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/Common/ConfirmProvider";
import Modal from "@/components/Common/Modal";
import Select from "@/components/Common/Select";
import {
  type Movimiento,
  type MovimientoInput,
  type TipoMovimiento,
  type NecesidadCompra,
  TIPOS_MOVIMIENTO,
  createMovimiento,
  deleteMovimiento,
  listNecesidadCompra,
} from "@/lib/farm/inventario";
import type { Insumo } from "@/lib/farm/insumos";
import type { Cultivo } from "@/lib/farm/cultivos";
import type { Ubicacion } from "@/lib/farm/ubicaciones";
import type { Variedad } from "@/lib/farm/variedades";
import type { InsumosCultivoRow } from "@/lib/farm/costos";
import { listInsumosCultivoForCultivo } from "@/lib/farm/costos";

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function last30DaysRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function ubicacionLabel(u: Ubicacion): string {
  const parts = [u.nombre_cultivo, u.vereda].filter(Boolean);
  return parts.length > 0 ? parts.join(" – ") : "Sin nombre";
}

function cultivoLabel(c: Cultivo, variedadById: Map<string, Variedad>): string {
  const variedad = c.id_variedad ? variedadById.get(c.id_variedad) : null;
  return `#${c.numero_cultivo}${variedad ? ` – ${variedad.nombre}` : ""}`;
}

function tipoLabel(t: TipoMovimiento): string {
  return t === "ENTRADA" ? "Entrada" : t === "SALIDA" ? "Salida" : "Ajuste";
}

const TIPO_CHIP: Record<TipoMovimiento, string> = {
  ENTRADA:
    "bg-primary-100 text-primary dark:bg-primary-500/15 dark:text-primary-300",
  SALIDA: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  AJUSTE:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface InventarioEditorProps {
  insumos: Insumo[];
  initialMovimientos: Movimiento[];
  initialNecesidad: NecesidadCompra[];
  cultivos: Cultivo[];
  ubicaciones: Ubicacion[];
  variedades: Variedad[];
}

type Tab = "stock" | "movimientos" | "compras";
type Banner = { kind: "success" | "error"; text: string } | null;

interface MovForm {
  id_insumo: string;
  tipo: TipoMovimiento;
  cantidad: string;
  unidad: string;
  fecha: string;
  id_ubicacion: string;
  id_cultivo: string;
  descripcion: string;
  precio_unitario: string;
  referencia: string;
  id_insumos_cultivo: string;
  ajusteObjetivo: string;
}

function emptyMovForm(): MovForm {
  return {
    id_insumo: "",
    tipo: "ENTRADA",
    cantidad: "",
    unidad: "",
    fecha: today(),
    id_ubicacion: "",
    id_cultivo: "",
    descripcion: "",
    precio_unitario: "",
    referencia: "",
    id_insumos_cultivo: "",
    ajusteObjetivo: "",
  };
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconRefresh({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InventarioEditor({
  insumos,
  initialMovimientos,
  initialNecesidad,
  cultivos,
  ubicaciones,
  variedades,
}: InventarioEditorProps) {
  const confirm = useConfirm();

  // ── Tab ─────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("stock");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [banner, setBanner] = useState<Banner>(null);

  // ── Live insumos (stock_actual updated on movements) ────────────────────────
  const [insumosList, setInsumosList] = useState<Insumo[]>(insumos);

  // ── Movimientos ─────────────────────────────────────────────────────────────
  const [movimientos, setMovimientos] = useState<Movimiento[]>(initialMovimientos);

  // ── Necesidad (purchase report) ─────────────────────────────────────────────
  const [necesidad, setNecesidad] = useState<NecesidadCompra[]>(initialNecesidad);
  const [estadoCultivoFilter, setEstadoCultivoFilter] = useState("todos");
  const [comprasFechaInicio, setComprasFechaInicio] = useState("");
  const [comprasFechaFin, setComprasFechaFin] = useState("");
  const [loadingNecesidad, setLoadingNecesidad] = useState(false);

  // ── Movimiento filters ──────────────────────────────────────────────────────
  const defaultRange = last30DaysRange();
  const [movFechaInicio, setMovFechaInicio] = useState(defaultRange.start);
  const [movFechaFin, setMovFechaFin] = useState(defaultRange.end);
  const [movTipoFilter, setMovTipoFilter] = useState("");
  const [movInsumoFilter, setMovInsumoFilter] = useState("");
  const [movUbicacionFilter, setMovUbicacionFilter] = useState("");

  // ── Stock filters ────────────────────────────────────────────────────────────
  const [stockSearch, setStockSearch] = useState("");
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  // ── Modal ────────────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [movForm, setMovForm] = useState<MovForm>(emptyMovForm());
  const [saving, setSaving] = useState(false);
  const [pickerInsumosCultivo, setPickerInsumosCultivo] = useState<InsumosCultivoRow[]>([]);

  // ── Lookup maps ──────────────────────────────────────────────────────────────
  const variedadById = useMemo(() => {
    const m = new Map<string, Variedad>();
    for (const v of variedades) m.set(v.id, v);
    return m;
  }, [variedades]);

  const ubicacionById = useMemo(() => {
    const m = new Map<string, Ubicacion>();
    for (const u of ubicaciones) m.set(u.id, u);
    return m;
  }, [ubicaciones]);

  const cultivoById = useMemo(() => {
    const m = new Map<string, Cultivo>();
    for (const c of cultivos) m.set(c.id, c);
    return m;
  }, [cultivos]);

  const insumoById = useMemo(() => {
    const m = new Map<string, Insumo>();
    for (const i of insumosList) m.set(i.id, i);
    return m;
  }, [insumosList]);

  // ── Stock alert count ────────────────────────────────────────────────────────
  const alertCount = useMemo(
    () =>
      insumosList.filter(
        (i) => i.stock_minimo != null && i.stock_actual <= i.stock_minimo,
      ).length,
    [insumosList],
  );

  // ── Filtered stock ───────────────────────────────────────────────────────────
  const filteredStock = useMemo(() => {
    const q = stockSearch.toLowerCase();
    return insumosList.filter((i) => {
      if (q && !i.nombre.toLowerCase().includes(q)) return false;
      if (showOnlyAlerts && !(i.stock_minimo != null && i.stock_actual <= i.stock_minimo))
        return false;
      return true;
    });
  }, [insumosList, stockSearch, showOnlyAlerts]);

  // ── Filtered movimientos ─────────────────────────────────────────────────────
  const filteredMov = useMemo(() => {
    return movimientos.filter((m) => {
      if (movFechaInicio && m.fecha < movFechaInicio) return false;
      if (movFechaFin && m.fecha > movFechaFin) return false;
      if (movTipoFilter && m.tipo !== movTipoFilter) return false;
      if (movInsumoFilter && m.id_insumo !== movInsumoFilter) return false;
      if (movUbicacionFilter && m.id_ubicacion !== movUbicacionFilter) return false;
      return true;
    });
  }, [movimientos, movFechaInicio, movFechaFin, movTipoFilter, movInsumoFilter, movUbicacionFilter]);

  // ── Banner ───────────────────────────────────────────────────────────────────
  function showBanner(b: Banner) {
    setBanner(b);
    if (b) setTimeout(() => setBanner(null), 3500);
  }

  // ── Modal helpers ────────────────────────────────────────────────────────────
  function openNewMovimiento(prefillInsumoId?: string, prefillTipo?: TipoMovimiento) {
    const f = emptyMovForm();
    if (prefillInsumoId) {
      f.id_insumo = prefillInsumoId;
      const ins = insumoById.get(prefillInsumoId);
      if (ins?.unidad_medida) f.unidad = ins.unidad_medida;
    }
    if (prefillTipo) f.tipo = prefillTipo;
    setMovForm(f);
    setPickerInsumosCultivo([]);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setPickerInsumosCultivo([]);
  }

  function setMovField<K extends keyof MovForm>(key: K, value: MovForm[K]) {
    setMovForm((prev) => ({ ...prev, [key]: value }));
  }

  function onMovInsumoChange(id: string) {
    setMovField("id_insumo", id);
    const ins = insumoById.get(id);
    if (ins?.unidad_medida) setMovField("unidad", ins.unidad_medida);
    if (ins?.valor_unitario != null) {
      setMovField("precio_unitario", String(ins.valor_unitario));
    }
  }

  function onMovCultivoChange(id: string) {
    setMovField("id_cultivo", id);
    setMovField("id_insumos_cultivo", "");
    setPickerInsumosCultivo([]);
    if (id) {
      const client = createSPASassClient().getSupabaseClient();
      listInsumosCultivoForCultivo(client, id)
        .then(setPickerInsumosCultivo)
        .catch(() => setPickerInsumosCultivo([]));
    }
  }

  // ── Submit movimiento ─────────────────────────────────────────────────────────
  async function handleMovSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const tipo = movForm.tipo;
    const insumoId = movForm.id_insumo;
    const ubicId = movForm.id_ubicacion;

    if (!insumoId || !ubicId || !movForm.fecha) {
      showBanner({ kind: "error", text: "Insumo, finca y fecha son obligatorios." });
      return;
    }

    let cantidad: number;
    if (tipo === "AJUSTE") {
      const objetivo = parseFloat(movForm.ajusteObjetivo);
      if (isNaN(objetivo) || objetivo < 0) {
        showBanner({ kind: "error", text: "Ingresa una cantidad objetivo válida para el ajuste." });
        return;
      }
      const stockActual = insumoById.get(insumoId)?.stock_actual ?? 0;
      cantidad = objetivo - stockActual;
    } else {
      cantidad = parseFloat(movForm.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
        showBanner({ kind: "error", text: "La cantidad debe ser mayor a 0." });
        return;
      }
    }

    setSaving(true);
    try {
      const client = createSPASassClient().getSupabaseClient();
      const precioUnitario = movForm.precio_unitario
        ? parseFloat(movForm.precio_unitario)
        : null;
      const payload: MovimientoInput = {
        id_insumo: insumoId,
        tipo,
        cantidad,
        unidad: movForm.unidad || "",
        fecha: movForm.fecha,
        id_ubicacion: ubicId,
        id_cultivo: movForm.id_cultivo || null,
        descripcion: movForm.descripcion || null,
        precio_unitario: precioUnitario,
        costo_total:
          precioUnitario && tipo !== "AJUSTE"
            ? Math.round(Math.abs(cantidad) * precioUnitario)
            : null,
        referencia: movForm.referencia || null,
        id_insumos_cultivo: movForm.id_insumos_cultivo || null,
      };

      const created = await createMovimiento(client, payload);
      setMovimientos((prev) => [created, ...prev]);

      // Update local stock_actual (and valor_unitario weighted avg) optimistically
      setInsumosList((prev) =>
        prev.map((ins) => {
          if (ins.id !== insumoId) return ins;
          let newStock = ins.stock_actual;
          if (tipo === "ENTRADA") newStock = newStock + cantidad;
          else if (tipo === "SALIDA") newStock = Math.max(0, newStock - cantidad);
          else newStock = Math.max(0, newStock + cantidad);

          let newValorUnitario = ins.valor_unitario;
          if (tipo === "ENTRADA" && precioUnitario != null) {
            const oldStock = ins.stock_actual;
            const oldPrice = ins.valor_unitario ?? precioUnitario;
            newValorUnitario =
              oldStock <= 0
                ? precioUnitario
                : Math.round(
                    ((oldStock * oldPrice + cantidad * precioUnitario) /
                      (oldStock + cantidad)) *
                      100,
                  ) / 100;
          }

          return { ...ins, stock_actual: newStock, valor_unitario: newValorUnitario };
        }),
      );

      showBanner({ kind: "success", text: "Movimiento registrado" });
      closeModal();
    } catch (err) {
      showBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Error al guardar",
      });
    } finally {
      setSaving(false);
    }
  }

  // ── Delete movimiento ─────────────────────────────────────────────────────────
  async function handleMovDelete(m: Movimiento) {
    const insumoNombre = insumoById.get(m.id_insumo)?.nombre ?? "insumo";
    const ok = await confirm({
      title: "Eliminar movimiento",
      description: `¿Eliminar ${tipoLabel(m.tipo).toLowerCase()} de "${insumoNombre}" (${m.cantidad} ${m.unidad}) del ${m.fecha}? Esta acción revertirá el stock.`,
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!ok) return;

    try {
      const client = createSPASassClient().getSupabaseClient();
      await deleteMovimiento(client, m.id);
      setMovimientos((prev) => prev.filter((x) => x.id !== m.id));

      setInsumosList((prev) =>
        prev.map((ins) => {
          if (ins.id !== m.id_insumo) return ins;
          let newStock = ins.stock_actual;
          if (m.tipo === "ENTRADA") newStock = Math.max(0, newStock - m.cantidad);
          else if (m.tipo === "SALIDA") newStock = newStock + m.cantidad;
          else newStock = newStock - m.cantidad;
          return { ...ins, stock_actual: Math.max(0, newStock) };
        }),
      );

      showBanner({ kind: "success", text: "Movimiento eliminado" });
    } catch (err) {
      showBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Error al eliminar",
      });
    }
  }

  // ── Refresh purchase report ───────────────────────────────────────────────────
  async function refreshNecesidad() {
    setLoadingNecesidad(true);
    try {
      const client = createSPASassClient().getSupabaseClient();
      const estado = estadoCultivoFilter === "todos" ? null : estadoCultivoFilter;
      const result = await listNecesidadCompra(
        client,
        estado,
        comprasFechaInicio || null,
        comprasFechaFin || null,
      );
      setNecesidad(result);
    } catch (err) {
      showBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Error al cargar reporte",
      });
    } finally {
      setLoadingNecesidad(false);
    }
  }

  function clearMovFilters() {
    const range = last30DaysRange();
    setMovFechaInicio(range.start);
    setMovFechaFin(range.end);
    setMovTipoFilter("");
    setMovInsumoFilter("");
    setMovUbicacionFilter("");
  }

  const inputCls =
    "w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition-colors duration-150 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-dark dark:text-white dark:hover:border-primary/40 dark:focus:ring-primary/15";
  const labelCls =
    "mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark";

  const selectedInsumo = movForm.id_insumo
    ? insumoById.get(movForm.id_insumo)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Banner */}
      {banner && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            banner.kind === "success"
              ? "bg-primary-100 text-primary dark:bg-primary-500/15 dark:text-primary-300"
              : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* Alert bar */}
      {alertCount > 0 && (
        <button
          type="button"
          className="mb-4 flex w-full items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-left text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"
          onClick={() => {
            setActiveTab("stock");
            setShowOnlyAlerts(true);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            <strong>{alertCount}</strong> insumo{alertCount !== 1 ? "s" : ""} con stock por debajo del mínimo. Haz clic para ver.
          </span>
        </button>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-stroke bg-white p-1 dark:border-strokedark dark:bg-dark">
        {(["stock", "movimientos", "compras"] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-primary text-white shadow-sm"
                : "text-body-color hover:bg-gray-50 dark:text-body-color-dark dark:hover:bg-white/5"
            }`}
          >
            {tab === "stock"
              ? `Stock${alertCount > 0 ? ` (${alertCount})` : ""}`
              : tab === "movimientos"
                ? "Movimientos"
                : "Reporte de Compras"}
          </button>
        ))}
      </div>

      {/* ── TAB: STOCK ── */}
      {activeTab === "stock" && (
        <div>
          <div className="mb-4 flex flex-col gap-4 rounded-xl border border-stroke bg-white p-4 dark:border-strokedark dark:bg-dark">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 w-full">
                <label className={labelCls}>Buscar insumo</label>
                <input
                  type="text"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Nombre del insumo…"
                  className={inputCls}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-body-color dark:text-body-color-dark">
                  <input
                    type="checkbox"
                    checked={showOnlyAlerts}
                    onChange={(e) => setShowOnlyAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-stroke accent-primary"
                  />
                  Solo alertas
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stroke/50 pt-3 dark:border-strokedark/50">
               <div className="hidden items-center rounded-lg border border-stroke bg-gray-50/50 p-1 dark:border-strokedark dark:bg-dark md:flex">
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
                 onClick={() => openNewMovimiento(undefined, "ENTRADA")}
                 className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 sm:w-auto sm:ml-auto"
               >
                 <IconPlus />
                 Nuevo Movimiento
               </button>
            </div>
          </div>

          <div className="w-full">
            {/* Table View (Desktop Only) */}
            <div className={`${viewMode === "table" ? "hidden md:block" : "hidden"} overflow-hidden rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark`}>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stroke bg-gray-50/70 dark:border-strokedark dark:bg-white/5">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Insumo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Categoría</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Stock Actual</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Stock Mínimo</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Precio Prom.</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Estado</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark">
                    {filteredStock.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-body-color dark:text-body-color-dark">
                          No hay insumos en el catálogo.
                        </td>
                      </tr>
                    ) : (
                      filteredStock.map((ins) => {
                        const bajominimo =
                          ins.stock_minimo != null && ins.stock_actual <= ins.stock_minimo;
                        return (
                          <tr
                            key={ins.id}
                            className={`transition-colors hover:bg-gray-50/60 dark:hover:bg-white/3 ${bajominimo ? "bg-red-50/40 dark:bg-red-500/5" : ""}`}
                          >
                            <td className="px-4 py-3 font-medium text-black dark:text-white">{ins.nombre}</td>
                            <td className="px-4 py-3 text-body-color dark:text-body-color-dark">{ins.categoria ?? "-"}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${bajominimo ? "text-red-600 dark:text-red-400" : "text-black dark:text-white"}`}>
                              {ins.stock_actual} {ins.unidad_medida ?? ""}
                            </td>
                            <td className="px-4 py-3 text-right text-body-color dark:text-body-color-dark">
                              {ins.stock_minimo != null
                                ? `${ins.stock_minimo} ${ins.unidad_medida ?? ""}`
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-right text-body-color dark:text-body-color-dark">
                              {ins.valor_unitario != null
                                ? ins.valor_unitario.toLocaleString("es-CO", {
                                    style: "currency",
                                    currency: "COP",
                                    maximumFractionDigits: 0,
                                  })
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {bajominimo ? (
                                <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-500/15 dark:text-red-400">
                                  Bajo mínimo
                                </span>
                              ) : (
                                <span className="inline-block rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary-500/15 dark:text-primary-300">
                                  OK
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openNewMovimiento(ins.id, "ENTRADA")}
                                  className="rounded px-2 py-1 text-xs text-primary transition-colors hover:bg-primary-100 dark:hover:bg-primary-500/15"
                                >
                                  + Entrada
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openNewMovimiento(ins.id, "SALIDA")}
                                  className="rounded px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/15"
                                >
                                  – Salida
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card View */}
            <div className={`${viewMode === "table" ? "grid md:hidden" : "grid"} grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}>
               {filteredStock.length === 0 ? (
                 <div className="col-span-full rounded-xl border border-stroke bg-white px-4 py-10 text-center text-sm text-body-color dark:border-strokedark dark:bg-dark dark:text-body-color-dark">
                   No hay insumos.
                 </div>
               ) : (
                 filteredStock.map((ins) => {
                   const bajominimo = ins.stock_minimo != null && ins.stock_actual <= ins.stock_minimo;
                   return (
                     <div key={ins.id} className={`group relative flex flex-col gap-3 overflow-hidden rounded-xl border ${bajominimo ? "border-red-300 bg-red-50/40 dark:border-red-500/30 dark:bg-red-500/5 hover:border-red-400" : "border-stroke bg-white dark:border-strokedark dark:bg-dark hover:border-primary/50"} p-3.5 shadow-sm transition-all hover:shadow-md`}>
                       <div className="flex items-center justify-between border-b border-stroke/50 pb-2 dark:border-strokedark/50">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-black dark:text-white truncate">{ins.nombre}</span>
                          </div>
                          {bajominimo && <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-500/15 dark:text-red-400">Bajo Mín.</span>}
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <div className="flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                           <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Stock Actual</span>
                           <span className={`text-sm font-bold ${bajominimo ? "text-red-600 dark:text-red-400" : "text-black dark:text-white"}`}>{ins.stock_actual} <span className="text-[10px] font-normal uppercase text-body-color dark:text-body-color-dark">{ins.unidad_medida ?? ""}</span></span>
                         </div>
                         <div className="flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                           <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Mínimo</span>
                           <span className="text-sm font-semibold text-body-color dark:text-body-color-dark">{ins.stock_minimo != null ? ins.stock_minimo : "-"} <span className="text-[10px] font-normal uppercase">{ins.unidad_medida ?? ""}</span></span>
                         </div>
                       </div>
                       <div className="mt-1 flex items-center justify-between border-t border-stroke/50 pt-2 dark:border-strokedark/50">
                         <div className="flex flex-col gap-0.5">
                           <span className="text-[9px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Categoría / Precio Prom.</span>
                           <span className="text-[11px] font-medium text-black dark:text-white">{ins.categoria ?? "-"} <span className="text-body-color dark:text-body-color-dark">·</span> {ins.valor_unitario != null ? ins.valor_unitario.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }) : "—"}</span>
                         </div>
                         <div className="flex shrink-0 items-center justify-end gap-1.5 ml-2">
                           <button type="button" onClick={() => openNewMovimiento(ins.id, "SALIDA")} className="rounded-md border border-red-200 bg-red-50/80 px-2 py-1 text-[10px] font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20">Salida</button>
                           <button type="button" onClick={() => openNewMovimiento(ins.id, "ENTRADA")} className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20 dark:border-primary-500/20 dark:bg-primary-500/10 dark:hover:bg-primary-500/20">Entrada</button>
                         </div>
                       </div>
                     </div>
                   );
                 })
               )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MOVIMIENTOS ── */}
      {activeTab === "movimientos" && (
        <div>
          <div className="mb-4 flex flex-col gap-4 rounded-xl border border-stroke bg-white p-4 dark:border-strokedark dark:bg-dark">
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-start">
              <div className="col-span-1">
                <label className={labelCls}>Desde</label>
                <input
                  type="date"
                  value={movFechaInicio}
                  onChange={(e) => setMovFechaInicio(e.target.value)}
                  className={`${inputCls} w-full sm:w-[130px]`}
                />
              </div>
              <div className="col-span-1">
                <label className={labelCls}>Hasta</label>
                <input
                  type="date"
                  value={movFechaFin}
                  onChange={(e) => setMovFechaFin(e.target.value)}
                  className={`${inputCls} w-full sm:w-[130px]`}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Select
                  label="Tipo"
                  value={movTipoFilter}
                  onChange={(e) => setMovTipoFilter(e.target.value)}
                  wrapperClassName="w-full sm:w-[140px]"
                >
                  <option value="">Todos</option>
                  {TIPOS_MOVIMIENTO.map((t) => (
                    <option key={t} value={t}>{tipoLabel(t)}</option>
                  ))}
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Select
                  label="Insumo"
                  value={movInsumoFilter}
                  onChange={(e) => setMovInsumoFilter(e.target.value)}
                  wrapperClassName="w-full sm:w-[160px]"
                >
                  <option value="">Todos</option>
                  {insumosList.map((i) => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Select
                  label="Finca"
                  value={movUbicacionFilter}
                  onChange={(e) => setMovUbicacionFilter(e.target.value)}
                  wrapperClassName="w-full sm:w-[160px]"
                >
                  <option value="">Todas</option>
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>{ubicacionLabel(u)}</option>
                  ))}
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1 sm:self-end">
                <button
                  type="button"
                  onClick={clearMovFilters}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-stroke px-3 py-2 text-xs font-medium text-body-color transition-colors hover:bg-gray-100 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5 sm:w-auto"
                >
                  <IconX />
                  Limpiar
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stroke/50 pt-3 dark:border-strokedark/50">
               {/* VIEW TOGGLE */}
               <div className="hidden items-center rounded-lg border border-stroke bg-gray-50/50 p-1 dark:border-strokedark dark:bg-dark md:flex">
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
                 onClick={() => openNewMovimiento()}
                 className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 sm:w-auto sm:ml-auto"
               >
                 <IconPlus />
                 Nuevo Movimiento
               </button>
            </div>
          </div>

          <div className="w-full">
            {/* Table View */}
            <div className={`${viewMode === "table" ? "hidden md:block" : "hidden"} overflow-hidden rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark`}>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stroke bg-gray-50/70 dark:border-strokedark dark:bg-white/5">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-color dark:text-body-color-dark">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-color dark:text-body-color-dark">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-color dark:text-body-color-dark">Insumo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-color dark:text-body-color-dark">Finca</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-color dark:text-body-color-dark">Cultivo</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-body-color dark:text-body-color-dark">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-color dark:text-body-color-dark">Descripción</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-color dark:text-body-color-dark">Referencia</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-body-color dark:text-body-color-dark">Eliminar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark">
                    {filteredMov.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-body-color dark:text-body-color-dark">
                          No hay movimientos en el período seleccionado.
                        </td>
                      </tr>
                    ) : (
                      filteredMov.map((m) => {
                        const ins = insumoById.get(m.id_insumo);
                        const ub = ubicacionById.get(m.id_ubicacion);
                        const cu = m.id_cultivo ? cultivoById.get(m.id_cultivo) : null;
                        return (
                          <tr key={m.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/3">
                            <td className="whitespace-nowrap px-4 py-3 text-black dark:text-white">{m.fecha}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TIPO_CHIP[m.tipo]}`}>
                                {tipoLabel(m.tipo)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-body-color dark:text-body-color-dark">{ins?.nombre ?? "-"}</td>
                            <td className="px-4 py-3 text-body-color dark:text-body-color-dark">
                              {ub ? ubicacionLabel(ub) : "-"}
                            </td>
                            <td className="px-4 py-3 text-body-color dark:text-body-color-dark">
                              {cu ? cultivoLabel(cu, variedadById) : "-"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-black dark:text-white">
                              {m.tipo === "AJUSTE" && m.cantidad > 0 ? "+" : ""}
                              {m.cantidad} {m.unidad}
                            </td>
                            <td className="max-w-[160px] truncate px-4 py-3 text-body-color dark:text-body-color-dark">
                              {m.descripcion ?? "-"}
                            </td>
                            <td className="px-4 py-3 text-body-color dark:text-body-color-dark">{m.referencia ?? "-"}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleMovDelete(m)}
                                className="rounded p-1.5 text-body-color transition-colors hover:bg-red-100 hover:text-red-600 dark:text-body-color-dark dark:hover:bg-red-500/15 dark:hover:text-red-400"
                              >
                                <IconTrash />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card View */}
            <div className={`${viewMode === "table" ? "grid md:hidden" : "grid"} grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}>
               {filteredMov.length === 0 ? (
                 <div className="col-span-full rounded-xl border border-stroke bg-white px-4 py-10 text-center text-sm text-body-color dark:border-strokedark dark:bg-dark dark:text-body-color-dark">
                   No hay movimientos en el período seleccionado.
                 </div>
               ) : (
                 filteredMov.map((m) => {
                   const ins = insumoById.get(m.id_insumo);
                   const ub = ubicacionById.get(m.id_ubicacion);
                   const cu = m.id_cultivo ? cultivoById.get(m.id_cultivo) : null;
                   return (
                     <div key={m.id} className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-stroke bg-white p-3.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md dark:border-strokedark dark:bg-dark">
                       {/* Header: Fecha y Tipo */}
                       <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-strokedark">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-black dark:text-white">{m.fecha}</span>
                             <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${TIPO_CHIP[m.tipo]}`}>
                               {tipoLabel(m.tipo)}
                             </span>
                          </div>
                          
                          <div className="flex flex-shrink-0 items-center pl-2 gap-1">
                            <button type="button" onClick={() => handleMovDelete(m)} className="rounded-full bg-red-500/10 p-1.5 text-red-500 transition-colors hover:bg-red-500/20">
                               <IconTrash />
                            </button>
                          </div>
                       </div>
                       
                       {/* Body details */}
                       <div className="grid grid-cols-2 gap-3">
                         <div className="col-span-2 flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                           <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Insumo</span>
                           <span className="truncate text-xs font-semibold text-black dark:text-white" title={ins?.nombre ?? undefined}>
                             {ins?.nombre ?? "-"}
                           </span>
                           <span className="truncate text-[10px] text-body-color dark:text-body-color-dark" title={m.descripcion ?? undefined}>
                             {m.descripcion ?? "-"}
                           </span>
                         </div>
                         
                         <div className="col-span-2 flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                           <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Cultivo / Finca</span>
                           <span className="truncate text-xs font-semibold text-black dark:text-white" title={cu ? cultivoLabel(cu, variedadById) : undefined}>
                             {cu ? cultivoLabel(cu, variedadById) : "-"}
                           </span>
                           <span className="truncate text-[10px] text-body-color dark:text-body-color-dark" title={ub ? ubicacionLabel(ub) : undefined}>
                             {ub ? ubicacionLabel(ub) : "-"}
                           </span>
                         </div>
                       </div>
                       
                       {/* Footer Cost */}
                       <div className="mt-1 grid grid-cols-2 items-center gap-3 border-t border-stroke/50 pt-3 dark:border-strokedark/50">
                         <div className="col-span-2 flex flex-col gap-0.5 text-right">
                           <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Cantidad Movi.</span>
                           <span className="tabular-nums text-[13px] font-bold text-black dark:text-white">
                             {m.tipo === "AJUSTE" && m.cantidad > 0 ? "+" : ""}
                             {m.cantidad} {m.unidad}
                           </span>
                         </div>
                       </div>
                     </div>
                   );
                 })
               )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: REPORTE DE COMPRAS ── */}
      {activeTab === "compras" && (
        <div>
          <div className="mb-4 flex flex-col gap-4 rounded-xl border border-stroke bg-white p-4 dark:border-strokedark dark:bg-dark">
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-start">
              <div className="col-span-1">
                <label className={labelCls}>Desde (planeada)</label>
                <input
                  type="date"
                  value={comprasFechaInicio}
                  onChange={(e) => setComprasFechaInicio(e.target.value)}
                  className={`${inputCls} w-full sm:w-[130px]`}
                />
              </div>
              <div className="col-span-1">
                <label className={labelCls}>Hasta (planeada)</label>
                <input
                  type="date"
                  value={comprasFechaFin}
                  onChange={(e) => setComprasFechaFin(e.target.value)}
                  className={`${inputCls} w-full sm:w-[130px]`}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Select
                  label="Cultivos a considerar"
                  value={estadoCultivoFilter}
                  onChange={(e) => setEstadoCultivoFilter(e.target.value)}
                  wrapperClassName="w-full sm:w-[220px]"
                >
                  <option value="todos">Activos y Planificados</option>
                  <option value="activo">Solo Activos</option>
                  <option value="planificado">Solo Planificados</option>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stroke/50 pt-3 dark:border-strokedark/50">
               {/* VIEW TOGGLE */}
               <div className="hidden items-center rounded-lg border border-stroke bg-gray-50/50 p-1 dark:border-strokedark dark:bg-dark md:flex">
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
                 onClick={refreshNecesidad}
                 disabled={loadingNecesidad}
                 className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-60 dark:bg-white/10 dark:hover:bg-white/20 sm:w-auto sm:ml-auto"
               >
                 <IconRefresh size={14} />
                 {loadingNecesidad ? "Calculando…" : "Recalcular"}
               </button>
            </div>
          </div>

          <div className="w-full">
            {/* Table View */}
            <div className={`${viewMode === "table" ? "hidden md:block" : "hidden"} overflow-hidden rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark`}>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stroke bg-gray-50/70 dark:border-strokedark dark:bg-white/5">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Insumo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Unidad</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Stock Actual</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Requerido</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Déficit</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Stock Mínimo</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Alerta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark">
                    {necesidad.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-body-color dark:text-body-color-dark">
                            {loadingNecesidad
                            ? "Calculando necesidades…"
                            : (comprasFechaInicio || comprasFechaFin)
                              ? "No hay déficits en el período seleccionado."
                              : "No hay déficits en los cultivos activos y planificados."}
                        </td>
                      </tr>
                    ) : (
                      necesidad.map((n) => {
                        const bajominimo =
                          n.stock_minimo != null && n.stock_actual <= n.stock_minimo;
                        return (
                          <tr key={n.id_insumo} className={`transition-colors hover:bg-gray-50/60 dark:hover:bg-white/3 ${n.deficit > 0 ? "bg-red-50/30 dark:bg-red-500/5" : ""}`}>
                            <td className="px-4 py-3 font-medium text-black dark:text-white">{n.nombre}</td>
                            <td className="px-4 py-3 text-body-color dark:text-body-color-dark">{n.unidad_medida ?? "-"}</td>
                            <td className="px-4 py-3 text-right text-body-color dark:text-body-color-dark">{n.stock_actual}</td>
                            <td className="px-4 py-3 text-right text-body-color dark:text-body-color-dark">{n.requerido_total.toFixed(2)}</td>
                            <td className={`px-4 py-3 text-right font-bold ${n.deficit > 0 ? "text-red-600 dark:text-red-400" : "text-primary dark:text-primary-300"}`}>
                              {n.deficit > 0 ? n.deficit.toFixed(2) : "OK"}
                            </td>
                            <td className="px-4 py-3 text-right text-body-color dark:text-body-color-dark">{n.stock_minimo ?? "-"}</td>
                            <td className="px-4 py-3 text-center">
                              {bajominimo ? (
                                <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-500/15 dark:text-red-400">
                                  Bajo mínimo
                                </span>
                              ) : (
                                <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                                  Normal
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {necesidad.length > 0 && (
                <div className="border-t border-stroke px-4 py-3 text-xs text-body-color dark:border-strokedark dark:text-body-color-dark">
                  {necesidad.length} insumo{necesidad.length !== 1 ? "s" : ""} requieren atención
                </div>
              )}
            </div>

            {/* Card View */}
            <div className={`${viewMode === "table" ? "grid md:hidden" : "grid"} grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}>
               {necesidad.length === 0 ? (
                 <div className="col-span-full rounded-xl border border-stroke bg-white px-4 py-10 text-center text-sm text-body-color dark:border-strokedark dark:bg-dark dark:text-body-color-dark">
                     {loadingNecesidad
                     ? "Calculando necesidades…"
                     : (comprasFechaInicio || comprasFechaFin)
                       ? "No hay déficits en el período seleccionado."
                       : "No hay déficits en los cultivos activos y planificados."}
                 </div>
               ) : (
                 necesidad.map((n) => {
                   const bajominimo = n.stock_minimo != null && n.stock_actual <= n.stock_minimo;
                   const requiresPurchase = n.deficit > 0;
                   return (
                     <div key={n.id_insumo} className={`group relative flex flex-col gap-3 overflow-hidden rounded-xl border ${requiresPurchase ? "border-red-300 bg-red-50/40 dark:border-red-500/30 dark:bg-red-500/5 hover:border-red-400" : "border-stroke bg-white dark:border-strokedark dark:bg-dark hover:border-primary/50"} p-3.5 shadow-sm transition-all hover:shadow-md`}>
                       {/* Header */}
                       <div className="flex items-center justify-between border-b border-stroke/50 pb-2 dark:border-strokedark/50">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-black dark:text-white truncate" title={n.nombre}>{n.nombre}</span>
                          </div>
                          {bajominimo && <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-500/15 dark:text-red-400">Bajo Mín.</span>}
                          {!bajominimo && <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-600 dark:bg-white/10 dark:text-gray-300">Normal</span>}
                       </div>
                       
                       {/* Body calculations */}
                       <div className="grid grid-cols-2 gap-3">
                         <div className="flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                           <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Stock Actual</span>
                           <span className="text-sm font-bold text-black dark:text-white">{n.stock_actual} <span className="text-[10px] font-normal uppercase text-body-color dark:text-body-color-dark">{n.unidad_medida ?? ""}</span></span>
                         </div>
                         <div className="flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                           <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Requerido</span>
                           <span className="text-sm font-semibold text-body-color dark:text-body-color-dark">{n.requerido_total.toFixed(2)} <span className="text-[10px] font-normal uppercase">{n.unidad_medida ?? ""}</span></span>
                         </div>
                       </div>
                       
                       {/* Footer Deficit */}
                       <div className="mt-1 flex items-center justify-between border-t border-stroke/50 pt-2 dark:border-strokedark/50">
                         <div className="flex flex-col gap-0.5">
                           <span className="text-[9px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Stock Mínimo</span>
                           <span className="text-[11px] font-medium text-body-color dark:text-body-color-dark">{n.stock_minimo != null ? `${n.stock_minimo} ${n.unidad_medida ?? ""}` : "-"}</span>
                         </div>
                         <div className="flex flex-col gap-0.5 text-right">
                           <span className="text-[9px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Déficit</span>
                           <span className={`tabular-nums text-[13px] font-bold ${requiresPurchase ? "text-red-600 dark:text-red-400" : "text-primary dark:text-primary-300"}`}>
                             {requiresPurchase ? n.deficit.toFixed(2) : "OK"} <span className="text-[9px] font-normal uppercase">{n.unidad_medida ?? ""}</span>
                           </span>
                         </div>
                       </div>
                     </div>
                   );
                 })
               )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Nuevo Movimiento ── */}
      <Modal
        open={modalOpen}
        title="Registrar Movimiento"
        onClose={closeModal}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-body-color transition-colors hover:bg-gray-100 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="inventario-mov-form"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Registrar"}
            </button>
          </>
        }
      >
        <form id="inventario-mov-form" onSubmit={handleMovSubmit}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {/* Insumo */}
            <div>
              <label className={labelCls}>Insumo *</label>
              <Select
                value={movForm.id_insumo}
                onChange={(e) => onMovInsumoChange(e.target.value)}
              >
                <option value="">Seleccionar insumo…</option>
                {insumosList.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}{i.unidad_medida ? ` (${i.unidad_medida})` : ""} — Stock: {i.stock_actual}
                  </option>
                ))}
              </Select>
              {selectedInsumo && movForm.tipo === "ENTRADA" && (
                <p className="mt-1 text-xs text-body-color/70 dark:text-body-color-dark/70">
                  Stock actual: {selectedInsumo.stock_actual} {selectedInsumo.unidad_medida ?? ""}
                  {selectedInsumo.valor_unitario != null
                    ? ` — Precio prom. actual: $${selectedInsumo.valor_unitario.toLocaleString()}`
                    : ""}
                </p>
              )}
            </div>

            {/* Tipo */}
            <div>
              <label className={labelCls}>Tipo de movimiento *</label>
              <Select
                value={movForm.tipo}
                onChange={(e) => setMovField("tipo", e.target.value as TipoMovimiento)}
              >
                <option value="ENTRADA">Entrada (compra / recepción)</option>
                <option value="SALIDA">Salida (uso / consumo)</option>
                <option value="AJUSTE">Ajuste (corrección de stock)</option>
              </Select>
            </div>

            {/* Fecha */}
            <div>
              <label className={labelCls}>Fecha *</label>
              <input
                type="date"
                required
                value={movForm.fecha}
                onChange={(e) => setMovField("fecha", e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Finca */}
            <div>
              <label className={labelCls}>Finca *</label>
              <Select
                value={movForm.id_ubicacion}
                onChange={(e) => setMovField("id_ubicacion", e.target.value)}
              >
                <option value="">Seleccionar finca…</option>
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>{ubicacionLabel(u)}</option>
                ))}
              </Select>
            </div>

            {/* Cultivo */}
            <div>
              <label className={labelCls}>Cultivo (opcional)</label>
              <Select
                value={movForm.id_cultivo}
                onChange={(e) => onMovCultivoChange(e.target.value)}
              >
                <option value="">Sin cultivo</option>
                {cultivos.map((c) => (
                  <option key={c.id} value={c.id}>{cultivoLabel(c, variedadById)}</option>
                ))}
              </Select>
            </div>

            {/* Insumo planificado link */}
            {movForm.id_cultivo && pickerInsumosCultivo.length > 0 && (
              <div>
                <label className={labelCls}>Vincular a requerimiento planeado</label>
                <Select
                  value={movForm.id_insumos_cultivo}
                  onChange={(e) => setMovField("id_insumos_cultivo", e.target.value)}
                >
                  <option value="">Sin vínculo</option>
                  {pickerInsumosCultivo
                    .filter((ic) => !movForm.id_insumo || ic.id_insumo === movForm.id_insumo)
                    .map((ic) => (
                      <option key={ic.id} value={ic.id}>
                        {ic.nombre_insumo ?? "?"} Sem {ic.nro_semana ?? "?"} ({ic.cantidad_requerida} {ic.unidad_medida ?? ""})
                      </option>
                    ))}
                </Select>
              </div>
            )}

            {/* Cantidad or Ajuste objetivo */}
            {movForm.tipo === "AJUSTE" ? (
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Nueva cantidad en stock (objetivo)
                  {selectedInsumo && (
                    <span className="ml-1 text-body-color/60">
                      — actual: {selectedInsumo.stock_actual} {selectedInsumo.unidad_medida ?? ""}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={movForm.ajusteObjetivo}
                  onChange={(e) => setMovField("ajusteObjetivo", e.target.value)}
                  placeholder="Nueva cantidad total en stock"
                  className={inputCls}
                />
                {movForm.ajusteObjetivo !== "" && selectedInsumo && !isNaN(parseFloat(movForm.ajusteObjetivo)) && (
                  <p className="mt-1 text-xs text-body-color/60 dark:text-body-color-dark/60">
                    Delta:{" "}
                    {parseFloat(movForm.ajusteObjetivo) - selectedInsumo.stock_actual >= 0 ? "+" : ""}
                    {(parseFloat(movForm.ajusteObjetivo) - selectedInsumo.stock_actual).toFixed(2)}{" "}
                    {selectedInsumo.unidad_medida ?? ""}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className={labelCls}>Cantidad *</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={movForm.cantidad}
                  onChange={(e) => setMovField("cantidad", e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
            )}

            {/* Unidad */}
            <div>
              <label className={labelCls}>Unidad</label>
              <input
                type="text"
                value={movForm.unidad}
                onChange={(e) => setMovField("unidad", e.target.value)}
                placeholder="kg, L, unidades…"
                className={inputCls}
              />
            </div>

            {/* Precio unitario (ENTRADA only) */}
            {movForm.tipo === "ENTRADA" && (
              <div>
                <label className={labelCls}>Precio unitario</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={movForm.precio_unitario}
                  onChange={(e) => setMovField("precio_unitario", e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
                {selectedInsumo &&
                  movForm.precio_unitario !== "" &&
                  movForm.cantidad !== "" &&
                  !isNaN(parseFloat(movForm.precio_unitario)) &&
                  !isNaN(parseFloat(movForm.cantidad)) && (() => {
                    const qty = parseFloat(movForm.cantidad);
                    const newPrice = parseFloat(movForm.precio_unitario);
                    const oldStock = selectedInsumo.stock_actual;
                    const oldPrice = selectedInsumo.valor_unitario ?? newPrice;
                    const newAvg =
                      oldStock <= 0
                        ? newPrice
                        : Math.round(
                            ((oldStock * oldPrice + qty * newPrice) /
                              (oldStock + qty)) *
                              100,
                          ) / 100;
                    return (
                      <p className="mt-1 text-xs text-body-color/70 dark:text-body-color-dark/70">
                        Nuevo precio promedio estimado:{" "}
                        {newAvg.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    );
                  })()}
              </div>
            )}

            {/* Referencia */}
            <div>
              <label className={labelCls}>Referencia / Factura</label>
              <input
                type="text"
                value={movForm.referencia}
                onChange={(e) => setMovField("referencia", e.target.value)}
                placeholder="No. factura, orden de compra…"
                className={inputCls}
              />
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Descripción</label>
              <input
                type="text"
                value={movForm.descripcion}
                onChange={(e) => setMovField("descripcion", e.target.value)}
                placeholder="Motivo o detalle del movimiento"
                className={inputCls}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
