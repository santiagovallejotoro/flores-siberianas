"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSPASassClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/Common/ConfirmProvider";
import Modal from "@/components/Common/Modal";
import {
  type Cultivo,
  type CultivoInput,
  type EstadoCultivo,
  ESTADOS_CULTIVO,
  createCultivo,
  deleteCultivo,
  updateCultivo,
  calcFechaFin,
} from "@/lib/farm/cultivos";
import {
  type GenStatus,
  type SourceOption,
  getCultivoGenerationStatus,
  generarCiclosCultivo,
  generarActividadesCultivo,
  generarInsumosCultivo,
  getActividadesSources,
} from "@/lib/farm/generacion";
import type { Variedad } from "@/lib/farm/variedades";
import type { Ubicacion } from "@/lib/farm/ubicaciones";
import type { ClaseCultivo } from "@/lib/farm/clases";
import Select from "@/components/Common/Select";

interface CultivosEditorProps {
  initialCultivos: Cultivo[];
  variedades: Variedad[];
  ubicaciones: Ubicacion[];
  clases: ClaseCultivo[];
}

type Banner = { kind: "success" | "error"; text: string } | null;

type Generating = "ciclos" | "actividades" | "insumos" | null;

type SourcePicker = {
  kind: "actividades" | "insumos";
  sources: SourceOption[];
  selected: number;
};

const EMPTY_FORM: CultivoInput = {
  numero_cultivo: "",
  id_variedad: null,
  id_ubicacion: null,
  fecha_inicio: null,
  fecha_fin_estimada: null,
  total_plantas: null,
  tasa_produccion_planta: null,
  area_m2: null,
  numero_camas: null,
  estado: "Activo",
  observaciones: null,
};

const ESTADO_STYLES: Record<EstadoCultivo, string> = {
  Planificado:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Activo:
    "bg-primary-100 text-primary dark:bg-primary-500/15 dark:text-primary-300",
  Finalizado:
    "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
  Cancelado:
    "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
};

function coerceEstado(raw: string | null | undefined): EstadoCultivo {
  if (raw && ESTADOS_CULTIVO.includes(raw as EstadoCultivo)) {
    return raw as EstadoCultivo;
  }
  return "Activo";
}

/**
 * Suggests the next numero_cultivo in the "C-NNN" sequence by scanning
 * all existing cultivos for the pattern and incrementing the highest match.
 * Falls back to "C-001" if no matching entries exist.
 */
