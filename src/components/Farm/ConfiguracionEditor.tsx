"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSPASassClient } from "@/lib/supabase/client";
import {
  type ConfigVar,
  CONFIG_FIELDS,
  upsertConfigBatch,
} from "@/lib/farm/configuracion";

interface ConfiguracionEditorProps {
  initial: ConfigVar[];
}

type Banner = { kind: "success" | "error"; text: string } | null;
type FormValues = Record<string, string>;

function buildForm(rows: ConfigVar[]): FormValues {
  const map: FormValues = {};
  for (const f of CONFIG_FIELDS) {
    const existing = rows.find((r) => r.variable === f.variable);
    map[f.variable] = existing?.valor ?? f.default;
  }
  return map;
}

const inputCls =
  "w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-dark dark:text-white dark:focus:ring-primary/15";

export default function ConfiguracionEditor({
  initial,
}: ConfiguracionEditorProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [form, setForm] = useState<FormValues>(buildForm(initial));
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  function showBanner(b: Banner) {
    setBanner(b);
    if (b) setTimeout(() => setBanner(null), 3500);
  }

  function setField(variable: string, value: string) {
    setForm((prev) => ({ ...prev, [variable]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Basic validation — all fields must be valid numbers
    for (const f of CONFIG_FIELDS) {
      const val = form[f.variable] ?? "";
      if (val === "" || isNaN(Number(val)) || Number(val) < 0) {
        showBanner({
          kind: "error",
          text: `"${f.label}" debe ser un número válido mayor o igual a cero.`,
        });
        return;
      }
    }

    setSaving(true);
    try {
      const client = createSPASassClient().getSupabaseClient();
      await upsertConfigBatch(
        client,
        CONFIG_FIELDS.map((f) => ({
          variable: f.variable,
          valor: form[f.variable],
          descripcion: f.descripcion,
        })),
      );
      showBanner({ kind: "success", text: "Configuración guardada correctamente." });
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

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark">
          {/* Header row */}
          <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
            <p className="text-xs font-bold uppercase tracking-widest text-primary dark:text-primary-400">
              Parámetros económicos
            </p>
            <p className="mt-0.5 text-xs text-body-color dark:text-body-color-dark">
              Estos valores se usan para calcular costos de mano de obra e
              insumos en todos los cultivos.
            </p>
          </div>

          {/* Fields */}
          <div className="divide-y divide-stroke dark:divide-strokedark">
            {CONFIG_FIELDS.map((f) => (
              <div
                key={f.variable}
                className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 sm:max-w-sm">
                  <label
                    htmlFor={`cfg-${f.variable}`}
                    className="block text-sm font-medium text-black dark:text-white"
                  >
                    {f.label}
                  </label>
                  <p className="mt-0.5 text-xs text-body-color dark:text-body-color-dark">
                    {f.descripcion}
                  </p>
                </div>

                <div className="w-full sm:w-48">
                  <input
                    id={`cfg-${f.variable}`}
                    type="number"
                    min={0}
                    step={f.type === "integer" ? 1 : "any"}
                    value={form[f.variable] ?? ""}
                    onChange={(e) => setField(f.variable, e.target.value)}
                    placeholder={f.placeholder}
                    className={`${inputCls} tabular-nums`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer / save */}
          <div className="flex items-center justify-between border-t border-stroke px-6 py-4 dark:border-strokedark">
            <p className="text-xs text-body-color/60 dark:text-body-color-dark/60">
              Los cambios aplican a todos los cálculos del portal.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
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
              Guardar cambios
            </button>
          </div>
        </div>
      </form>

      {/* Derived values preview */}
      <DerivedPreview form={form} />
    </div>
  );
}

function DerivedPreview({ form }: { form: FormValues }) {
  const jornal = Number(form["JORNAL_DIA"]) || 0;
  const horas = Number(form["HORAS_JORNAL"]) || 0;
  const tasa = Number(form["TASA_CAMBIO"]) || 0;

  const costoHora = horas > 0 ? Math.round(jornal / horas) : null;
  const costoMinuto =
    horas > 0 ? Math.round((jornal / horas / 60) * 100) / 100 : null;
  const jornalUsd = tasa > 0 ? Math.round((jornal / tasa) * 100) / 100 : null;

  return (
    <div className="rounded-xl border border-stroke bg-white p-5 dark:border-strokedark dark:bg-dark">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-body-color dark:text-body-color-dark">
        Valores derivados (solo lectura)
      </p>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DerivedItem
          label="Costo por hora"
          value={costoHora != null ? `$${costoHora.toLocaleString("es-CO")} COP` : "—"}
        />
        <DerivedItem
          label="Costo por minuto"
          value={costoMinuto != null ? `$${costoMinuto.toLocaleString("es-CO")} COP` : "—"}
        />
        <DerivedItem
          label="Jornal en USD"
          value={jornalUsd != null ? `$${jornalUsd} USD` : "—"}
        />
      </dl>
    </div>
  );
}

function DerivedItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-body-color/70 dark:text-body-color-dark/60">
        {label}
      </dt>
      <dd className="mt-0.5 text-base font-semibold tabular-nums text-black dark:text-white">
        {value}
      </dd>
    </div>
  );
}
