"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { reloadProveedorDashboard } from "@/app/proveedor-portal/actions";
import { COST_STACK_KEYS, type CostStackKey, type DashboardPayload } from "@/lib/farm/dashboard";

function fmtCOP(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

const cardCls =
  "rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-dark";
const labelCls =
  "text-xs font-medium uppercase tracking-wide text-body-color/70 dark:text-body-color-dark/60";
const inputCls =
  "w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-dark dark:text-white dark:hover:border-primary/40 dark:focus:ring-primary/15";

const FINANCIAL_COLORS: Record<string, string> = {
  INSUMO: "rgba(124, 58, 237, 0.85)",
  MANO_OBRA: "rgba(217, 119, 6, 0.85)",
  ARRENDAMIENTO: "rgba(220, 38, 38, 0.85)",
  SERVICIO: "rgba(245, 158, 11, 0.85)",
  OTRO: "rgba(107, 114, 128, 0.85)",
  GENERAL: "rgba(100, 116, 139, 0.85)",
};

const COST_BAR_NAMES: Record<CostStackKey, string> = {
  INSUMO: "Insumos",
  MANO_OBRA: "Mano de obra",
  ARRENDAMIENTO: "Arrendamiento",
  SERVICIO: "Servicios",
  OTRO: "Otros",
  GENERAL: "General",
};

function FinancialTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { name?: string; value?: number; color?: string }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-stroke bg-white px-3 py-2 text-xs shadow-lg dark:border-strokedark dark:bg-dark">
      <ul className="max-h-48 space-y-0.5 overflow-y-auto">
        {payload
          .filter((p) => (p.value ?? 0) !== 0)
          .map((p, i) => (
            <li key={`${p.name}-${i}`} className="flex justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: p.color }} />
                {p.name}
              </span>
              <span className="font-medium tabular-nums">{fmtCOP(Number(p.value))}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}

type Props = {
  initial: DashboardPayload;
  defaultFrom: string;
  defaultTo: string;
  defaultFinancialYear: number;
};

export default function ProveedorDashboard({
  initial,
  defaultFrom,
  defaultTo,
  defaultFinancialYear,
}: Props) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [financialYear, setFinancialYear] = useState(defaultFinancialYear);
  const [data, setData] = useState<DashboardPayload>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    const years: number[] = [];
    for (let y = cy - 5; y <= cy + 1; y++) years.push(y);
    return years;
  }, []);

  const applyFilters = useCallback(() => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await reloadProveedorDashboard({ from, to, financialYear });
        setData(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar datos");
      }
    });
  }, [from, to, financialYear]);

  const { kpis } = data;

  const quickActions = [
    {
      href: "/proveedor-portal/farm/cultivos",
      title: "Cultivos",
      subtitle: "Gestionar lotes y estado",
      icon: "🌱",
      ring: "from-emerald-500/20 to-primary-500/10",
    },
    {
      href: "/proveedor-portal/farm/produccion",
      title: "Producción",
      subtitle: "Registrar cosechas y ventas",
      icon: "📦",
      ring: "from-primary-500/20 to-secondary-500/10",
    },
    {
      href: "/proveedor-portal/farm/costos",
      title: "Costos",
      subtitle: "Mano de obra, insumos y más",
      icon: "🧾",
      ring: "from-red-500/15 to-amber-500/10",
    },
    {
      href: "/proveedor-portal/farm/inventario",
      title: "Inventario",
      subtitle: "Stock y movimientos",
      icon: "📊",
      ring: "from-violet-500/15 to-primary-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
            Resumen de tu finca: costos, producción e inventario
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-stroke bg-white p-4 dark:border-strokedark dark:bg-dark">
          <div>
            <label className={`${labelCls} mb-1 block normal-case`}>Desde</label>
            <input type="date" className={`${inputCls} w-40`} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={`${labelCls} mb-1 block normal-case`}>Hasta</label>
            <input type="date" className={`${inputCls} w-40`} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className={`${labelCls} mb-1 block normal-case`}>Año (flujo financiero)</label>
            <select
              className={`${inputCls} w-32`}
              value={financialYear}
              onChange={(e) => setFinancialYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={applyFilters}
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 disabled:opacity-60 dark:hover:bg-primary-400"
          >
            {pending ? "Actualizando…" : "Aplicar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className={cardCls}>
          <p className={labelCls}>Cultivos activos</p>
          <p className="mt-2 text-3xl font-bold text-primary dark:text-primary-300">{kpis.cultivosActivos}</p>
        </div>
        <div className={cardCls}>
          <p className={labelCls}>Costos (período)</p>
          <p className="mt-2 text-2xl font-bold text-black dark:text-white">{fmtCOP(kpis.costosPeriodo)}</p>
        </div>
        <div className={cardCls}>
          <p className={labelCls}>Ingresos (período)</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {fmtCOP(kpis.ingresosPeriodo)}
          </p>
        </div>
        <div className={cardCls}>
          <p className={labelCls}>Actividades planificadas</p>
          <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">{kpis.actividadesPlanificadas}</p>
        </div>
        <div className={cardCls}>
          <p className={labelCls}>Unidades cosechadas</p>
          <p className="mt-2 text-3xl font-bold text-black dark:text-white">
            {kpis.unidadesCosechadas.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className={cardCls}>
          <p className={labelCls}>Insumos bajo mínimo</p>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{kpis.insumosBajoMinimo}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-black dark:text-white">Acciones rápidas</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`group relative overflow-hidden rounded-xl border border-stroke bg-gradient-to-br p-4 transition hover:border-primary/40 hover:shadow-md dark:border-strokedark dark:bg-dark ${a.ring}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden>
                  {a.icon}
                </span>
                <div>
                  <p className="font-semibold text-black dark:text-white">{a.title}</p>
                  <p className="mt-0.5 text-xs text-body-color dark:text-body-color-dark">{a.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Financial chart */}
      <div className={cardCls}>
        <h2 className="mb-1 text-base font-semibold text-black dark:text-white">
          Flujo financiero — {data.financialYear}
        </h2>
        <p className="mb-4 text-xs text-body-color dark:text-body-color-dark">
          Costos por tipo (barras apiladas), ingresos y neto por mes (líneas).
        </p>
        <div className="h-[360px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.financialMonthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-body-color" />
              <YAxis tickFormatter={(v) => fmtCompact(Number(v))} tick={{ fontSize: 11 }} width={44} />
              <Tooltip content={<FinancialTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {COST_STACK_KEYS.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="costos"
                  fill={FINANCIAL_COLORS[key]}
                  name={COST_BAR_NAMES[key]}
                />
              ))}
              <Line
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line type="monotone" dataKey="neto" name="Neto" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={cardCls}>
          <h2 className="mb-1 text-base font-semibold text-black dark:text-white">Producción por mes</h2>
          <p className="mb-4 text-xs text-body-color dark:text-body-color-dark">Cantidad cosechada en el período seleccionado.</p>
          {data.produccionMonthly.length === 0 ? (
            <p className="py-12 text-center text-sm text-body-color dark:text-body-color-dark">
              No hay producción registrada en este rango.
            </p>
          ) : (
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.produccionMonthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={44} />
                  <Tooltip
                    formatter={(v: number) => [v.toLocaleString("es-CO"), "Unidades"]}
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Bar dataKey="unidades" name="Cosechada" fill="hsl(170, 65%, 42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={cardCls}>
          <h2 className="mb-1 text-base font-semibold text-black dark:text-white">Inventario — déficit vs mínimo</h2>
          <p className="mb-4 text-xs text-body-color dark:text-body-color-dark">
            Insumos con stock por debajo del mínimo (peores primero).
          </p>
          {data.inventarioRisk.length === 0 ? (
            <p className="py-12 text-center text-sm text-body-color dark:text-body-color-dark">
              Ningún insumo bajo el mínimo configurado.
            </p>
          ) : (
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.inventarioRisk}
                  margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nombre" width={120} tick={{ fontSize: 10 }} interval={0} />
                  <Tooltip
                    formatter={(v: number, _n, item) => {
                      const p = item?.payload as { stock_actual: number; stock_minimo: number };
                      return [
                        `${v.toFixed(1)} (${p?.stock_actual ?? "—"} vs mín. ${p?.stock_minimo ?? "—"})`,
                        "Déficit",
                      ];
                    }}
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Bar dataKey="deficit" name="Déficit" fill="#dc2626" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
