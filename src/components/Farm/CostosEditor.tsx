"use client";

import { useMemo, useState, useTransition } from "react";
import { createSPASassClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/Common/ConfirmProvider";
import Modal from "@/components/Common/Modal";
import Select from "@/components/Common/Select";
import {
  type Costo,
  type CostoInput,
  type TipoCosto,
  type InsumosCultivoRow,
  type ActividadesCultivoRow,
  TIPOS_COSTO,
  createCosto,
  updateCosto,
  deleteCosto,
  listInsumosCultivoForCultivo,
  listActividadesCultivoForCultivo,
} from "@/lib/farm/costos";
import {
  createMovimiento,
  deleteMovimientosByCostoId,
} from "@/lib/farm/inventario";
import type { Cultivo } from "@/lib/farm/cultivos";
import type { Ubicacion } from "@/lib/farm/ubicaciones";
import type { Variedad } from "@/lib/farm/variedades";
import type { Insumo } from "@/lib/farm/insumos";

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

function tipoCostoLabel(t: TipoCosto): string {
  const labels: Record<TipoCosto, string> = {
    MANO_OBRA: "Mano de Obra",
    INSUMO: "Insumo",
    GENERAL: "General",
    OTRO: "Otro",
    ARRENDAMIENTO: "Arrendamiento",
    SERVICIO: "Servicio",
  };
  return labels[t] ?? t;
}

function calcTotal(cantidad: number | null, costoUnitario: number | null): number {
  return Math.round((cantidad ?? 0) * (costoUnitario ?? 0));
}

function costoMinutoPorJornal(jornalDia: number, horasJornal: number): number {
  return Math.round((jornalDia / horasJornal / 60) * 100) / 100;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CostosEditorProps {
  initialCostos: Costo[];
  cultivos: Cultivo[];
  ubicaciones: Ubicacion[];
  variedades: Variedad[];
  insumos: Insumo[];
  jornalDia: number;
  horasJornal: number;
  initialFechaInicio?: string;
  initialFechaFin?: string;
}

type Banner = { kind: "success" | "error"; text: string } | null;

const TIPO_CHIP: Record<TipoCosto, string> = {
  MANO_OBRA: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  INSUMO: "bg-primary-100 text-primary dark:bg-primary-500/15 dark:text-primary-300",
  GENERAL: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  OTRO: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  ARRENDAMIENTO: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
  SERVICIO: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
};

function emptyForm(jornalDia: number, horasJornal: number): CostoInput {
  return {
    id_ubicacion: null,
    id_cultivo: null,
    fecha: today(),
    tipo_costo: "MANO_OBRA",
    descripcion: null,
    cantidad: null,
    unidad: "minutos",
    costo_unitario: costoMinutoPorJornal(jornalDia, horasJornal),
    costo_total: null,
    id_insumo: null,
    id_actividad: null,
    responsable: null,
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

export default function CostosEditor({
  initialCostos,
  cultivos,
  ubicaciones,
  variedades,
  insumos,
  jornalDia,
  horasJornal,
  initialFechaInicio,
  initialFechaFin,
}: CostosEditorProps) {
  const confirm = useConfirm();
  const defaultRange = currentMonthRange();
  const costoMinuto = costoMinutoPorJornal(jornalDia, horasJornal);

  // ── List state ──────────────────────────────────────────────────────────────
  const [costos, setCostos] = useState<Costo[]>(initialCostos);
  const [banner, setBanner] = useState<Banner>(null);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [fechaInicio, setFechaInicio] = useState(
    initialFechaInicio ?? defaultRange.start,
  );
  const [fechaFin, setFechaFin] = useState(initialFechaFin ?? defaultRange.end);
  const [tipoFilter, setTipoFilter] = useState("");
  const [ubicacionFilter, setUbicacionFilter] = useState("");
  const [cultivoFilter, setCultivoFilter] = useState("");

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Costo | null>(null);
  const [form, setForm] = useState<CostoInput>(emptyForm(jornalDia, horasJornal));
  const [saving, setSaving] = useState(false);

  // ── Contextual picker state ─────────────────────────────────────────────────
  const [insumosCultivo, setInsumosCultivo] = useState<InsumosCultivoRow[]>([]);
  const [actividadesCultivo, setActividadesCultivo] = useState<ActividadesCultivoRow[]>([]);
  const [loadingPickers, setLoadingPickers] = useState(false);
  const [, startPickersTransition] = useTransition();

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

  const insumoById = useMemo(() => {
    const m = new Map<string, Insumo>();
    for (const i of insumos) m.set(i.id, i);
    return m;
  }, [insumos]);

  // ── Computed total ──────────────────────────────────────────────────────────
  const computedTotal = calcTotal(form.cantidad ?? null, form.costo_unitario ?? null);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return costos.filter((c) => {
      if (fechaInicio && (c.fecha ?? "") < fechaInicio) return false;
      if (fechaFin && (c.fecha ?? "") > fechaFin) return false;
      if (tipoFilter && c.tipo_costo !== tipoFilter) return false;
      if (ubicacionFilter && c.id_ubicacion !== ubicacionFilter) return false;
      if (cultivoFilter && c.id_cultivo !== cultivoFilter) return false;
      return true;
    });
  }, [costos, fechaInicio, fechaFin, tipoFilter, ubicacionFilter, cultivoFilter]);

  // ── Banner ──────────────────────────────────────────────────────────────────
  function showBanner(b: Banner) {
    setBanner(b);
    if (b) setTimeout(() => setBanner(null), 3500);
  }

  // ── Modal open/close ────────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm(emptyForm(jornalDia, horasJornal));
    setInsumosCultivo([]);
    setActividadesCultivo([]);
    setModalOpen(true);
  }

  function openEdit(c: Costo) {
    setEditing(c);
    setForm({
      id_ubicacion: c.id_ubicacion,
      id_cultivo: c.id_cultivo,
      fecha: c.fecha,
      tipo_costo: c.tipo_costo,
      descripcion: c.descripcion,
      cantidad: c.cantidad,
      unidad: c.unidad,
      costo_unitario: c.costo_unitario,
      costo_total: c.costo_total,
      id_insumo: c.id_insumo,
      id_actividad: c.id_actividad,
      responsable: c.responsable,
      observaciones: c.observaciones,
    });
    setInsumosCultivo([]);
    setActividadesCultivo([]);
    if (c.id_cultivo) fetchPickers(c.id_cultivo);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setInsumosCultivo([]);
    setActividadesCultivo([]);
  }

  // ── Pickers fetch ────────────────────────────────────────────────────────────
  function fetchPickers(cultivoId: string) {
    setLoadingPickers(true);
    setInsumosCultivo([]);
    setActividadesCultivo([]);
    startPickersTransition(() => {
      const client = createSPASassClient().getSupabaseClient();
      Promise.all([
        listInsumosCultivoForCultivo(client, cultivoId),
        listActividadesCultivoForCultivo(client, cultivoId),
      ])
        .then(([ics, acs]) => {
          setInsumosCultivo(ics);
          setActividadesCultivo(acs);
        })
        .catch(() => {
          setInsumosCultivo([]);
          setActividadesCultivo([]);
        })
        .finally(() => setLoadingPickers(false));
    });
  }

  // ── Form field helpers ──────────────────────────────────────────────────────
  function setField<K extends keyof CostoInput>(key: K, value: CostoInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onCultivoChange(cultivoId: string) {
    setField("id_cultivo", cultivoId || null);
    setField("id_insumo", null);
    setField("id_actividad", null);
    setInsumosCultivo([]);
    setActividadesCultivo([]);

    if (cultivoId) {
      const cultivo = cultivoById.get(cultivoId);
      if (cultivo?.id_ubicacion && !form.id_ubicacion) {
        setField("id_ubicacion", cultivo.id_ubicacion);
      }
      fetchPickers(cultivoId);
    }
  }

  function onTipoChange(tipo: TipoCosto) {
    setField("tipo_costo", tipo);
    setField("id_insumo", null);
    setField("id_actividad", null);
    setField("descripcion", null);
    setField("observaciones", null);

    if (tipo === "MANO_OBRA") {
      setField("unidad", "minutos");
      setField("costo_unitario", costoMinuto);
    } else {
      setField("unidad", null);
      setField("costo_unitario", null);
    }
  }

  function onInsumoCultivoChange(icId: string) {
    if (!icId) {
      setField("id_insumo", null);
      return;
    }
    const ic = insumosCultivo.find((r) => r.id === icId);
    if (!ic) return;
    setField("id_insumo", ic.id_insumo ?? null);
    setField("descripcion", ic.nombre_insumo ?? null);
    setField("cantidad", ic.cantidad_requerida ?? null);
    setField("unidad", ic.unidad_medida ?? null);
    const obs = [
      ic.nombre_insumo,
      ic.nro_semana != null ? `Sem ${ic.nro_semana}` : null,
      ic.fecha_planeada,
      ic.cantidad_requerida != null
        ? `(Req: ${ic.cantidad_requerida} ${ic.unidad_medida ?? ""})`
        : null,
    ]
      .filter(Boolean)
      .join(" - ");
    setField("observaciones", obs);
  }

  function onInsumoCatalogChange(insumoId: string) {
    if (!insumoId) {
      setField("id_insumo", null);
      return;
    }
    const ins = insumoById.get(insumoId);
    if (!ins) return;
    setField("id_insumo", insumoId);
    setField("descripcion", ins.nombre);
    setField("unidad", ins.unidad_medida ?? null);
    setField("costo_unitario", ins.valor_unitario ?? null);
  }

  function onActividadChange(acId: string) {
    if (!acId) {
      setField("id_actividad", null);
      return;
    }
    const ac = actividadesCultivo.find((r) => r.id === acId);
    if (!ac) return;
    setField("id_actividad", ac.id_actividad ?? null);
    setField("descripcion", ac.nombre_actividad ?? null);
    setField("cantidad", ac.tiempo_requerido_min ?? null);
    setField("unidad", "minutos");
    setField("costo_unitario", costoMinuto);
    const obs = [
      ac.nombre_actividad,
      ac.nro_semana != null ? `Sem ${ac.nro_semana}` : null,
      ac.fecha_planeada,
      ac.tiempo_requerido_min != null
        ? `(${(ac.tiempo_requerido_min / 60).toFixed(1)} horas)`
        : null,
    ]
      .filter(Boolean)
      .join(" - ");
    setField("observaciones", obs);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const payload: CostoInput = { ...form, costo_total: computedTotal || null };
    const tipo = form.tipo_costo;

    try {
      const client = createSPASassClient().getSupabaseClient();
      let savedCosto: Costo;
      if (editing) {
        savedCosto = await updateCosto(client, editing.id, payload);
        setCostos((prev) =>
          prev.map((c) => (c.id === savedCosto.id ? savedCosto : c)),
        );
        showBanner({ kind: "success", text: "Costo actualizado" });
      } else {
        savedCosto = await createCosto(client, payload);
        setCostos((prev) => [savedCosto, ...prev]);
        showBanner({ kind: "success", text: "Costo registrado" });
      }

      // If tipo changed away from INSUMO on update, delete old movement
      if (editing && editing.tipo_costo === "INSUMO" && tipo !== "INSUMO") {
        await deleteMovimientosByCostoId(client, editing.id);
      }

      // For INSUMO costs, sync inventory SALIDA movement
      if (tipo === "INSUMO" && savedCosto.id_insumo && savedCosto.id_ubicacion) {
        if (editing) {
          // Clear old linked movement first (trigger will restore stock)
          await deleteMovimientosByCostoId(client, editing.id);
        }
        const insumoObj = insumoById.get(savedCosto.id_insumo);
        await createMovimiento(client, {
          id_insumo: savedCosto.id_insumo,
          tipo: "SALIDA",
          cantidad: savedCosto.cantidad ?? 0,
          unidad: savedCosto.unidad ?? (insumoObj?.unidad_medida ?? ""),
          fecha: savedCosto.fecha ?? today(),
          id_ubicacion: savedCosto.id_ubicacion,
          id_cultivo: savedCosto.id_cultivo ?? null,
          descripcion: savedCosto.descripcion ?? null,
          id_costo: savedCosto.id,
        });
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
  async function handleDelete(c: Costo) {
    const ok = await confirm({
      title: "Eliminar costo",
      description: `¿Eliminar "${c.descripcion ?? tipoCostoLabel(c.tipo_costo)}" del ${c.fecha ?? "sin fecha"}? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!ok) return;

    try {
      const client = createSPASassClient().getSupabaseClient();
      await deleteCosto(client, c.id);
      setCostos((prev) => prev.filter((x) => x.id !== c.id));
      showBanner({ kind: "success", text: "Costo eliminado" });
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
    setTipoFilter("");
    setUbicacionFilter("");
    setCultivoFilter("");
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

  const inputCls =
    "w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition-colors duration-150 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-dark dark:text-white dark:hover:border-primary/40 dark:focus:ring-primary/15";

  const labelCls =
    "mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark";

  const tipo = form.tipo_costo;
  const showInsumoPickers = tipo === "INSUMO";
  const showActividadPicker = tipo === "MANO_OBRA";

  const selectedInsumoCultivoId =
    insumosCultivo.find((ic) => ic.id_insumo === form.id_insumo)?.id ?? "";
  const selectedActividadCultivoId =
    actividadesCultivo.find((ac) => ac.id_actividad === form.id_actividad)?.id ?? "";

  const selectedInsumo = form.id_insumo ? insumoById.get(form.id_insumo) : undefined;
  const stockInsuficiente =
    tipo === "INSUMO" &&
    selectedInsumo != null &&
    (form.cantidad ?? 0) > selectedInsumo.stock_actual;

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

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-stroke bg-white p-4 dark:border-strokedark dark:bg-dark">
        <div>
          <label className={labelCls}>Desde</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className={`${inputCls} w-38`}
          />
        </div>
        <div>
          <label className={labelCls}>Hasta</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className={`${inputCls} w-38`}
          />
        </div>
        <Select
          label="Tipo"
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          wrapperClassName="w-40"
        >
          <option value="">Todos los tipos</option>
          {TIPOS_COSTO.map((t) => (
            <option key={t} value={t}>{tipoCostoLabel(t)}</option>
          ))}
        </Select>
        <Select
          label="Finca"
          value={ubicacionFilter}
          onChange={(e) => setUbicacionFilter(e.target.value)}
          wrapperClassName="w-44"
        >
          <option value="">Todas</option>
          {ubicaciones.map((u) => (
            <option key={u.id} value={u.id}>{ubicacionLabel(u)}</option>
          ))}
        </Select>
        <Select
          label="Cultivo"
          value={cultivoFilter}
          onChange={(e) => setCultivoFilter(e.target.value)}
          wrapperClassName="w-44"
        >
          <option value="">Todos</option>
          {cultivos.map((c) => (
            <option key={c.id} value={c.id}>{cultivoLabel(c, variedadById)}</option>
          ))}
        </Select>
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1.5 self-end rounded-lg border border-stroke px-3 py-2 text-xs font-medium text-body-color transition-colors hover:bg-gray-100 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5"
        >
          <IconX />
          Limpiar
        </button>
        <div className="ml-auto self-end">
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <IconPlus />
            Registrar Costo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke bg-gray-50/70 dark:border-strokedark dark:bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Finca</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Cultivo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Descripción</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Costo Unit.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-body-color dark:text-body-color-dark">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-body-color dark:text-body-color-dark">
                    No hay costos en el período seleccionado.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/3"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-black dark:text-white">
                      {c.fecha ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-body-color dark:text-body-color-dark">
                      {getUbicacionLabel(c.id_ubicacion)}
                    </td>
                    <td className="px-4 py-3 text-body-color dark:text-body-color-dark">
                      {getCultivoLabel(c.id_cultivo)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TIPO_CHIP[c.tipo_costo]}`}>
                        {tipoCostoLabel(c.tipo_costo)}
                      </span>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-body-color dark:text-body-color-dark">
                      {c.descripcion ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-body-color dark:text-body-color-dark">
                      {c.cantidad != null ? `${c.cantidad} ${c.unidad ?? ""}`.trim() : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-body-color dark:text-body-color-dark">
                      {c.costo_unitario != null
                        ? c.costo_unitario.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                      {c.costo_total != null
                        ? c.costo_total.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="rounded p-1.5 text-body-color transition-colors hover:bg-primary-100 hover:text-primary dark:text-body-color-dark dark:hover:bg-primary-500/15 dark:hover:text-primary-300"
                          title="Editar"
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="rounded p-1.5 text-body-color transition-colors hover:bg-red-100 hover:text-red-600 dark:text-body-color-dark dark:hover:bg-red-500/15 dark:hover:text-red-400"
                          title="Eliminar"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-stroke px-4 py-3 text-xs text-body-color dark:border-strokedark dark:text-body-color-dark">
            {filtered.length} registro{filtered.length !== 1 ? "s" : ""} · Total:{" "}
            <span className="font-semibold text-red-600 dark:text-red-400">
              {filtered
                .reduce((sum, c) => sum + (c.costo_total ?? 0), 0)
                .toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        title={editing ? "Editar Costo" : "Registrar Costo"}
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
              form="costos-form"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Registrar"}
            </button>
          </>
        }
      >
        <form id="costos-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {/* Finca */}
            <div>
              <label className={labelCls}>Finca *</label>
              <Select
                value={form.id_ubicacion ?? ""}
                onChange={(e) => setField("id_ubicacion", e.target.value || null)}
              >
                <option value="">Seleccionar finca…</option>
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>{ubicacionLabel(u)}</option>
                ))}
              </Select>
            </div>

            {/* Fecha */}
            <div>
              <label className={labelCls}>Fecha *</label>
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
              <label className={labelCls}>Cultivo</label>
              <Select
                value={form.id_cultivo ?? ""}
                onChange={(e) => onCultivoChange(e.target.value)}
              >
                <option value="">Sin cultivo asociado</option>
                {cultivos.map((c) => (
                  <option key={c.id} value={c.id}>{cultivoLabel(c, variedadById)}</option>
                ))}
              </Select>
            </div>

            {/* Tipo costo */}
            <div>
              <label className={labelCls}>Tipo de costo *</label>
              <Select
                value={form.tipo_costo}
                onChange={(e) => onTipoChange(e.target.value as TipoCosto)}
              >
                {TIPOS_COSTO.map((t) => (
                  <option key={t} value={t}>{tipoCostoLabel(t)}</option>
                ))}
              </Select>
            </div>

            {/* Insumo planificado (INSUMO only) */}
            {showInsumoPickers && (
              <div className="sm:col-span-2">
                <label className={labelCls}>Insumo planificado del cultivo</label>
                {loadingPickers ? (
                  <p className="text-xs text-body-color dark:text-body-color-dark">Cargando…</p>
                ) : insumosCultivo.length === 0 ? (
                  <p className="text-xs text-body-color dark:text-body-color-dark">
                    {form.id_cultivo
                      ? "No hay insumos planificados para este cultivo."
                      : "Selecciona un cultivo para ver insumos planificados."}
                  </p>
                ) : (
                  <Select
                    value={selectedInsumoCultivoId}
                    onChange={(e) => onInsumoCultivoChange(e.target.value)}
                  >
                    <option value="">Seleccionar insumo planificado…</option>
                    {insumosCultivo.map((ic) => (
                      <option key={ic.id} value={ic.id}>
                        {[
                          ic.nombre_insumo,
                          ic.nro_semana != null ? `Sem ${ic.nro_semana}` : null,
                          ic.fecha_planeada,
                          ic.cantidad_requerida != null
                            ? `(Req: ${ic.cantidad_requerida} ${ic.unidad_medida ?? ""})`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" – ")}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            )}

            {/* Insumo catálogo (INSUMO only) */}
            {showInsumoPickers && (
              <div className="sm:col-span-2">
                <label className={labelCls}>O seleccionar del catálogo de insumos</label>
                <Select
                  value={form.id_insumo ?? ""}
                  onChange={(e) => onInsumoCatalogChange(e.target.value)}
                >
                  <option value="">Seleccionar insumo del catálogo…</option>
                  {insumos.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.nombre}
                      {ins.unidad_medida ? ` (${ins.unidad_medida})` : ""}
                      {` — Stock: ${ins.stock_actual}`}
                      {ins.valor_unitario != null ? ` — $${ins.valor_unitario.toLocaleString()}` : ""}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Actividad planificada (MANO_OBRA only) */}
            {showActividadPicker && (
              <div className="sm:col-span-2">
                <label className={labelCls}>Actividad planificada del cultivo</label>
                {loadingPickers ? (
                  <p className="text-xs text-body-color dark:text-body-color-dark">Cargando…</p>
                ) : actividadesCultivo.length === 0 ? (
                  <p className="text-xs text-body-color dark:text-body-color-dark">
                    {form.id_cultivo
                      ? "No hay actividades planificadas para este cultivo."
                      : "Selecciona un cultivo para ver actividades planificadas."}
                  </p>
                ) : (
                  <Select
                    value={selectedActividadCultivoId}
                    onChange={(e) => onActividadChange(e.target.value)}
                  >
                    <option value="">Seleccionar actividad planificada…</option>
                    {actividadesCultivo.map((ac) => (
                      <option key={ac.id} value={ac.id}>
                        {[
                          ac.nombre_actividad,
                          ac.nro_semana != null ? `Sem ${ac.nro_semana}` : null,
                          ac.fecha_planeada,
                          ac.tiempo_requerido_min != null
                            ? `(${(ac.tiempo_requerido_min / 60).toFixed(1)} h)`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" – ")}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            )}

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Descripción</label>
              <input
                type="text"
                value={form.descripcion ?? ""}
                onChange={(e) => setField("descripcion", e.target.value || null)}
                placeholder="Descripción del costo"
                className={inputCls}
              />
            </div>

            {/* Cantidad */}
            <div>
              <label className={labelCls}>Cantidad</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.cantidad ?? ""}
                onChange={(e) =>
                  setField("cantidad", e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="0"
                className={inputCls}
              />
              {stockInsuficiente && selectedInsumo && (
                <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                  Advertencia: stock insuficiente ({selectedInsumo.stock_actual} disponibles).
                  Se registrará inventario en negativo.
                </p>
              )}
            </div>

            {/* Unidad */}
            <div>
              <label className={labelCls}>Unidad</label>
              <input
                type="text"
                value={form.unidad ?? ""}
                onChange={(e) => setField("unidad", e.target.value || null)}
                placeholder={tipo === "MANO_OBRA" ? "minutos" : "kg, L, unid…"}
                className={inputCls}
              />
            </div>

            {/* Costo unitario */}
            <div>
              <label className={labelCls}>
                Costo unitario
                {tipo === "MANO_OBRA" && (
                  <span className="ml-1 text-body-color/60">($/min)</span>
                )}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.costo_unitario ?? ""}
                onChange={(e) =>
                  setField("costo_unitario", e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="0"
                className={inputCls}
              />
            </div>

            {/* Costo total (read-only) */}
            <div>
              <label className={labelCls}>Costo total</label>
              <div className="flex h-[38px] items-center rounded-lg border border-stroke bg-gray-50 px-3 text-sm font-semibold text-red-600 dark:border-strokedark dark:bg-dark/50 dark:text-red-400">
                {computedTotal.toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>

            {/* Responsable */}
            <div>
              <label className={labelCls}>Responsable</label>
              <input
                type="text"
                value={form.responsable ?? ""}
                onChange={(e) => setField("responsable", e.target.value || null)}
                placeholder="Nombre del responsable"
                className={inputCls}
              />
            </div>

            {/* Observaciones */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Observaciones</label>
              <input
                type="text"
                value={form.observaciones ?? ""}
                onChange={(e) => setField("observaciones", e.target.value || null)}
                placeholder="Notas adicionales"
                className={inputCls}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
