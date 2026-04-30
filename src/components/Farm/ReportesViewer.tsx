"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createSPASassClient } from "@/lib/supabase/client";
import {
  type ReportFilters,
  type CicloReportRow,
  type ActividadReportRow,
  type InsumoReportRow,
  MONTH_WEEK_RANGES,
  fetchReportCiclos,
  fetchReportActividades,
  fetchReportInsumos,
  listIsoWeekSlotsInDateRange,
  weekRangeToDateRange,
} from "@/lib/farm/reportes";
import ProduccionProgramadaChart from "@/components/Farm/ProduccionProgramadaChart";
import type { Ubicacion } from "@/lib/farm/ubicaciones";
import type { Variedad } from "@/lib/farm/variedades";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ReportesViewerProps {
  initialUbicaciones: Ubicacion[];
  initialVariedades: Variedad[];
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TabKey = "ciclos" | "actividades" | "insumos";

type WeekGroup<T> = {
  weekNum: number;
  dateRange: string;
  rows: T[];
};

// ── Grouping helper ───────────────────────────────────────────────────────────

function groupByWeek<T extends { weekNum: number; dateRange: string }>(
  rows: T[],
): WeekGroup<T>[] {
  const map = new Map<number, WeekGroup<T>>();
  for (const row of rows) {
    if (!map.has(row.weekNum)) {
      map.set(row.weekNum, { weekNum: row.weekNum, dateRange: row.dateRange, rows: [] });
    }
    map.get(row.weekNum)!.rows.push(row);
  }
  return Array.from(map.values()).sort((a, b) => a.weekNum - b.weekNum);
}

// ── Cell classes ──────────────────────────────────────────────────────────────

const TD = "px-4 py-2 text-sm text-body-color dark:text-body-color-dark";
const TH = "px-4 py-2 text-left text-xs font-semibold text-secondary-600 dark:text-secondary-400";
const GH = "px-4 py-1.5 text-xs font-semibold"; // group header band
const NUM = "text-right tabular-nums";

// ── Filter pills ──────────────────────────────────────────────────────────────

type PillItem = { id: string; label: string };

function FilterPills({
  label,
  items,
  selected,
  onChange,
}: {
  label: string;
  items: PillItem[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const allSelected = selected[0] === "ALL";

  function toggle(id: string) {
    if (id === "ALL") {
      onChange(["ALL"]);
      return;
    }
    // Build next selection: remove "ALL" and toggle the item
    const without = selected.filter((s) => s !== "ALL" && s !== id);
    const isNowSelected = !selected.includes(id) || allSelected;
    const next = isNowSelected
      ? [...without, id]
      : without;
    // If nothing left, fall back to ALL
    onChange(next.length === 0 ? ["ALL"] : next);
  }

  return (
    <div className="space-y-1">
      <span className="block text-xs font-medium text-body-color dark:text-body-color-dark">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange(["ALL"])}
          className={[
            "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
            allSelected
              ? "border-primary bg-primary-100 text-primary dark:bg-primary-500/15 dark:text-primary-300"
              : "border-stroke text-body-color hover:border-primary hover:text-primary dark:border-strokedark dark:text-body-color-dark dark:hover:border-primary dark:hover:text-primary-300",
          ].join(" ")}
        >
          Todas
        </button>
        {items.map((item) => {
          const active = !allSelected && selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={[
                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary-100 text-primary dark:bg-primary-500/15 dark:text-primary-300"
                  : "border-stroke text-body-color hover:border-primary hover:text-primary dark:border-strokedark dark:text-body-color-dark dark:hover:border-primary dark:hover:text-primary-300",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-8 animate-pulse rounded bg-gray-100 dark:bg-white/10"
          style={{ opacity: 1 - i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab, year, weekStart, weekEnd }: { tab: TabKey; year: number; weekStart: number; weekEnd: number }) {
  const icons: Record<TabKey, React.ReactNode> = {
    ciclos: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    actividades: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
        <path d="m3 17 2 2 4-4" /><path d="m3 7 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" />
      </svg>
    ),
    insumos: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
        <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
      </svg>
    ),
  };

  const labels: Record<TabKey, string> = {
    ciclos: "producción",
    actividades: "actividades",
    insumos: "insumos",
  };

  const steps: Record<TabKey, string[]> = {
    ciclos: ["Crea un cultivo con fecha de inicio", "Genera los ciclos de producción para ese cultivo", "Verifica que las fechas planeadas estén en el año seleccionado"],
    actividades: ["Crea un cultivo con fecha de inicio", "Genera las actividades para ese cultivo", "Verifica que las fechas planeadas estén en el año seleccionado"],
    insumos: ["Crea un cultivo con fecha de inicio", "Genera las actividades con insumos", "Verifica que las fechas planeadas estén en el año seleccionado"],
  };

  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      {icons[tab]}
      <p className="text-sm font-medium text-black dark:text-white">
        No hay datos de {labels[tab]}
      </p>
      <p className="text-xs text-body-color dark:text-body-color-dark">
        No se encontraron registros para <strong>{year}</strong> (semanas {weekStart}–{weekEnd}).
      </p>
      <ol className="mt-2 space-y-1 text-left text-xs text-body-color dark:text-body-color-dark">
        {steps[tab].map((s, i) => (
          <li key={i}>{i + 1}. {s}</li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
        Prueba cambiar el año si tus datos son de otro período.
      </p>
    </div>
  );
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-lg border border-stroke px-4 py-3 dark:border-strokedark">
      <p className="text-xs text-body-color dark:text-body-color-dark">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-primary dark:text-primary-300">{value}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReportesViewer({
  initialUbicaciones,
  initialVariedades,
}: ReportesViewerProps) {
  const currentYear = new Date().getFullYear();

  // Filter state
  const [year, setYear] = useState(currentYear);
  const [weekStart, setWeekStart] = useState(1);
  const [weekEnd, setWeekEnd] = useState(53);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedUbicaciones, setSelectedUbicaciones] = useState<string[]>(["ALL"]);
  const [selectedVariedades, setSelectedVariedades] = useState<string[]>(["ALL"]);

  // Tab
  const [activeTab, setActiveTab] = useState<TabKey>("ciclos");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  // Report data
  const [ciclos, setCiclos] = useState<CicloReportRow[]>([]);
  const [actividades, setActividades] = useState<ActividadReportRow[]>([]);
  const [insumos, setInsumos] = useState<InsumoReportRow[]>([]);

  // Loading per report (so each tab can show independently)
  const [loadingCiclos, setLoadingCiclos] = useState(false);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [loadingInsumos, setLoadingInsumos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ciclosWeekSlots = useMemo(() => {
    const { start, end } = weekRangeToDateRange(year, weekStart, weekEnd);
    return listIsoWeekSlotsInDateRange(start, end);
  }, [year, weekStart, weekEnd]);

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function loadReports(filters: ReportFilters) {
    const client = createSPASassClient().getSupabaseClient();
    setError(null);
    setLoadingCiclos(true);
    setLoadingActividades(true);
    setLoadingInsumos(true);

    await Promise.all([
      fetchReportCiclos(client, filters)
        .then((data) => { setCiclos(data); })
        .catch((err) => { setError(err instanceof Error ? err.message : "Error en reporte de ciclos"); })
        .finally(() => setLoadingCiclos(false)),
      fetchReportActividades(client, filters)
        .then((data) => { setActividades(data); })
        .catch(() => {})
        .finally(() => setLoadingActividades(false)),
      fetchReportInsumos(client, filters)
        .then((data) => { setInsumos(data); })
        .catch(() => {})
        .finally(() => setLoadingInsumos(false)),
    ]);
  }

  // Auto-load on mount
  useEffect(() => {
    void loadReports({ year, weekStart, weekEnd, ubicaciones: selectedUbicaciones, variedades: selectedVariedades });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filter handlers ──────────────────────────────────────────────────────

  function handleMonthChange(val: string) {
    setSelectedMonth(val);
    if (!val) return;
    const [ws, we] = MONTH_WEEK_RANGES[Number(val)] ?? [1, 53];
    setWeekStart(ws);
    setWeekEnd(we);
    // Auto-run immediately — month select is a quick-nav shortcut
    void loadReports({ year, weekStart: ws, weekEnd: we, ubicaciones: selectedUbicaciones, variedades: selectedVariedades });
  }

  function runReport() {
    void loadReports({ year, weekStart, weekEnd, ubicaciones: selectedUbicaciones, variedades: selectedVariedades });
  }

  // ── PDF export ───────────────────────────────────────────────────────────

  function exportToPDF() {
    const titles: Record<TabKey, string> = {
      ciclos: "Reporte de Producción por Semana",
      actividades: "Reporte de Mano de Obra Requerida",
      insumos: "Reporte de Materiales e Insumos",
    };

    let tableHTML = "";
    if (activeTab === "ciclos") tableHTML = buildCiclosHTML(ciclos);
    else if (activeTab === "actividades") tableHTML = buildActividadesHTML(actividades);
    else tableHTML = buildInsumosHTML(insumos);

    const filterText = `Año ${year} — Semanas ${weekStart} a ${weekEnd}`;
    const printContent = `<!DOCTYPE html><html><head>
      <title>${titles[activeTab]}</title>
      <style>
        *{font-family:Arial,sans-serif;box-sizing:border-box}
        body{padding:20px}
        h1{color:#047857;font-size:18px;margin-bottom:4px}
        .sub{color:#6b7280;font-size:12px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:#25B199;color:#fff;padding:8px;text-align:left}
        td{border:1px solid #e5e7eb;padding:6px 8px}
        tr:nth-child(even):not(.total){background:#f9fafb}
        .total{background:#f0fdf4;font-weight:700}
        .right{text-align:right}
        .summary{margin-top:20px;display:flex;gap:16px;flex-wrap:wrap}
        .sc{background:#f0fdf4;padding:12px;border-left:3px solid #25B199;min-width:120px}
        .sc h4{font-size:10px;color:#6b7280;margin:0 0 4px;text-transform:uppercase}
        .sc p{font-size:16px;font-weight:700;color:#047857;margin:0}
        @media print{body{padding:0}@page{margin:1cm;size:landscape}}
      </style>
      </head><body>
      <h1>${titles[activeTab]}</h1>
      <p class="sub">${filterText} | Generado: ${new Date().toLocaleDateString("es-CO")}</p>
      ${tableHTML}
      </body></html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(printContent);
    w.document.close();
    w.onload = () => w.print();
  }

  // ── Print table builders (match FarmPanel output) ────────────────────────

  function buildCiclosHTML(data: CicloReportRow[]): string {
    const groups = groupByWeek(data);
    const grandTotal = data.reduce((s, r) => s + r.cantidadPlaneada, 0);
    let html = `<table><thead><tr><th>Semana</th><th>Fechas</th><th>Ubicación – Cultivo</th><th>Variedad</th><th>Observaciones</th><th class="right">Cantidad</th></tr></thead><tbody>`;
    for (const g of groups) {
      const tot = g.rows.reduce((s, r) => s + r.cantidadPlaneada, 0);
      g.rows.forEach((r, i) => {
        html += `<tr>${i === 0 ? `<td rowspan="${g.rows.length}">${g.weekNum}</td><td rowspan="${g.rows.length}">${g.dateRange}</td>` : ""}
          <td>${r.ubicacionCultivo}</td><td>${r.variedad}</td><td>${r.observaciones ?? "—"}</td><td class="right">${r.cantidadPlaneada.toFixed(2)}</td></tr>`;
      });
      html += `<tr class="total"><td colspan="5" class="right">Total Semana ${g.weekNum}:</td><td class="right">${tot.toFixed(2)}</td></tr>`;
    }
    html += `</tbody></table><div class="summary">
      <div class="sc"><h4>Total Producción</h4><p>${grandTotal.toFixed(2)}</p></div>
      <div class="sc"><h4>Semanas</h4><p>${groups.length}</p></div>
      <div class="sc"><h4>Promedio/Semana</h4><p>${groups.length ? (grandTotal / groups.length).toFixed(2) : "0"}</p></div>
    </div>`;
    return html;
  }

  function buildActividadesHTML(data: ActividadReportRow[]): string {
    const groups = groupByWeek(data);
    const grandTotal = data.reduce((s, r) => s + r.tiempoHoras, 0);
    let html = `<table><thead><tr><th>Semana</th><th>Fechas</th><th>Ubicación – Cultivo</th><th>Actividad</th><th>Observaciones</th><th class="right">Horas</th></tr></thead><tbody>`;
    for (const g of groups) {
      const tot = g.rows.reduce((s, r) => s + r.tiempoHoras, 0);
      g.rows.forEach((r, i) => {
        html += `<tr>${i === 0 ? `<td rowspan="${g.rows.length}">${g.weekNum}</td><td rowspan="${g.rows.length}">${g.dateRange}</td>` : ""}
          <td>${r.ubicacionCultivo}</td><td>${r.actividad}</td><td>${r.observaciones ?? "—"}</td><td class="right">${r.tiempoHoras.toFixed(2)}h</td></tr>`;
      });
      html += `<tr class="total"><td colspan="5" class="right">Total Semana ${g.weekNum}:</td><td class="right">${tot.toFixed(2)}h</td></tr>`;
    }
    html += `</tbody></table><div class="summary">
      <div class="sc"><h4>Total Horas</h4><p>${grandTotal.toFixed(2)}h</p></div>
      <div class="sc"><h4>Días (8h)</h4><p>${(grandTotal / 8).toFixed(1)}</p></div>
      <div class="sc"><h4>Promedio/Semana</h4><p>${groups.length ? (grandTotal / groups.length).toFixed(2) : "0"}h</p></div>
    </div>`;
    return html;
  }

  function buildInsumosHTML(data: InsumoReportRow[]): string {
    const groups = groupByWeek(data);
    const grandTotal = data.reduce((s, r) => s + r.costoEstimado, 0);
    const fmt = (n: number) => `$${n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    let html = `<table><thead><tr><th>Semana</th><th>Fechas</th><th>Ubicación – Cultivo</th><th>Insumo</th><th>Observaciones</th><th class="right">Cantidad</th><th class="right">Costo</th></tr></thead><tbody>`;
    for (const g of groups) {
      const tot = g.rows.reduce((s, r) => s + r.costoEstimado, 0);
      g.rows.forEach((r, i) => {
        html += `<tr>${i === 0 ? `<td rowspan="${g.rows.length}">${g.weekNum}</td><td rowspan="${g.rows.length}">${g.dateRange}</td>` : ""}
          <td>${r.ubicacionCultivo}</td><td>${r.insumo}</td><td>${r.observaciones ?? "—"}</td><td class="right">${r.cantidadRequerida.toFixed(2)} ${r.unidad}</td><td class="right">${fmt(r.costoEstimado)}</td></tr>`;
      });
      html += `<tr class="total"><td colspan="6" class="right">Total Semana ${g.weekNum}:</td><td class="right">${fmt(tot)}</td></tr>`;
    }
    html += `</tbody></table><div class="summary">
      <div class="sc"><h4>Costo Total</h4><p>${fmt(grandTotal)}</p></div>
      <div class="sc"><h4>Semanas</h4><p>${groups.length}</p></div>
      <div class="sc"><h4>Promedio/Semana</h4><p>${groups.length ? fmt(grandTotal / groups.length) : "$0"}</p></div>
    </div>`;
    return html;
  }

  // ── Grouped data for render ──────────────────────────────────────────────

  const cicloGroups = useMemo(() => groupByWeek(ciclos), [ciclos]);
  const actividadGroups = useMemo(() => groupByWeek(actividades), [actividades]);
  const insumoGroups = useMemo(() => groupByWeek(insumos), [insumos]);

  // Summary stats
  const cicloStats = useMemo(() => {
    const total = ciclos.reduce((s, r) => s + r.cantidadPlaneada, 0);
    const avg = cicloGroups.length ? total / cicloGroups.length : 0;
    const peak = cicloGroups.length
      ? cicloGroups.reduce((mx, g) => {
          const t = g.rows.reduce((s, r) => s + r.cantidadPlaneada, 0);
          return t > mx.val ? { week: g.weekNum, val: t } : mx;
        }, { week: 0, val: 0 })
      : null;
    return { total, avg, peak };
  }, [ciclos, cicloGroups]);

  const actStats = useMemo(() => {
    const total = actividades.reduce((s, r) => s + r.tiempoHoras, 0);
    const avg = actividadGroups.length ? total / actividadGroups.length : 0;
    const peak = actividadGroups.length
      ? actividadGroups.reduce((mx, g) => {
          const t = g.rows.reduce((s, r) => s + r.tiempoHoras, 0);
          return t > mx.val ? { week: g.weekNum, val: t } : mx;
        }, { week: 0, val: 0 })
      : null;
    return { total, avg, peak };
  }, [actividades, actividadGroups]);

  const insumoStats = useMemo(() => {
    const total = insumos.reduce((s, r) => s + r.costoEstimado, 0);
    const avg = insumoGroups.length ? total / insumoGroups.length : 0;
    const peak = insumoGroups.length
      ? insumoGroups.reduce((mx, g) => {
          const t = g.rows.reduce((s, r) => s + r.costoEstimado, 0);
          return t > mx.val ? { week: g.weekNum, val: t } : mx;
        }, { week: 0, val: 0 })
      : null;
    return { total, avg, peak };
  }, [insumos, insumoGroups]);

  const fmtCOP = (n: number) =>
    `$${n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const isLoading = loadingCiclos || loadingActividades || loadingInsumos;
  const activeLoading: Record<TabKey, boolean> = {
    ciclos: loadingCiclos,
    actividades: loadingActividades,
    insumos: loadingInsumos,
  };

  // ── Week selects ──────────────────────────────────────────────────────────

  const weekOptions = Array.from({ length: 53 }, (_, i) => i + 1);
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const selectCls =
    "w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary";
  // Auto-width variant for compact inline selects
  const selectClsAuto =
    "rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary";
  const labelCls = "block text-xs font-medium text-body-color dark:text-body-color-dark";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Filter panel ── */}
      <div className="rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark">
        {/* Header: title + actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-stroke/50 px-4 py-3 dark:border-strokedark/50">
          <div className="flex w-full items-center justify-between sm:w-auto">
            <p className="text-sm font-medium text-black dark:text-white">Filtros</p>
          </div>
          
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2">
            <div className="hidden items-center rounded-lg border border-stroke bg-gray-50/50 p-1 dark:border-strokedark dark:bg-dark md:flex mr-2">
               <button type="button" onClick={() => setViewMode("table")} className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${viewMode === "table" ? "bg-white text-black shadow-sm dark:bg-white/10 dark:text-white" : "text-body-color hover:text-black dark:text-body-color-dark dark:hover:text-white"}`}>Tabla</button>
               <button type="button" onClick={() => setViewMode("card")} className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${viewMode === "card" ? "bg-white text-black shadow-sm dark:bg-white/10 dark:text-white" : "text-body-color hover:text-black dark:text-body-color-dark dark:hover:text-white"}`}>Tarjetas</button>
            </div>
          
            <button
              type="button"
              onClick={exportToPDF}
              className="inline-flex flex-1 sm:flex-none justify-center items-center gap-1.5 rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-body-color transition-colors hover:bg-gray-50 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar
            </button>
            <button
              type="button"
              onClick={runReport}
              disabled={isLoading}
              className="inline-flex flex-1 sm:flex-none justify-center items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? "animate-spin" : ""}>
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              {isLoading ? "..." : "Generar"}
            </button>
          </div>
        </div>

        {/* All filter controls in one responsive flex column */}
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
            <div className="space-y-1">
              <label className={labelCls}>Año</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={`${selectClsAuto} w-full`}>
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Mes</label>
              <select value={selectedMonth} onChange={(e) => handleMonthChange(e.target.value)} className={`${selectClsAuto} w-full`}>
                <option value="">Todo el año</option>
                {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Sem. inicio</label>
              <select value={weekStart} onChange={(e) => { setWeekStart(Number(e.target.value)); setSelectedMonth(""); }} className={`${selectClsAuto} w-full`}>
                {weekOptions.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Sem. fin</label>
              <select value={weekEnd} onChange={(e) => { setWeekEnd(Number(e.target.value)); setSelectedMonth(""); }} className={`${selectClsAuto} w-full`}>
                {weekOptions.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <FilterPills
              label="Ubicaciones"
              items={initialUbicaciones.map((u) => ({
                id: u.id,
                label: u.nombre_cultivo ?? u.vereda ?? u.id,
              }))}
              selected={selectedUbicaciones}
              onChange={setSelectedUbicaciones}
            />

            <FilterPills
              label="Variedades"
              items={initialVariedades.map((v) => ({ id: v.id, label: v.nombre }))}
              selected={selectedVariedades}
              onChange={setSelectedVariedades}
            />
          </div>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1 border-b border-stroke pb-0 dark:border-strokedark">
          {(
            [
              { key: "ciclos" as TabKey, label: "Producción por Semana", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
              { key: "actividades" as TabKey, label: "Mano de Obra", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 2 2 4-4" /><path d="m3 7 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" /></svg> },
              { key: "insumos" as TabKey, label: "Materiales", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg> },
            ] as { key: TabKey; label: string; icon: React.ReactNode }[]
          ).map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={[
                "inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === key
                  ? "border-b-2 border-primary text-primary dark:text-primary-300"
                  : "text-body-color hover:text-black dark:text-body-color-dark dark:hover:text-white",
              ].join(" ")}
            >
              {icon}
              {label}
              {activeLoading[key] && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary dark:bg-primary-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="overflow-hidden rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark">
        {/* CICLOS tab */}
        {activeTab === "ciclos" && (
          <>
            {loadingCiclos ? (
              <TableSkeleton />
            ) : cicloGroups.length === 0 ? (
              <EmptyState tab="ciclos" year={year} weekStart={weekStart} weekEnd={weekEnd} />
            ) : (
              <>
                {/* Gráfico: producción programada por semana */}
                <div className="border-b border-stroke px-4 py-5 dark:border-strokedark">
                  <ProduccionProgramadaChart
                    ciclos={ciclos}
                    weekSlots={ciclosWeekSlots}
                    showIntro
                    chartClassName="h-[min(360px,50vh)]"
                  />
                </div>

                <div className={`${viewMode === "table" ? "hidden md:block" : "hidden"} overflow-x-auto`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-secondary-100 bg-secondary-100/30 dark:border-secondary-500/20 dark:bg-secondary-500/5">
                        <th className={TH}>Ubicación – Cultivo</th>
                        <th className={TH}>Variedad</th>
                        <th className={TH}>Observaciones</th>
                        <th className={`${TH} ${NUM}`}>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cicloGroups.map((g) => {
                        const weekTotal = g.rows.reduce((s, r) => s + r.cantidadPlaneada, 0);
                        return (
                          <React.Fragment key={g.weekNum}>
                            {/* Group header band */}
                            <tr className="border-t border-stroke bg-gray-50 dark:border-strokedark dark:bg-white/[0.04]">
                              <td colSpan={3} className={GH}>
                                <span className="font-semibold text-black dark:text-white">Sem. {g.weekNum}</span>
                                <span className="ml-2 text-body-color dark:text-body-color-dark">{g.dateRange}</span>
                              </td>
                              <td className={`${GH} ${NUM} font-semibold text-primary dark:text-primary-300`}>
                                {weekTotal.toFixed(2)}
                              </td>
                            </tr>
                            {/* Data rows */}
                            {g.rows.map((r, i) => (
                              <tr key={i} className="border-t border-stroke/50 hover:bg-gray-50 dark:border-strokedark/50 dark:hover:bg-white/5">
                                <td className={TD}>{r.ubicacionCultivo}</td>
                                <td className={TD}>{r.variedad}</td>
                                <td className={`${TD} max-w-[220px] truncate`} title={r.observaciones ?? ""}>{r.observaciones ?? "—"}</td>
                                <td className={`${TD} ${NUM}`}>{r.cantidadPlaneada.toFixed(2)}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* CARD VIEW */}
                <div className={`${viewMode === "table" ? "grid md:hidden" : "grid"} grid-cols-1 gap-4 p-4 lg:grid-cols-2 xl:grid-cols-3`}>
                   {cicloGroups.map((g) => {
                      const weekTotal = g.rows.reduce((s, r) => s + r.cantidadPlaneada, 0);
                      return (
                        <div key={g.weekNum} className="overflow-hidden rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-dark">
                          <div className="flex items-center justify-between border-b border-stroke/50 bg-gray-50/50 px-4 py-3 dark:border-strokedark/50 dark:bg-white/5">
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-black dark:text-white">Semana {g.weekNum}</span>
                               <span className="text-[11px] font-medium text-body-color dark:text-body-color-dark">{g.dateRange}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Prod. Total</span>
                              <span className="text-sm font-bold text-primary dark:text-primary-300">{weekTotal.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="divide-y divide-stroke/50 dark:divide-strokedark/50 px-4 py-2">
                             {g.rows.map((r, i) => (
                               <div key={i} className="flex flex-col gap-1 py-2">
                                  <div className="flex justify-between gap-2">
                                    <span className="text-xs font-semibold text-black dark:text-white truncate" title={r.ubicacionCultivo}>{r.ubicacionCultivo}</span>
                                    <span className="text-xs font-bold text-black dark:text-white tabular-nums shrink-0">{r.cantidadPlaneada.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-[11px] text-body-color dark:text-body-color-dark items-center gap-2">
                                     <span className="truncate" title={r.variedad}>{r.variedad}</span>
                                     <span className="truncate max-w-[50%] shrink-0 text-right" title={r.observaciones ?? ""}>{r.observaciones ?? "—"}</span>
                                  </div>
                               </div>
                             ))}
                          </div>
                        </div>
                      );
                   })}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-stroke px-4 py-3 dark:border-strokedark md:grid-cols-4">
                  <SummaryCard label="Total Producción" value={cicloStats.total.toFixed(2)} />
                  <SummaryCard label="Semanas con Prod." value={String(cicloGroups.length)} />
                  <SummaryCard label="Promedio / Semana" value={cicloStats.avg.toFixed(2)} />
                  {cicloStats.peak && cicloStats.peak.week > 0 && (
                    <SummaryCard label="Semana Pico" value={`S${cicloStats.peak.week} (${cicloStats.peak.val.toFixed(2)})`} />
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ACTIVIDADES tab */}
        {activeTab === "actividades" && (
          <>
            {loadingActividades ? (
              <TableSkeleton />
            ) : actividadGroups.length === 0 ? (
              <EmptyState tab="actividades" year={year} weekStart={weekStart} weekEnd={weekEnd} />
            ) : (
              <>
                <div className={`${viewMode === "table" ? "hidden md:block" : "hidden"} overflow-x-auto`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-secondary-100 bg-secondary-100/30 dark:border-secondary-500/20 dark:bg-secondary-500/5">
                        <th className={TH}>Ubicación – Cultivo</th>
                        <th className={TH}>Actividad</th>
                        <th className={TH}>Observaciones</th>
                        <th className={`${TH} ${NUM}`}>Horas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividadGroups.map((g) => {
                        const weekTotal = g.rows.reduce((s, r) => s + r.tiempoHoras, 0);
                        return (
                          <React.Fragment key={g.weekNum}>
                            <tr className="border-t border-stroke bg-gray-50 dark:border-strokedark dark:bg-white/[0.04]">
                              <td colSpan={3} className={GH}>
                                <span className="font-semibold text-black dark:text-white">Sem. {g.weekNum}</span>
                                <span className="ml-2 text-body-color dark:text-body-color-dark">{g.dateRange}</span>
                              </td>
                              <td className={`${GH} ${NUM} font-semibold text-primary dark:text-primary-300`}>
                                {weekTotal.toFixed(2)}h
                              </td>
                            </tr>
                            {g.rows.map((r, i) => (
                              <tr key={i} className="border-t border-stroke/50 hover:bg-gray-50 dark:border-strokedark/50 dark:hover:bg-white/5">
                                <td className={TD}>{r.ubicacionCultivo}</td>
                                <td className={TD}>{r.actividad}</td>
                                <td className={`${TD} max-w-[220px] truncate`} title={r.observaciones ?? ""}>{r.observaciones ?? "—"}</td>
                                <td className={`${TD} ${NUM}`}>{r.tiempoHoras.toFixed(2)}h</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* CARD VIEW */}
                <div className={`${viewMode === "table" ? "grid md:hidden" : "grid"} grid-cols-1 gap-4 p-4 lg:grid-cols-2 xl:grid-cols-3`}>
                   {actividadGroups.map((g) => {
                      const weekTotal = g.rows.reduce((s, r) => s + r.tiempoHoras, 0);
                      return (
                        <div key={g.weekNum} className="overflow-hidden rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-dark">
                          <div className="flex items-center justify-between border-b border-stroke/50 bg-gray-50/50 px-4 py-3 dark:border-strokedark/50 dark:bg-white/5">
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-black dark:text-white">Semana {g.weekNum}</span>
                               <span className="text-[11px] font-medium text-body-color dark:text-body-color-dark">{g.dateRange}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Horas Tolales</span>
                              <span className="text-sm font-bold text-primary dark:text-primary-300">{weekTotal.toFixed(2)}h</span>
                            </div>
                          </div>
                          
                          <div className="divide-y divide-stroke/50 dark:divide-strokedark/50 px-4 py-2">
                             {g.rows.map((r, i) => (
                               <div key={i} className="flex flex-col gap-1 py-2">
                                  <div className="flex justify-between gap-2">
                                    <span className="text-xs font-semibold text-black dark:text-white truncate" title={r.actividad}>{r.actividad}</span>
                                    <span className="text-xs font-bold text-black dark:text-white tabular-nums shrink-0">{r.tiempoHoras.toFixed(2)}h</span>
                                  </div>
                                  <div className="flex justify-between text-[11px] text-body-color dark:text-body-color-dark items-center gap-2">
                                     <span className="truncate" title={r.ubicacionCultivo}>{r.ubicacionCultivo}</span>
                                     <span className="truncate max-w-[50%] shrink-0 text-right" title={r.observaciones ?? ""}>{r.observaciones ?? "—"}</span>
                                  </div>
                               </div>
                             ))}
                          </div>
                        </div>
                      );
                   })}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-stroke px-4 py-3 dark:border-strokedark md:grid-cols-4">
                  <SummaryCard label="Total Horas" value={`${actStats.total.toFixed(2)}h`} />
                  <SummaryCard label="Equiv. en Días (8h)" value={`${(actStats.total / 8).toFixed(1)} días`} />
                  <SummaryCard label="Promedio / Semana" value={`${actStats.avg.toFixed(2)}h`} />
                  {actStats.peak && actStats.peak.week > 0 && (
                    <SummaryCard label="Semana Pico" value={`S${actStats.peak.week} (${actStats.peak.val.toFixed(2)}h)`} />
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* INSUMOS tab */}
        {activeTab === "insumos" && (
          <>
            {loadingInsumos ? (
              <TableSkeleton />
            ) : insumoGroups.length === 0 ? (
              <EmptyState tab="insumos" year={year} weekStart={weekStart} weekEnd={weekEnd} />
            ) : (
              <>
                {/* TABLE VIEW */}
                <div className={`${viewMode === "table" ? "hidden md:block" : "hidden"} overflow-x-auto`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-secondary-100 bg-secondary-100/30 dark:border-secondary-500/20 dark:bg-secondary-500/5">
                        <th className={TH}>Ubicación – Cultivo</th>
                        <th className={TH}>Insumo</th>
                        <th className={TH}>Observaciones</th>
                        <th className={`${TH} ${NUM} hidden sm:table-cell`}>Cantidad</th>
                        <th className={`${TH} ${NUM}`}>Costo Est.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insumoGroups.map((g) => {
                        const weekTotal = g.rows.reduce((s, r) => s + r.costoEstimado, 0);
                        return (
                          <React.Fragment key={g.weekNum}>
                            <tr className="border-t border-stroke bg-gray-50 dark:border-strokedark dark:bg-white/[0.04]">
                              <td colSpan={4} className={GH}>
                                <span className="font-semibold text-black dark:text-white">Sem. {g.weekNum}</span>
                                <span className="ml-2 text-body-color dark:text-body-color-dark">{g.dateRange}</span>
                              </td>
                              <td className={`${GH} ${NUM} font-semibold text-primary dark:text-primary-300`}>
                                {fmtCOP(weekTotal)}
                              </td>
                            </tr>
                            {g.rows.map((r, i) => (
                              <tr key={i} className="border-t border-stroke/50 hover:bg-gray-50 dark:border-strokedark/50 dark:hover:bg-white/5">
                                <td className={TD}>{r.ubicacionCultivo}</td>
                                <td className={TD}>{r.insumo}</td>
                                <td className={`${TD} max-w-[220px] truncate`} title={r.observaciones ?? ""}>{r.observaciones ?? "—"}</td>
                                <td className={`${TD} ${NUM} hidden sm:table-cell`}>
                                  {r.cantidadRequerida.toFixed(2)} {r.unidad}
                                </td>
                                <td className={`${TD} ${NUM}`}>{fmtCOP(r.costoEstimado)}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* CARD VIEW */}
                <div className={`${viewMode === "table" ? "grid md:hidden" : "grid"} grid-cols-1 gap-4 p-4 lg:grid-cols-2 xl:grid-cols-3`}>
                   {insumoGroups.map((g) => {
                      const weekTotal = g.rows.reduce((s, r) => s + r.costoEstimado, 0);
                      return (
                        <div key={g.weekNum} className="overflow-hidden rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-dark">
                          <div className="flex items-center justify-between border-b border-stroke/50 bg-gray-50/50 px-4 py-3 dark:border-strokedark/50 dark:bg-white/5">
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-black dark:text-white">Semana {g.weekNum}</span>
                               <span className="text-[11px] font-medium text-body-color dark:text-body-color-dark">{g.dateRange}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">Costo Est.</span>
                              <span className="text-sm font-bold text-primary dark:text-primary-300">{fmtCOP(weekTotal)}</span>
                            </div>
                          </div>
                          
                          <div className="divide-y divide-stroke/50 dark:divide-strokedark/50 px-4 py-2">
                             {g.rows.map((r, i) => (
                               <div key={i} className="flex flex-col py-2">
                                  <div className="flex justify-between items-start gap-2 mb-1">
                                    <span className="text-xs font-semibold text-black dark:text-white truncate" title={r.insumo}>{r.insumo}</span>
                                    <div className="flex flex-col items-end shrink-0">
                                      <span className="text-xs font-bold text-black dark:text-white tabular-nums">{fmtCOP(r.costoEstimado)}</span>
                                      <span className="text-[10px] text-body-color dark:text-body-color-dark">{r.cantidadRequerida.toFixed(2)} {r.unidad}</span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-[11px] text-body-color dark:text-body-color-dark items-center gap-2">
                                     <span className="truncate" title={r.ubicacionCultivo}>{r.ubicacionCultivo}</span>
                                     <span className="truncate max-w-[50%] shrink-0 text-right" title={r.observaciones ?? ""}>{r.observaciones ?? "—"}</span>
                                  </div>
                               </div>
                             ))}
                          </div>
                        </div>
                      );
                   })}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-stroke px-4 py-3 dark:border-strokedark md:grid-cols-4">
                  <SummaryCard label="Costo Total Estimado" value={fmtCOP(insumoStats.total)} />
                  <SummaryCard label="Semanas con Insumos" value={String(insumoGroups.length)} />
                  <SummaryCard label="Promedio / Semana" value={fmtCOP(insumoStats.avg)} />
                  {insumoStats.peak && insumoStats.peak.week > 0 && (
                    <SummaryCard label="Semana Pico" value={`S${insumoStats.peak.week} (${fmtCOP(insumoStats.peak.val)})`} />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
