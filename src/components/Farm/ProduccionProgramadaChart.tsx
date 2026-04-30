"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CicloReportRow } from "@/lib/farm/reportes";
import {
  buildCiclosProduccionChartData,
  type ProduccionGroupBy,
  type ProduccionWeekSlot,
  PRODUCCION_CHART_COLORS,
} from "@/lib/farm/reportes-chart";
import {
  MERCADO_FESTIVIDADES,
  MERCADO_FESTIVIDAD_ACCENT,
  MERCADO_FESTIVIDAD_FILL,
  intersectaRangoVisible,
  tramosReferencePara,
} from "@/lib/farm/mercado-festividades";

type Props = {
  ciclos: CicloReportRow[];
  weekSlots: ProduccionWeekSlot[];
  /** Si es false, no muestra título ni texto intro (p. ej. dashboard con título propio). */
  showIntro?: boolean;
  /** Altura del área del gráfico (clase Tailwind o número vía estilo). */
  chartClassName?: string;
};

export default function ProduccionProgramadaChart({
  ciclos,
  weekSlots,
  showIntro = true,
  chartClassName = "h-[min(360px,50vh)]",
}: Props) {
  const [produccionGroupBy, setProduccionGroupBy] =
    useState<ProduccionGroupBy>("variedad");
  const [mostrarAcumulado, setMostrarAcumulado] = useState(true);
  const [mostrarReferenciaMercado, setMostrarReferenciaMercado] = useState(true);
  const [festividadAbierta, setFestividadAbierta] = useState<string | null>(null);
  const mercadoPanelRef = useRef<HTMLDivElement | null>(null);

  const produccionChart = useMemo(
    () =>
      buildCiclosProduccionChartData(
        ciclos,
        produccionGroupBy,
        weekSlots,
      ),
    [ciclos, produccionGroupBy, weekSlots],
  );

  const rowRefs = useMemo(
    () =>
      produccionChart.data.map((r) => ({
        weekLabel: String(r.weekLabel),
        weekNum: Number(r.weekNum),
        isoYear: Number(r.isoYear),
      })),
    [produccionChart.data],
  );

  const mercadoReferenceSegments = useMemo(() => {
    if (!mostrarReferenciaMercado) return [] as { key: string; x1: string; x2: string; fill: string }[];
    const out: { key: string; x1: string; x2: string; fill: string }[] = [];
    for (const f of MERCADO_FESTIVIDADES) {
      tramosReferencePara(rowRefs, f).forEach((t, i) => {
        out.push({ key: `${f.id}-${i}`, x1: t.x1, x2: t.x2, fill: t.fill });
      });
    }
    return out;
  }, [rowRefs, mostrarReferenciaMercado]);

  useEffect(() => {
    if (festividadAbierta == null) return;
    const onDown = (e: MouseEvent) => {
      const el = mercadoPanelRef.current;
      if (el && !el.contains(e.target as Node)) {
        setFestividadAbierta(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFestividadAbierta(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [festividadAbierta]);

  if (weekSlots.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-body-color dark:text-body-color-dark">
        Sin semanas en el rango de fechas (revisa &quot;Desde&quot; y &quot;Hasta&quot;).
      </p>
    );
  }

  return (
    <div>
      {showIntro ? (
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white">
              Producción programada por semana
            </h3>
            <p className="text-xs text-body-color dark:text-body-color-dark">
              Cantidad planificada (ciclos). El acumulado suma desde la primera
              semana del rango.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div className="inline-flex rounded-lg border border-stroke p-0.5 dark:border-strokedark">
              <button
                type="button"
                onClick={() => setProduccionGroupBy("variedad")}
                className={[
                  "rounded-md px-2.5 py-1 text-xs font-medium transition",
                  produccionGroupBy === "variedad"
                    ? "bg-primary-100 text-primary dark:bg-primary-500/20 dark:text-primary-300"
                    : "text-body-color hover:text-black dark:text-body-color-dark dark:hover:text-white",
                ].join(" ")}
              >
                Por variedad
              </button>
              <button
                type="button"
                onClick={() => setProduccionGroupBy("cultivo")}
                className={[
                  "rounded-md px-2.5 py-1 text-xs font-medium transition",
                  produccionGroupBy === "cultivo"
                    ? "bg-primary-100 text-primary dark:bg-primary-500/20 dark:text-primary-300"
                    : "text-body-color hover:text-black dark:text-body-color-dark dark:hover:text-white",
                ].join(" ")}
              >
                Por cultivo
              </button>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-body-color dark:text-body-color-dark">
              <input
                type="checkbox"
                className="rounded border-stroke text-primary focus:ring-primary/30 dark:border-strokedark"
                checked={mostrarAcumulado}
                onChange={(e) => setMostrarAcumulado(e.target.checked)}
              />
              Línea acumulada
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-body-color dark:text-body-color-dark">
              <input
                type="checkbox"
                className="rounded border-stroke text-primary focus:ring-primary/30 dark:border-strokedark"
                checked={mostrarReferenciaMercado}
                onChange={(e) => setMostrarReferenciaMercado(e.target.checked)}
              />
              Referencia mercado
            </label>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="inline-flex rounded-lg border border-stroke p-0.5 dark:border-strokedark">
            <button
              type="button"
              onClick={() => setProduccionGroupBy("variedad")}
              className={[
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                produccionGroupBy === "variedad"
                  ? "bg-primary-100 text-primary dark:bg-primary-500/20 dark:text-primary-300"
                  : "text-body-color hover:text-black dark:text-body-color-dark dark:hover:text-white",
              ].join(" ")}
            >
              Por variedad
            </button>
            <button
              type="button"
              onClick={() => setProduccionGroupBy("cultivo")}
              className={[
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                produccionGroupBy === "cultivo"
                  ? "bg-primary-100 text-primary dark:bg-primary-500/20 dark:text-primary-300"
                  : "text-body-color hover:text-black dark:text-body-color-dark dark:hover:text-white",
              ].join(" ")}
            >
              Por cultivo
            </button>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-body-color dark:text-body-color-dark">
            <input
              type="checkbox"
              className="rounded border-stroke text-primary focus:ring-primary/30 dark:border-strokedark"
              checked={mostrarAcumulado}
              onChange={(e) => setMostrarAcumulado(e.target.checked)}
            />
            Línea acumulada
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-body-color dark:text-body-color-dark">
            <input
              type="checkbox"
              className="rounded border-stroke text-primary focus:ring-primary/30 dark:border-strokedark"
              checked={mostrarReferenciaMercado}
              onChange={(e) => setMostrarReferenciaMercado(e.target.checked)}
            />
            Referencia mercado
          </label>
        </div>
      )}
      <div className={`w-full min-w-0 ${chartClassName}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={produccionChart.data}
            margin={{ top: 8, right: mostrarAcumulado ? 16 : 8, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-stroke dark:stroke-strokedark"
            />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              className="fill-body-color"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10 }}
              width={44}
              tickFormatter={(v) =>
                Math.abs(v) >= 1000
                  ? `${(v / 1000).toFixed(1)}k`
                  : String(v)
              }
            />
            {mostrarAcumulado && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }}
                width={48}
                tickFormatter={(v) =>
                  Math.abs(v) >= 1000
                    ? `${(v / 1000).toFixed(1)}k`
                    : String(v)
                }
              />
            )}
            {mostrarReferenciaMercado &&
              mercadoReferenceSegments.map((s) => (
                <ReferenceArea
                  key={s.key}
                  yAxisId="left"
                  x1={s.x1}
                  x2={s.x2}
                  fill={s.fill}
                  stroke="none"
                  isAnimationActive={false}
                />
              ))}
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as {
                  dateRange?: string;
                  weekNum?: number;
                  isoYear?: number;
                };
                return (
                  <div className="max-w-[min(90vw,280px)] rounded-lg border border-stroke bg-white px-2.5 py-2 text-xs shadow-lg dark:border-strokedark dark:bg-dark">
                    <p className="mb-1 font-semibold text-black dark:text-white">
                      {row?.isoYear != null ? (
                        <span>Sem. {row.weekNum} ({row.isoYear}) </span>
                      ) : (
                        <span>Sem. {row?.weekNum ?? label} </span>
                      )}
                      {row?.dateRange ? (
                        <span className="font-normal text-body-color dark:text-body-color-dark">
                          {row.dateRange}
                        </span>
                      ) : null}
                    </p>
                    <ul className="max-h-40 space-y-0.5 overflow-y-auto">
                      {payload
                        .filter(
                          (p) =>
                            (Number(p.value) || 0) !== 0 ||
                            p.dataKey === "acumulado",
                        )
                        .map((p) => (
                          <li
                            key={String(p.dataKey)}
                            className="flex justify-between gap-3 tabular-nums"
                          >
                            <span className="text-body-color dark:text-body-color-dark">
                              {p.name}
                            </span>
                            <span className="font-medium text-black dark:text-white">
                              {typeof p.value === "number"
                                ? p.value.toLocaleString("es-CO", {
                                    maximumFractionDigits: 2,
                                  })
                                : p.value}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => (
                <span className="text-body-color dark:text-body-color-dark">
                  {value}
                </span>
              )}
            />
            {produccionChart.series.length > 0 ? (
              produccionChart.series.map((s, i) => (
                <Bar
                  key={s.dataKey}
                  yAxisId="left"
                  dataKey={s.dataKey}
                  name={s.name}
                  stackId="prod"
                  fill={
                    PRODUCCION_CHART_COLORS[i % PRODUCCION_CHART_COLORS.length]!
                  }
                  radius={
                    i === produccionChart.series.length - 1
                      ? [2, 2, 0, 0]
                      : [0, 0, 0, 0]
                  }
                />
              ))
            ) : (
              <Bar
                yAxisId="left"
                dataKey="totalSemana"
                name="Total semanal"
                fill="hsl(170, 55%, 42%)"
                radius={[4, 4, 0, 0]}
              />
            )}
            {mostrarAcumulado && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="acumulado"
                name="Acumulado (rango)"
                stroke="hsl(220, 60%, 45%)"
                strokeWidth={2}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {mostrarReferenciaMercado && (
        <div
          ref={mercadoPanelRef}
          className="mt-2 rounded-lg border border-stroke bg-gray-50/80 px-2.5 py-2 dark:border-strokedark dark:bg-white/[0.04]"
        >
          <p className="mb-2 text-[10px] leading-tight text-body-color dark:text-body-color-dark">
            Picos de demanda (referencia). Toca un nombre; cierra haciendo clic fuera. Oculta franjas
            y leyenda con &quot;Referencia mercado&quot; arriba.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MERCADO_FESTIVIDADES.map((f) => {
              const visible = intersectaRangoVisible(weekSlots, f);
              const accent = MERCADO_FESTIVIDAD_ACCENT[f.id] ?? "currentColor";
              const fillSoft = MERCADO_FESTIVIDAD_FILL[f.id] ?? "rgba(0,0,0,0.08)";
              const isOpen = festividadAbierta === f.id;
              return (
                <div key={f.id} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setFestividadAbierta((x) => (x === f.id ? null : f.id))
                    }
                    className="max-w-[10rem] truncate rounded-md border-l-[3px] px-2 py-1 text-left text-[10px] font-medium text-black transition hover:opacity-90 dark:text-white"
                    style={{
                      borderLeftColor: accent,
                      backgroundColor: fillSoft,
                    }}
                    aria-expanded={isOpen}
                  >
                    {f.nombre}
                  </button>
                  {isOpen && (
                    <div
                      className="absolute left-0 top-full z-30 mt-1 w-64 max-w-[min(90vw,16rem)] rounded-md border border-stroke bg-white p-2.5 text-[11px] shadow-lg dark:border-strokedark dark:bg-dark"
                      role="dialog"
                      aria-label={`Detalle ${f.nombre}`}
                    >
                      <p
                        className="font-semibold text-black dark:text-white"
                        style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 8 }}
                      >
                        {f.nombre}
                      </p>
                      <p className="mt-1 tabular-nums text-primary dark:text-primary-300">
                        ~{f.pesoPorcentual}% anual
                      </p>
                      <p className="mt-1.5 text-body-color dark:text-body-color-dark">
                        {f.notaLeyenda}
                      </p>
                      {!visible && (
                        <p className="mt-1.5 text-[10px] text-amber-800 dark:text-amber-300/90">
                          No cae en el rango de fechas actual.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