function nextNumeroCultivo(cultivos: Cultivo[]): string {
  const re = /^C-(\d+)$/i;
  let max = 0;
  for (const c of cultivos) {
    const m = re.exec(c.numero_cultivo);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return `C-${String(max + 1).padStart(3, "0")}`;
}

// ── SVG icon helpers ──────────────────────────────────────────────────────────

function IconRotateCw({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconListChecks({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </svg>
  );
}

function IconPackage({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CultivosEditor({
  initialCultivos,
  variedades,
  ubicaciones,
  clases,
}: CultivosEditorProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [cultivos, setCultivos] = useState<Cultivo[]>(initialCultivos);
  const [banner, setBanner] = useState<Banner>(null);
  const [, startTransition] = useTransition();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cultivo | null>(null);
  const [form, setForm] = useState<CultivoInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Filter
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  // Generation state
  const [genStatus, setGenStatus] = useState<Map<string, GenStatus>>(new Map());
  const [generating, setGenerating] = useState<Generating>(null);
  const [sourcePicker, setSourcePicker] = useState<SourcePicker | null>(null);
  const [actividadesSources, setActividadesSources] = useState<SourceOption[] | null>(null);
  /** User-picked actividades/insumos source for new-cultivo auto-generation.
   *  null = "no generar"; SourceOption = use that source. Reset on modal open. */
  const [selectedSource, setSelectedSource] = useState<SourceOption | null>(null);

  // ── Load generation status ─────────────────────────────────────────────────

  async function loadGenStatus(ids: string[]) {
    if (ids.length === 0) return;
    const client = createSPASassClient().getSupabaseClient();
    try {
      const map = await getCultivoGenerationStatus(client, ids);
      setGenStatus((prev) => {
        const next = new Map(prev);
        for (const [k, v] of map) next.set(k, v);
        return next;
      });
    } catch {
      // non-blocking: status badges silently absent
    }
  }

  useEffect(() => {
    if (cultivos.length > 0) {
      void loadGenStatus(cultivos.map((c) => c.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load actividades sources whenever the form's variedad changes ─────────
  useEffect(() => {
    if (!modalOpen) {
      setActividadesSources(null);
      return;
    }
    if (!form.id_variedad) {
      setActividadesSources([]);
      setSelectedSource(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const client = createSPASassClient().getSupabaseClient();
        const sources = await getActividadesSources(
          client,
          { id_variedad: form.id_variedad } as Cultivo,
          variedades,
          clases,
        );
        if (cancelled) return;
        setActividadesSources(sources);
        // For new cultivos, default-select the first source (variedad-preferred).
        // For edit, leave selectedSource alone — only the manual buttons drive it.
        if (!editing) {
          setSelectedSource(sources[0] ?? null);
        }
      } catch {
        if (!cancelled) {
          setActividadesSources([]);
          if (!editing) setSelectedSource(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modalOpen, form.id_variedad, variedades, clases, editing]);

  // ── Lookups ────────────────────────────────────────────────────────────────

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

  const filtered = useMemo(() => {
    if (!estadoFilter) return cultivos;
    return cultivos.filter((c) => c.estado === estadoFilter);
  }, [cultivos, estadoFilter]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showBanner(b: Banner, durationMs = 3500) {
    setBanner(b);
    if (b) setTimeout(() => setBanner(null), durationMs);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, numero_cultivo: nextNumeroCultivo(cultivos) });
    setSourcePicker(null);
    setSelectedSource(null);
    setModalOpen(true);
  }

  function openEdit(c: Cultivo) {
    setEditing(c);
    setForm({
      numero_cultivo: c.numero_cultivo,
      id_variedad: c.id_variedad,
      id_ubicacion: c.id_ubicacion,
      fecha_inicio: c.fecha_inicio,
      fecha_fin_estimada: c.fecha_fin_estimada,
      total_plantas: c.total_plantas,
      tasa_produccion_planta: c.tasa_produccion_planta,
      area_m2: c.area_m2,
      numero_camas: c.numero_camas,
      estado: coerceEstado(c.estado),
      observaciones: c.observaciones,
    });
    setSourcePicker(null);
    setSelectedSource(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving || generating) return;
    setModalOpen(false);
    setSourcePicker(null);
  }

  function setField<K extends keyof CultivoInput>(key: K, value: CultivoInput[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "fecha_inicio" || key === "id_variedad") {
        const variedadId =
          key === "id_variedad" ? (value as string | null) : prev.id_variedad;
        const fechaInicio =
          key === "fecha_inicio" ? (value as string | null) : prev.fecha_inicio;
        const variedad = variedadId ? variedadById.get(variedadId) : null;
        const computed = calcFechaFin(fechaInicio, variedad?.ciclo_en_semanas);
        if (computed) next.fecha_fin_estimada = computed;
      }
      return next;
    });
  }

  function setNumField(
    key: "total_plantas" | "tasa_produccion_planta" | "area_m2" | "numero_camas",
    raw: string,
  ) {
    if (raw === "") return setField(key, null);
    const n = Number(raw);
    setField(key, Number.isNaN(n) ? null : n);
  }

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  /**
   * Best-effort generation right after a cultivo is created. Ciclos always try
   * (skip silently if the variedad lacks a plantilla). Actividades + insumos
   * only run if the user picked a source in the form. Errors never bubble up.
   */
  async function autoGenerateForNewCultivo(
    cultivo: Cultivo,
    source: SourceOption | null,
  ): Promise<{ ciclos: number; actividades: number; insumos: number }> {
    const client = createSPASassClient().getSupabaseClient();
    const out = { ciclos: 0, actividades: 0, insumos: 0 };

    try {
      const r = await generarCiclosCultivo(client, cultivo);
      out.ciclos = r.count;
    } catch {
      /* skip silently — variedad has no ciclos plantilla */
    }

    if (source) {
      try {
        const r = await generarActividadesCultivo(client, cultivo, source);
        out.actividades = r.count;
      } catch {
        /* skip silently */
      }
      try {
        const r = await generarInsumosCultivo(client, cultivo, source);
        out.insumos = r.count;
      } catch {
        /* common: actividades may have no insumos — silent skip */
      }
    }

    return out;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.numero_cultivo.trim()) {
      showBanner({ kind: "error", text: "El número de cultivo es obligatorio." });
      return;
    }
    if (form.total_plantas == null || form.total_plantas <= 0) {
      showBanner({ kind: "error", text: "El número de plantas es obligatorio." });
      return;
    }
    if (!form.fecha_inicio) {
      showBanner({ kind: "error", text: "La fecha de inicio es obligatoria." });
      return;
    }

    const client = createSPASassClient().getSupabaseClient();
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateCultivo(client, editing.id, form);
        setCultivos((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
        showBanner({ kind: "success", text: `Cultivo "${updated.numero_cultivo}" actualizado.` });
        setModalOpen(false);
      } else {
        const created = await createCultivo(client, form);
        setCultivos((prev) => [created, ...prev]);
        setModalOpen(false);

        const auto = await autoGenerateForNewCultivo(created, selectedSource);
        await loadGenStatus([created.id]);

        const generated: string[] = [];
        if (auto.ciclos > 0) generated.push(`${auto.ciclos} ciclo${auto.ciclos === 1 ? "" : "s"}`);
        if (auto.actividades > 0)
          generated.push(`${auto.actividades} actividad${auto.actividades === 1 ? "" : "es"}`);
        if (auto.insumos > 0) generated.push(`${auto.insumos} insumo${auto.insumos === 1 ? "" : "s"}`);

        const text =
          generated.length > 0
            ? `Cultivo "${created.numero_cultivo}" creado. Generados: ${generated.join(", ")}.`
            : `Cultivo "${created.numero_cultivo}" creado.`;
        showBanner({ kind: "success", text }, generated.length > 0 ? 6000 : 3500);
      }
      startTransition(() => router.refresh());
    } catch (err) {
      showBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Error al guardar.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Cultivo) {
    await confirm({
      title: `Eliminar cultivo "${c.numero_cultivo}"`,
      description:
        "Se eliminarán también los ciclos, actividades, insumos, costos y producción asociados a este cultivo. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      tone: "danger",
      onConfirm: async () => {
        const client = createSPASassClient().getSupabaseClient();
        try {
          await deleteCultivo(client, c.id);
          setCultivos((prev) => prev.filter((x) => x.id !== c.id));
          setGenStatus((prev) => { const n = new Map(prev); n.delete(c.id); return n; });
          setModalOpen(false);
          showBanner({ kind: "success", text: `Cultivo "${c.numero_cultivo}" eliminado.` });
          startTransition(() => router.refresh());
        } catch (err) {
          showBanner({
            kind: "error",
            text: err instanceof Error ? err.message : "Error al eliminar.",
          });
          throw err;
        }
      },
    });
  }

  // ── Generation handlers ────────────────────────────────────────────────────

  async function handleGenerarCiclos() {
    if (!editing) return;
    const ok = await confirm({
      title: "Generar ciclos de producción",
      description:
        "Se eliminarán los ciclos existentes de este cultivo y se regenerarán basándose en la plantilla de la variedad seleccionada.",
      confirmLabel: "Generar",
      tone: "info",
    });
    if (!ok) return;

    const client = createSPASassClient().getSupabaseClient();
    setGenerating("ciclos");
    try {
      const { count } = await generarCiclosCultivo(client, editing);
      await loadGenStatus([editing.id]);
      showBanner({ kind: "success", text: `${count} ciclo${count !== 1 ? "s" : ""} generado${count !== 1 ? "s" : ""} exitosamente.` });
    } catch (err) {
      showBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Error al generar ciclos.",
      });
    } finally {
      setGenerating(null);
    }
  }

  async function handleGenerarActividadesOrInsumos(kind: "actividades" | "insumos") {
    if (!editing) return;
    const client = createSPASassClient().getSupabaseClient();

    let sources: SourceOption[];
    try {
      sources = await getActividadesSources(client, editing, variedades, clases);
    } catch (err) {
      showBanner({
        kind: "error",
        text: err instanceof Error ? err.message : "Error al verificar fuentes.",
      });
      return;
    }

    if (sources.length === 0) {
      showBanner({
        kind: "error",
        text: "No hay actividades definidas para la variedad ni su clase de cultivo.",
      });
      return;
    }

    if (sources.length === 1) {
      // Single source — go straight to confirm
      await runGeneration(kind, sources[0]);
    } else {
      // Multiple sources — show inline picker
      setSourcePicker({ kind, sources, selected: 0 });
    }
  }

  async function confirmSourcePicker() {
    if (!sourcePicker || !editing) return;
    const source = sourcePicker.sources[sourcePicker.selected];
    setSourcePicker(null);
    await runGeneration(sourcePicker.kind, source);
  }

  async function runGeneration(kind: "actividades" | "insumos", source: SourceOption) {
    if (!editing) return;

    const label = kind === "actividades" ? "Actividades" : "Insumos";
    const ok = await confirm({
      title: `Generar ${label}`,
      description: `Se eliminarán los registros existentes de ${label.toLowerCase()} de este cultivo y se regenerarán desde "${source.label}".`,
      confirmLabel: "Generar",
      tone: "info",
    });
    if (!ok) return;

    const client = createSPASassClient().getSupabaseClient();
    setGenerating(kind);
    try {
      const { count } =
        kind === "actividades"
          ? await generarActividadesCultivo(client, editing, source)
          : await generarInsumosCultivo(client, editing, source);
      await loadGenStatus([editing.id]);
      showBanner({
        kind: "success",
        text: `${count} ${label.toLowerCase()} generada${count !== 1 ? "s" : ""} exitosamente.`,
      });
    } catch (err) {
      showBanner({
        kind: "error",
        text: err instanceof Error ? err.message : `Error al generar ${label.toLowerCase()}.`,
      });
    } finally {
      setGenerating(null);
    }
  }

  // ── Label helpers ──────────────────────────────────────────────────────────

  const variedadLabel = (v: Variedad) => v.nombre;
  const ubicacionLabel = (u: Ubicacion) => {
    const left = u.nombre_cultivo ?? u.vereda ?? "Sin nombre";
    const right = u.nombre_cultivo && u.vereda ? ` — ${u.vereda}` : "";
    return `${left}${right}`;
  };

  // ── Generados icons (reused in table rows) ─────────────────────────────────

  function GeneradosIcons({ cultivoId }: { cultivoId: string }) {
    const st = genStatus.get(cultivoId);
    const ciclos = st?.ciclosCount ?? 0;
    const acts = st?.actividadesCount ?? 0;
    const ins = st?.insumosCount ?? 0;

    const dot = (count: number, Icon: React.FC<{ size?: number }>, label: string) => (
      <span
        title={count > 0 ? `✓ ${count} ${label}` : `Sin ${label} generados`}
        className={count > 0 ? "text-emerald-500" : "text-gray-300 dark:text-gray-600"}
      >
        <Icon size={15} />
      </span>
    );

    return (
      <span className="inline-flex items-center gap-1.5">
        {dot(ciclos, IconRotateCw, "ciclos")}
        {dot(acts, IconListChecks, "actividades")}
        {dot(ins, IconPackage, "insumos")}
      </span>
    );
  }

  // ── Input class reused throughout form ────────────────────────────────────

  const inputCls =
    "w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary";

  // ── Render ─────────────────────────────────────────────────────────────────

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

      {/* Intro / purpose */}
      <div className="rounded-xl border border-primary-100 bg-primary-100/30 p-4 dark:border-primary-500/30 dark:bg-primary-500/10">
        <p className="text-xs font-bold uppercase tracking-widest text-primary dark:text-primary-300">
          Cultivos
        </p>
        <p className="mt-1 text-sm leading-relaxed text-body-color dark:text-body-color-dark">
          Cada cultivo es un lote en producción (variedad + ubicación + plantas + fecha de siembra).
          Al crearlo, el sistema genera automáticamente sus <strong>ciclos de corte</strong> semanales,
          sus <strong>actividades</strong> programadas y los <strong>insumos</strong> requeridos a partir
          de la variedad. Si algo no se generó, abre el cultivo y usa los botones "Generar" para hacerlo
          manualmente.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-body-color dark:text-body-color-dark">
          <span className="inline-flex items-center gap-1.5">
            <IconRotateCw size={13} /> Ciclos de corte
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconListChecks size={13} /> Actividades
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconPackage size={13} /> Insumos
          </span>
        </div>
      </div>

      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary dark:bg-primary-500/15 dark:text-primary-300">
            {cultivos.length} {cultivos.length === 1 ? "cultivo" : "cultivos"}
          </span>
          <Select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            aria-label="Filtrar por estado"
            className="min-w-[160px] text-sm"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_CULTIVO.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </Select>
          {estadoFilter && (
            <button
              type="button"
              onClick={() => setEstadoFilter("")}
              className="text-xs text-body-color underline hover:text-primary dark:text-body-color-dark"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
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
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo cultivo
          </button>
        </div>
      </div>

      {/* Empty state */}
      {cultivos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stroke bg-white/50 p-12 text-center dark:border-strokedark dark:bg-dark/40">
          <p className="text-sm text-body-color dark:text-body-color-dark">
            Aún no tienes cultivos. Crea el primero con el botón de arriba.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stroke bg-white/50 p-8 text-center dark:border-strokedark dark:bg-dark/40">
          <p className="text-sm text-body-color dark:text-body-color-dark">
            No hay cultivos con el estado &ldquo;{estadoFilter}&rdquo;.
          </p>
        </div>
      ) : (
        <>
          {/* Table View (Desktop Only) */}
          <div className={`${viewMode === "table" ? "hidden md:block" : "hidden"} overflow-hidden rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark`}>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="min-w-full w-full text-sm">
                <thead>
                  <tr className="border-b border-stroke bg-gray-50/60 dark:border-strokedark dark:bg-white/5">
                    <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Número</th>
                    <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Variedad</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-black dark:text-white sm:table-cell">Ubicación</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-black dark:text-white md:table-cell">Fecha Inicio</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-black dark:text-white lg:table-cell">Fecha Fin Est.</th>
                    <th className="hidden px-4 py-3 text-right font-semibold text-black dark:text-white xl:table-cell">Plantas</th>
                    <th className="hidden px-4 py-3 text-right font-semibold text-black dark:text-white xl:table-cell">Área m²</th>
                    <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Estado</th>
                    <th className="px-4 py-3 text-center font-semibold text-black dark:text-white" title="Ciclos / Actividades / Insumos generados">Gen.</th>
                    <th className="w-14 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {filtered.map((c) => {
                    const variedad = c.id_variedad ? variedadById.get(c.id_variedad) : null;
                    const ubicacion = c.id_ubicacion ? ubicacionById.get(c.id_ubicacion) : null;
                    const estadoStyle = c.estado
                      ? ESTADO_STYLES[coerceEstado(c.estado)]
                      : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400";

                    return (
                      <tr key={c.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-4 py-3 font-semibold text-black dark:text-white">{c.numero_cultivo}</td>
                        <td className="px-4 py-3 text-body-color dark:text-body-color-dark">
                          {variedad?.nombre ?? <span className="text-gray-400">—</span>}
                        </td>
                        <td className="hidden px-4 py-3 text-body-color dark:text-body-color-dark sm:table-cell">
                          {ubicacion ? ubicacionLabel(ubicacion) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="hidden px-4 py-3 text-body-color dark:text-body-color-dark md:table-cell">
                          {c.fecha_inicio ?? <span className="text-gray-400">—</span>}
                        </td>
                        <td className="hidden px-4 py-3 text-body-color dark:text-body-color-dark lg:table-cell">
                          {c.fecha_fin_estimada ?? <span className="text-gray-400">—</span>}
                        </td>
                        <td className="hidden px-4 py-3 text-right tabular-nums text-body-color dark:text-body-color-dark xl:table-cell">
                          {c.total_plantas != null ? c.total_plantas.toLocaleString("es-CO") : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="hidden px-4 py-3 text-right tabular-nums text-body-color dark:text-body-color-dark xl:table-cell">
                          {c.area_m2 != null ? `${c.area_m2.toLocaleString("es-CO")} m²` : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={["inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", estadoStyle].join(" ")}>
                            {c.estado != null ? c.estado : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <GeneradosIcons cultivoId={c.id} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            aria-label={`Editar cultivo ${c.numero_cultivo}`}
                            className="rounded-lg p-1.5 text-body-color transition-colors hover:bg-gray-100 hover:text-black dark:text-body-color-dark dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
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
            {filtered.map((c) => {
              const variedad = c.id_variedad ? variedadById.get(c.id_variedad) : null;
              const ubicacion = c.id_ubicacion ? ubicacionById.get(c.id_ubicacion) : null;
              const estadoStyle = c.estado ? ESTADO_STYLES[coerceEstado(c.estado)] : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400";
              
              return (
                <div key={c.id} className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-stroke bg-white p-3.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md dark:border-strokedark dark:bg-dark">
                  
                  {/* Header: Numero y Acciones */}
                  <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-strokedark">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-black dark:text-white">{c.numero_cultivo}</span>
                      <span className={["inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide", estadoStyle].join(" ")}>
                        {c.estado != null ? c.estado : "—"}
                      </span>
                    </div>

                    <div className="flex flex-shrink-0 items-center pl-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        aria-label={`Editar cultivo ${c.numero_cultivo}`}
                        className="rounded-full bg-primary/10 p-1.5 text-primary transition-colors hover:bg-primary/20 dark:bg-primary-500/10 dark:hover:bg-primary-500/20"
                      >
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Variedad</span>
                      <span className="truncate text-xs font-semibold text-black dark:text-white" title={variedad?.nombre}>
                        {variedad?.nombre ?? "—"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Ubicación</span>
                      <span className="truncate text-xs font-semibold text-black dark:text-white" title={ubicacion ? ubicacionLabel(ubicacion) : undefined}>
                        {ubicacion ? ubicacionLabel(ubicacion) : "—"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Plantas / Área</span>
                      <span className="tabular-nums text-xs font-semibold text-black dark:text-white">
                        {c.total_plantas != null ? c.total_plantas.toLocaleString("es-CO") : "—"}{c.area_m2 != null ? ` / ${c.area_m2.toLocaleString("es-CO")}` : ""}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg bg-gray-50/70 p-2 dark:bg-white/5">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Fechas</span>
                      <span className="tabular-nums text-[10px] font-medium text-black dark:text-white leading-tight">
                        <div className="flex flex-col gap-0.5">
                          <span>I: {c.fecha_inicio ?? "—"}</span>
                          <span>F: {c.fecha_fin_estimada ?? "—"}</span>
                        </div>
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 flex flex-col items-center justify-between gap-2 border-t border-stroke/50 pt-2 dark:border-strokedark/50 sm:flex-row sm:gap-0">
                     <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">
                       Generados
                     </span>
                     <GeneradosIcons cultivoId={c.id} />
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `Editar cultivo ${editing.numero_cultivo}` : "Nuevo cultivo"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1 — número + variedad */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-black dark:text-white">
                Número de cultivo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="C-001"
                value={form.numero_cultivo}
                onChange={(e) => setField("numero_cultivo", e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-black dark:text-white">Variedad</label>
              <Select
                value={form.id_variedad ?? ""}
                onChange={(e) => setField("id_variedad", e.target.value || null)}
              >
                <option value="">Sin variedad</option>
                {variedades.map((v) => (
                  <option key={v.id} value={v.id}>{variedadLabel(v)}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-black dark:text-white">Ubicación</label>
            <Select
              value={form.id_ubicacion ?? ""}
              onChange={(e) => setField("id_ubicacion", e.target.value || null)}
            >
              <option value="">Sin ubicación</option>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id}>{ubicacionLabel(u)}</option>
              ))}
            </Select>
          </div>

          {/* Fuente de actividades / insumos — create mode only */}
          {!editing && form.id_variedad && (
            <div className="rounded-lg border border-stroke bg-gray-50/70 p-3 dark:border-strokedark dark:bg-white/5">
              <p className="text-sm font-medium text-black dark:text-white">
                Fuente de actividades e insumos
              </p>
              <p className="mt-0.5 text-xs text-body-color dark:text-body-color-dark">
                Al guardar, se generan automáticamente desde la fuente que elijas.
                Si saltas este paso, podrás generarlas después desde el cultivo.
              </p>
              {actividadesSources === null ? (
                <p className="mt-2 text-xs text-body-color dark:text-body-color-dark">
                  Cargando opciones…
                </p>
              ) : actividadesSources.length === 0 ? (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  Esta variedad y su clase aún no tienen actividades definidas.
                  Podrás generarlas después manualmente.
                </p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {actividadesSources.map((src, i) => (
                    <label
                      key={i}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-stroke bg-white px-2.5 py-2 text-sm transition-colors hover:border-primary dark:border-strokedark dark:bg-dark dark:hover:border-primary"
                    >
                      <input
                        type="radio"
                        name="newCultivoSource"
                        checked={
                          selectedSource?.type === src.type &&
                          selectedSource?.label === src.label
                        }
                        onChange={() => setSelectedSource(src)}
                        className="accent-primary"
                      />
                      <span className="flex-1 text-black dark:text-white">{src.label}</span>
                      <span className="text-xs text-body-color dark:text-body-color-dark">
                        {src.count} actividad{src.count !== 1 ? "es" : ""}
                      </span>
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-stroke bg-white px-2.5 py-2 text-sm transition-colors hover:border-primary dark:border-strokedark dark:bg-dark dark:hover:border-primary">
                    <input
                      type="radio"
                      name="newCultivoSource"
                      checked={selectedSource === null}
                      onChange={() => setSelectedSource(null)}
                      className="accent-primary"
                    />
                    <span className="flex-1 text-body-color dark:text-body-color-dark">
                      No generar ahora — lo hago manualmente después
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-black dark:text-white">
                Fecha inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.fecha_inicio ?? ""}
                onChange={(e) => setField("fecha_inicio", e.target.value || null)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-black dark:text-white">
                Fecha fin estimada{" "}
                <span className="text-xs font-normal text-body-color dark:text-body-color-dark">(auto)</span>
              </label>
              <input
                type="date"
                value={form.fecha_fin_estimada ?? ""}
                onChange={(e) => setField("fecha_fin_estimada", e.target.value || null)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Plantas + Área + Camas */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-black dark:text-white">
                Total plantas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="0"
                value={form.total_plantas ?? ""}
                onChange={(e) => setNumField("total_plantas", e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-black dark:text-white">Área (m²)</label>
              <input type="number" min="0" step="0.01" placeholder="0" value={form.area_m2 ?? ""} onChange={(e) => setNumField("area_m2", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-black dark:text-white">Núm. camas</label>
              <input type="number" min="0" placeholder="0" value={form.numero_camas ?? ""} onChange={(e) => setNumField("numero_camas", e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Estado — edit mode only */}
          {editing && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-black dark:text-white">Estado</label>
              <Select
                value={form.estado ?? "Activo"}
                onChange={(e) => setField("estado", (e.target.value || "Activo") as EstadoCultivo)}
              >
                {ESTADOS_CULTIVO.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          )}

          {/* Observaciones */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-black dark:text-white">Observaciones</label>
            <input
              type="text"
              placeholder="Notas adicionales..."
              value={form.observaciones ?? ""}
              onChange={(e) => setField("observaciones", e.target.value || null)}
              className={inputCls}
            />
          </div>

          {/* ── Generación de Datos — edit mode only ── */}
          {editing && (() => {
            const editingVariedad = editing.id_variedad
              ? variedadById.get(editing.id_variedad) ?? null
              : null;
            const cicloDisabledReason = !editing.id_variedad
              ? "Asigna una variedad al cultivo primero."
              : !editingVariedad?.tiene_ciclos_produccion
                ? "Esta variedad aún no tiene ciclos de producción. Genéralos en el catálogo de Variedades o de Ciclos."
                : null;
            const actDisabledReason = !editing.id_variedad
              ? "Asigna una variedad al cultivo primero."
              : actividadesSources === null
                ? null
                : actividadesSources.length === 0
                  ? "No hay actividades definidas para esta variedad ni su clase."
                  : null;
            return (
            <div className="space-y-3 border-t border-stroke pt-4 dark:border-strokedark">
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">
                  Generación de Datos
                </p>
                <p className="mt-0.5 text-xs text-body-color dark:text-body-color-dark">
                  Genera ciclos de producción, actividades y requerimientos de insumos basados en la variedad seleccionada.
                </p>
              </div>

              {/* In-modal banner so errors are visible above the modal layer */}
              {banner && (
                <div
                  role="status"
                  className={[
                    "rounded-lg border px-3 py-2 text-sm",
                    banner.kind === "success"
                      ? "border-primary-100 bg-primary-100/50 text-primary-600 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
                  ].join(" ")}
                >
                  {banner.text}
                </div>
              )}

              {/* Source picker (shown when multiple sources available) */}
              {sourcePicker ? (
                <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-white/5">
                  <p className="mb-3 text-sm font-medium text-black dark:text-white">
                    Selecciona la fuente de {sourcePicker.kind === "actividades" ? "actividades" : "insumos"}:
                  </p>
                  <div className="space-y-2">
                    {sourcePicker.sources.map((src, i) => (
                      <label
                        key={i}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-stroke bg-white p-3 transition-colors hover:border-primary dark:border-strokedark dark:bg-dark dark:hover:border-primary"
                      >
                        <input
                          type="radio"
                          name="genSource"
                          checked={sourcePicker.selected === i}
                          onChange={() =>
                            setSourcePicker((p) => p ? { ...p, selected: i } : p)
                          }
                          className="accent-primary"
                        />
                        <span className="flex-1 text-sm text-black dark:text-white">
                          {src.label}
                        </span>
                        <span className="text-xs text-body-color dark:text-body-color-dark">
                          {src.count} actividad{src.count !== 1 ? "es" : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSourcePicker(null)}
                      className="rounded-lg border border-stroke px-3 py-1.5 text-sm text-body-color hover:bg-gray-100 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmSourcePicker}
                      className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-600"
                    >
                      Confirmar fuente
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!!generating || !!cicloDisabledReason}
                      title={cicloDisabledReason ?? undefined}
                      onClick={handleGenerarCiclos}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-white/10 dark:disabled:text-body-color-dark"
                    >
                      <IconRotateCw size={15} />
                      {generating === "ciclos" ? "Generando…" : "Generar Ciclos"}
                    </button>
                    <button
                      type="button"
                      disabled={!!generating || !!actDisabledReason}
                      title={actDisabledReason ?? undefined}
                      onClick={() => handleGenerarActividadesOrInsumos("actividades")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-white/10 dark:disabled:text-body-color-dark"
                    >
                      <IconListChecks size={15} />
                      {generating === "actividades" ? "Generando…" : "Generar Actividades"}
                    </button>
                    <button
                      type="button"
                      disabled={!!generating || !!actDisabledReason}
                      title={actDisabledReason ?? undefined}
                      onClick={() => handleGenerarActividadesOrInsumos("insumos")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-white/10 dark:disabled:text-body-color-dark"
                    >
                      <IconPackage size={15} />
                      {generating === "insumos" ? "Generando…" : "Generar Insumos"}
                    </button>
                  </div>
                  {(cicloDisabledReason || actDisabledReason) && (
                    <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
                      {cicloDisabledReason && (
                        <li>• Ciclos: {cicloDisabledReason}</li>
                      )}
                      {actDisabledReason && cicloDisabledReason !== actDisabledReason && (
                        <li>• Actividades / Insumos: {actDisabledReason}</li>
                      )}
                    </ul>
                  )}
                </>
              )}

              {/* Live status row */}
              {editing && genStatus.has(editing.id) && (
                <div className="flex flex-wrap gap-4 text-xs text-body-color dark:text-body-color-dark">
                  {[
                    { Icon: IconRotateCw, label: "ciclos", count: genStatus.get(editing.id)!.ciclosCount },
                    { Icon: IconListChecks, label: "actividades", count: genStatus.get(editing.id)!.actividadesCount },
                    { Icon: IconPackage, label: "insumos", count: genStatus.get(editing.id)!.insumosCount },
                  ].map(({ Icon, label, count }) => (
                    <span
                      key={label}
                      className={[
                        "inline-flex items-center gap-1",
                        count > 0 ? "text-emerald-600 dark:text-emerald-400" : "",
                      ].join(" ")}
                    >
                      <Icon size={13} />
                      {count > 0 ? `${count} ${label}` : `Sin ${label}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
            );
          })()}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-stroke pt-4 dark:border-strokedark">
            {editing ? (
              <button
                type="button"
                onClick={() => handleDelete(editing)}
                disabled={saving || !!generating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                Eliminar
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving || !!generating}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-body-color transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !!generating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
              >
                {saving ? (editing ? "Guardando…" : "Creando…") : editing ? "Guardar" : "Crear cultivo"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
