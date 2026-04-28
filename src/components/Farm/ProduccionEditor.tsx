"use client";

import { useMemo, useState, useTransition } from "react";
import { createSPASassClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/Common/ConfirmProvider";
import Modal from "@/components/Common/Modal";
import Select from "@/components/Common/Select";
import {
  type Produccion,
  type ProduccionInput,
  type EstadoVenta,
  type CicloCultivo,
  ESTADOS_VENTA,
  createProduccion,
  updateProduccion,
  deleteProduccion,
  listCiclosCultivo,
} from "@/lib/farm/produccion";
import type { Cultivo } from "@/lib/farm/cultivos";
import type { Ubicacion } from "@/lib/farm/ubicaciones";
import type { Variedad } from "@/lib/farm/variedades";

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

function ubicacionLabel(u: Ubicacion): string {
  const parts = [u.nombre_cultivo, u.vereda].filter(Boolean);
  return parts.length > 0 ? parts.join(" – ") : "Sin nombre";
}

function cultivoLabel(c: Cultivo, variedadById: Map<string, Variedad>): string {
  const variedad = c.id_variedad ? variedadById.get(c.id_variedad) : null;
  return `#${c.numero_cultivo}${variedad ? ` – ${variedad.nombre}` : ""}`;
}

function cicloLabel(c: CicloCultivo): string {
  const parts = [
    c.ciclo_produccion,
    c.nro_semana != null ? `Sem ${c.nro_semana}` : null,
    c.fecha_planeada,
    c.cantidad_planeada != null ? `(${c.cantidad_planeada} planeada)` : null,
  ].filter(Boolean);
  return parts.join(" – ");
}

function calcTotal(
  cantidad: number | null,
  precio: number | null,
  moneda: string | null,
  tasaCambio: number,
): number {
  const q = cantidad ?? 0;
  const p = precio ?? 0;
  let total = q * p;
  if (moneda === "USD") total = total * tasaCambio;
  return Math.round(total);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProduccionEditorProps {
  initialProducciones: Produccion[];
  cultivos: Cultivo[];
  ubicaciones: Ubicacion[];
  variedades: Variedad[];
  tasaCambio: number;
  initialFechaInicio?: string;
  initialFechaFin?: string;
}

type Banner = { kind: "success" | "error"; text: string } | null;

const UNIDADES = ["tallos", "kg", "lb", "unidades", "litros"] as const;

const ESTADO_CHIP: Record<EstadoVenta, string> = {
  Pendiente:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
  Vendido:
    "bg-primary-100 text-primary dark:bg-primary-500/15 dark:text-primary-300",
  Cancelado:
    "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
};

function emptyForm(): ProduccionInput {
  return {
    id_ubicacion: null,
    id_cultivo: null,
    id_ciclo_cultivo: null,
    fecha: today(),
    cantidad_cosechada: null,
    unidad: "tallos",
    perdidas: null,
    motivo_perdida: null,
    moneda: "COP",
    precio_venta: null,
    costo_total: null,
    comprador: null,
    estado_venta: "Pendiente",
    observaciones: null,
  };
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconEdit({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProduccionEditor({
  initialProducciones,
  cultivos,
  ubicaciones,
  variedades,
  tasaCambio,
  initialFechaInicio,
  initialFechaFin,
}: ProduccionEditorProps) {
  const confirm = useConfirm();
  const defaultRange = currentMonthRange();

  // ── List state ──────────────────────────────────────────────────────────────
  const [producciones, setProducciones] =
    useState<Produccion[]>(initialProducciones);
  const [banner, setBanner] = useState<Banner>(null);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [fechaInicio, setFechaInicio] = useState(
    initialFechaInicio ?? defaultRange.start,
  );
  const [fechaFin, setFechaFin] = useState(
    initialFechaFin ?? defaultRange.end,
  );
  const [ubicacionFilter, setUbicacionFilter] = useState("");
  const [cultivoFilter, setCultivoFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produccion | null>(null);
  const [form, setForm] = useState<ProduccionInput>(emptyForm());
  const [saving, setSaving] = useState(false);

  // ── Ciclos picker state ─────────────────────────────────────────────────────
  const [ciclos, setCiclos] = useState<CicloCultivo[]>([]);
  const [loadingCiclos, setLoadingCiclos] = useState(false);
  const [, startCiclosTransition] = useTransition();

  // ── Lookup maps ─────────────────────────────────────────────────────────────
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

  // ── Computed total ──────────────────────────────────────────────────────────
  const computedTotal = calcTotal(
    form.cantidad_cosechada ?? null,
    form.precio_venta ?? null,
    form.moneda ?? "COP",
    tasaCambio,
  );

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return producciones.filter((p) => {
      if (fechaInicio && (p.fecha ?? "") < fechaInicio) return false;
      if (fechaFin && (p.fecha ?? "") > fechaFin) return false;
      if (ubicacionFilter && p.id_ubicacion !== ubicacionFilter) return false;
      if (cultivoFilter && p.id_cultivo !== cultivoFilter) return false;
      if (estadoFilter && p.estado_venta !== estadoFilter) return false;
      return true;
    });
  }, [producciones, fechaInicio, fechaFin, ubicacionFilter, cultivoFilter, estadoFilter]);

  // ── Banner ──────────────────────────────────────────────────────────────────
  function showBanner(b: Banner) {
    setBanner(b);
    if (b) setTimeout(() => setBanner(null), 3500);
  }

  // ── Modal open/close ────────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setCiclos([]);
    setModalOpen(true);
  }

  function openEdit(p: Produccion) {
    setEditing(p);
    setForm({
      id_ubicacion: p.id_ubicacion,
      id_cultivo: p.id_cultivo,
      id_ciclo_cultivo: p.id_ciclo_cultivo,
      fecha: p.fecha,
      cantidad_cosechada: p.cantidad_cosechada,
      unidad: p.unidad ?? "tallos",
      perdidas: p.perdidas,
      motivo_perdida: p.motivo_perdida,
      moneda: p.moneda ?? "COP",
      precio_venta: p.precio_venta,
      costo_total: p.costo_total,
      comprador: p.comprador,
      estado_venta: p.estado_venta ?? "Pendiente",
      observaciones: p.observaciones,
    });
    setCiclos([]);
    if (p.id_cultivo) {
      fetchCiclos(p.id_cultivo);
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setCiclos([]);
  }

  // ── Ciclos fetch ────────────────────────────────────────────────────────────
  function fetchCiclos(cultivoId: string) {
    setLoadingCiclos(true);
    setCiclos([]);
    startCiclosTransition(() => {
      const client = createSPASassClient().getSupabaseClient();
      listCiclosCultivo(client, cultivoId)
        .then((rows) => {
          setCiclos(rows);
        })
        .catch(() => {
          setCiclos([]);
        })
        .finally(() => {
          setLoadingCiclos(false);
        });
    });
  }

  // ── Form field helpers ──────────────────────────────────────────────────────
  function setField<K extends keyof ProduccionInput>(
    key: K,
    value: ProduccionInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onCultivoChange(cultivoId: string) {
    setField("id_cultivo", cultivoId || null);
    setField("id_ciclo_cultivo", null);
    setCiclos([]);

    if (cultivoId) {
      const cultivo = cultivoById.get(cultivoId);
      // Auto-fill ubicación from cultivo if not already set
      if (cultivo?.id_ubicacion && !form.id_ubicacion) {
        setField("id_ubicacion", cultivo.id_ubicacion);
      }
      fetchCiclos(cultivoId);
    }
  }

  function onCicloChange(cicloId: string) {
    setField("id_ciclo_cultivo", cicloId || null);
    if (cicloId) {
      const ciclo = ciclos.find((c) => c.id === cicloId);
      if (ciclo) {
        if (ciclo.cantidad_planeada != null) {
          setField("cantidad_cosechada", ciclo.cantidad_planeada);
        }
        const obs = [
          ciclo.ciclo_produccion,
          ciclo.nro_semana != null ? `Sem ${ciclo.nro_semana}` : null,
          ciclo.fecha_planeada ?? null,
          `(Planeada: ${ciclo.cantidad_planeada ?? 0})`,
        ]
          .filter(Boolean)
          .join(" - ");
        setField("observaciones", obs);
      }
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const payload: ProduccionInput = {
      ...form,
      costo_total: computedTotal || null,
    };

    try {
      const client = createSPASassClient().getSupabaseClient();
      if (editing) {
        const updated = await updateProduccion(client, editing.id, payload);
        setProducciones((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );
        showBanner({ kind: "success", text: "Producción actualizada" });
      } else {
        const created = await createProduccion(client, payload);
        setProducciones((prev) => [created, ...prev]);
        showBanner({ kind: "success", text: "Producción registrada" });
      }
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

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(p: Produccion) {
    const ok = await confirm({
      title: "Eliminar registro",
      description: `¿Eliminar la cosecha del ${p.fecha ?? "sin fecha"}? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!ok) return;

    try {
      const client = createSPASassClient().getSupabaseClient();
      await deleteProduccion(client, p.id);
      setProducciones((prev) => prev.filter((x) => x.id !== p.id));
      showBanner({ kind: "success", text: "Registro eliminado" });
    } catch (err) {
      showBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Error al eliminar",
      });
    }
  }

  // ── Limpiar filtros ─────────────────────────────────────────────────────────
  function clearFilters() {
    const range = currentMonthRange();
    setFechaInicio(range.start);
    setFechaFin(range.end);
    setUbicacionFilter("");
    setCultivoFilter("");
    setEstadoFilter("");
  }

  // ── Label helpers ───────────────────────────────────────────────────────────
  function getUbicacionLabel(id: string | null): string {
    if (!id) return "-";
    const u = ubicacionById.get(id);
    return u ? ubicacionLabel(u) : "-";
  }

  function getCultivoLabel(id: string | null): string {
    if (!id) return "-";
    const c = cultivoById.get(id);
    return c ? cultivoLabel(c, variedadById) : "-";
  }

  // ── Input class ─────────────────────────────────────────────────────────────
  const inputCls =
    "w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition-colors duration-150 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-dark dark:text-white dark:hover:border-primary/40 dark:focus:ring-primary/15";

  const labelCls =
    "mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark";

  // ── Render ──────────────────────────────────────────────────────────────────
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

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4">
        {/* Filters Row */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-start">
          {/* Date range */}
          <div className="col-span-1">
            <label className={labelCls}>Fecha inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className={inputCls + " w-full sm:w-[130px]"}
            />
          </div>
          <div className="col-span-1">
            <label className={labelCls}>Fecha fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={inputCls + " w-full sm:w-[130px]"}
            />
          </div>
          {/* Ubicación filter */}
          <div className="col-span-2 sm:col-span-1">
            <Select
              label="Ubicación"
              value={ubicacionFilter}
              onChange={(e) => setUbicacionFilter(e.target.value)}
              wrapperClassName="w-full sm:w-[160px]"
            >
              <option value="">Todas</option>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id}>
                  {ubicacionLabel(u)}
                </option>
              ))}
            </Select>
          </div>
          {/* Cultivo filter */}
          <div className="col-span-2 sm:col-span-1">
            <Select
              label="Cultivo"
              value={cultivoFilter}
              onChange={(e) => setCultivoFilter(e.target.value)}
              wrapperClassName="w-full sm:w-[180px]"
            >
              <option value="">Todos</option>
              {cultivos.map((c) => (
                <option key={c.id} value={c.id}>
                  {cultivoLabel(c, variedadById)}
                </option>
              ))}
            </Select>
          </div>
          {/* Estado venta filter */}
          <div className="col-span-2 sm:col-span-1">
            <Select
              label="Estado venta"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              wrapperClassName="w-full sm:w-[130px]"
            >
              <option value="">Todos</option>
              {ESTADOS_VENTA.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </div>
          {/* Clear */}
          <div className="col-span-2 sm:col-span-1 sm:self-end">
            <button
              type="button"
              onClick={clearFilters}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-stroke px-3 py-2 text-xs font-medium text-body-color transition-colors hover:bg-gray-100 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5 sm:w-auto"
            >
              <IconX />
              Limpiar
            </button>
          </div>
        </div>

        {/* Action Row */}
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
             onClick={openCreate}
             className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 dark:bg-primary dark:hover:bg-primary-400 sm:w-auto sm:ml-auto"
           >
             <IconPlus />
             Registrar producción
           </button>
        </div>
      </div>

      {/* Views */}
      <div className="w-full">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary dark:bg-primary-500/15 dark:text-primary-300">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-black dark:text-white">
              No hay producción registrada
            </p>
            <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
              Registra tus cosechas con el botón de arriba
            </p>
          </div>
        ) : (
          <>
            {/* Table View (Desktop Only) */}
            <div className={`${viewMode === "table" ? "hidden md:block" : "hidden"} overflow-hidden rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark`}>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stroke bg-gray-50 dark:border-strokedark dark:bg-white/[0.03]">
                      {[
                        "Fecha",
                        "Ubicación",
                        "Cultivo",
                        "Cosechado",
                        "Pérdidas",
                        "Precio",
                        "Total COP",
                        "Comprador",
                        "Estado",
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
                    {filtered.map((p) => {
                      const estado = p.estado_venta ?? "Pendiente";
                      const chipCls = ESTADO_CHIP[estado as EstadoVenta] ?? ESTADO_CHIP.Pendiente;
                      return (
                        <tr
                          key={p.id}
                          className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-black dark:text-white">
                            {p.fecha ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-xs text-body-color dark:text-body-color-dark">
                            {getUbicacionLabel(p.id_ubicacion)}
                          </td>
                          <td className="px-4 py-3 text-xs text-body-color dark:text-body-color-dark">
                            {getCultivoLabel(p.id_cultivo)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="font-medium text-black dark:text-white">
                              {p.cantidad_cosechada ?? 0}
                            </span>{" "}
                            <span className="text-xs text-body-color dark:text-body-color-dark">
                              {p.unidad ?? ""}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-body-color dark:text-body-color-dark">
                            {p.perdidas ?? 0}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-body-color dark:text-body-color-dark">
                            {p.moneda ?? "COP"} $
                            {(p.precio_venta ?? 0).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-black dark:text-white">
                            COP ${(p.costo_total ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-body-color dark:text-body-color-dark">
                            {p.comprador ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${chipCls}`}
                            >
                              {estado}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEdit(p)}
                                title="Editar"
                                className="rounded-md p-1.5 text-body-color transition-colors hover:bg-primary-100 hover:text-primary dark:text-body-color-dark dark:hover:bg-primary-500/15 dark:hover:text-primary-300"
                              >
                                <IconEdit />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(p)}
                                title="Eliminar"
                                className="rounded-md p-1.5 text-body-color transition-colors hover:bg-red-100 hover:text-red-600 dark:text-body-color-dark dark:hover:bg-red-500/15 dark:hover:text-red-400"
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card View (Mobile always, Desktop if selected) */}
            <div className={`${viewMode === "table" ? "grid md:hidden" : "grid"} grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}>
              {filtered.map((p) => {
                const estado = p.estado_venta ?? "Pendiente";
                const chipCls = ESTADO_CHIP[estado as EstadoVenta] ?? ESTADO_CHIP.Pendiente;
                
                return (
                  <div key={p.id} className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-stroke bg-white p-3.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md dark:border-strokedark dark:bg-dark">
                    
                    {/* Header: Fecha, Estado y Acciones */}
                    <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-strokedark">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-black dark:text-white">{p.fecha ?? "-"}</span>
                        <span className={["inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide", chipCls].join(" ")}>
                          {estado}
                        </span>
                      </div>

                      <div className="flex flex-shrink-0 items-center pl-2 gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="rounded-full bg-primary/10 p-1.5 text-primary transition-colors hover:bg-primary/20 dark:bg-primary-500/10 dark:hover:bg-primary-500/20"
                        >
                           <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="rounded-full bg-red-500/10 p-1.5 text-red-500 transition-colors hover:bg-red-500/20"
                        >
                           <IconTrash />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Cultivo / Ubicación</span>
                        <span className="truncate text-xs font-semibold text-black dark:text-white" title={getCultivoLabel(p.id_cultivo)}>
                          {getCultivoLabel(p.id_cultivo)}
                        </span>
                        <span className="truncate text-[10px] text-body-color dark:text-body-color-dark" title={getUbicacionLabel(p.id_ubicacion)}>
                          {getUbicacionLabel(p.id_ubicacion)}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Cosechado</span>
                        <span className="text-sm font-bold text-primary dark:text-primary-300">
                          {p.cantidad_cosechada ?? 0} <span className="text-[10px] font-normal uppercase text-body-color dark:text-body-color-dark">{p.unidad ?? ""}</span>
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Pérdidas</span>
                        <span className="text-sm font-semibold text-red-500 dark:text-red-400">
                          {p.perdidas ?? 0} <span className="text-[10px] font-normal uppercase text-body-color dark:text-body-color-dark">{p.unidad ?? ""}</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-1 grid grid-cols-2 gap-3 border-t border-stroke/50 pt-3 dark:border-strokedark/50">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Venta Unit.</span>
                        <span className="tabular-nums text-[11px] font-semibold text-black dark:text-white">
                           {p.moneda ?? "COP"} ${(p.precio_venta ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Total</span>
                        <span className="tabular-nums text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                           COP ${(p.costo_total ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        title={editing ? "Editar producción" : "Registrar producción"}
        description="Cosecha, pérdidas y venta por cultivo."
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
              form="produccion-form"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-60 dark:hover:bg-primary-400"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </>
        }
      >
        <form id="produccion-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {/* Ubicación */}
            <div>
              <label className={labelCls}>
                Ubicación <span className="text-red-500">*</span>
              </label>
              <Select
                required
                value={form.id_ubicacion ?? ""}
                onChange={(e) => setField("id_ubicacion", e.target.value || null)}
              >
                <option value="">Seleccione…</option>
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>
                    {ubicacionLabel(u)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Fecha */}
            <div>
              <label className={labelCls}>
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.fecha ?? ""}
                onChange={(e) => setField("fecha", e.target.value || null)}
                className={inputCls}
              />
            </div>

            {/* Cultivo */}
            <div>
              <label className={labelCls}>
                Cultivo{" "}
                <span className="font-normal text-body-color/60">(opcional)</span>
              </label>
              <Select
                value={form.id_cultivo ?? ""}
                onChange={(e) => onCultivoChange(e.target.value)}
              >
                <option value="">— Sin cultivo —</option>
                {cultivos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {cultivoLabel(c, variedadById)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Ciclo (conditional) */}
            {form.id_cultivo && (
              <div>
                <label className={labelCls}>Ciclo de producción</label>
                {loadingCiclos ? (
                  <p className="py-2 text-xs text-body-color dark:text-body-color-dark">
                    Cargando ciclos…
                  </p>
                ) : ciclos.length === 0 ? (
                  <p className="py-2 text-xs text-body-color/60 dark:text-body-color-dark/60">
                    Sin ciclos generados para este cultivo
                  </p>
                ) : (
                  <Select
                    value={form.id_ciclo_cultivo ?? ""}
                    onChange={(e) => onCicloChange(e.target.value)}
                  >
                    <option value="">— Seleccione ciclo —</option>
                    {ciclos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {cicloLabel(c)}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            )}

            {/* Cantidad cosechada */}
            <div>
              <label className={labelCls}>
                Cantidad cosechada <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.cantidad_cosechada ?? ""}
                onChange={(e) =>
                  setField(
                    "cantidad_cosechada",
                    e.target.value === "" ? null : parseFloat(e.target.value),
                  )
                }
                className={inputCls}
              />
            </div>

            {/* Unidad */}
            <div>
              <label className={labelCls}>
                Unidad <span className="text-red-500">*</span>
              </label>
              <Select
                required
                value={form.unidad ?? "tallos"}
                onChange={(e) => setField("unidad", e.target.value)}
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </div>

            {/* Pérdidas */}
            <div>
              <label className={labelCls}>Pérdidas</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.perdidas ?? ""}
                onChange={(e) =>
                  setField(
                    "perdidas",
                    e.target.value === "" ? null : parseFloat(e.target.value),
                  )
                }
                className={inputCls}
              />
            </div>

            {/* Motivo pérdida */}
            <div>
              <label className={labelCls}>Motivo pérdida</label>
              <input
                type="text"
                placeholder="Descripción"
                value={form.motivo_perdida ?? ""}
                onChange={(e) =>
                  setField("motivo_perdida", e.target.value || null)
                }
                className={inputCls}
              />
            </div>

            {/* Moneda */}
            <div>
              <label className={labelCls}>
                Moneda <span className="text-red-500">*</span>
              </label>
              <Select
                required
                value={form.moneda ?? "COP"}
                onChange={(e) => setField("moneda", e.target.value)}
              >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </Select>
            </div>

            {/* Precio venta */}
            <div>
              <label className={labelCls}>Precio venta</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={form.precio_venta ?? ""}
                onChange={(e) =>
                  setField(
                    "precio_venta",
                    e.target.value === "" ? null : parseFloat(e.target.value),
                  )
                }
                className={inputCls}
              />
            </div>

            {/* Total COP (read-only) */}
            <div>
              <label className={labelCls}>Total (COP)</label>
              <input
                type="number"
                readOnly
                value={computedTotal}
                className={
                  inputCls +
                  " cursor-default bg-gray-50 font-semibold dark:bg-white/[0.04]"
                }
              />
              <p className="mt-1 text-xs text-body-color/60 dark:text-body-color-dark/60">
                Auto-calculado
                {form.moneda === "USD"
                  ? ` (tasa: ${tasaCambio.toLocaleString()})`
                  : ""}
              </p>
            </div>

            {/* Comprador */}
            <div>
              <label className={labelCls}>Comprador</label>
              <input
                type="text"
                placeholder="Nombre del comprador"
                value={form.comprador ?? ""}
                onChange={(e) => setField("comprador", e.target.value || null)}
                className={inputCls}
              />
            </div>

            {/* Estado venta */}
            <div>
              <label className={labelCls}>Estado venta</label>
              <Select
                value={form.estado_venta ?? "Pendiente"}
                onChange={(e) =>
                  setField("estado_venta", e.target.value as EstadoVenta)
                }
              >
                {ESTADOS_VENTA.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            {/* Observaciones (full width) */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Observaciones</label>
              <textarea
                rows={2}
                placeholder="Notas adicionales"
                value={form.observaciones ?? ""}
                onChange={(e) =>
                  setField("observaciones", e.target.value || null)
                }
                className={inputCls + " resize-none"}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
