"use client";

import { useState, useTransition } from "react";
import { completeProveedorProfile } from "./actions";

const inputClass =
  "w-full min-w-0 rounded-lg border border-gray-300 bg-white/80 px-4 py-3.5 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800/80 dark:text-white dark:hover:border-gray-500 dark:focus:border-primary";

const selectClass = inputClass;

const labelClass =
  "mb-1.5 flex items-baseline gap-x-1 text-sm font-medium text-gray-700 dark:text-gray-200";

const TIPO_OPTIONS = [
  { value: "CC", label: "Cédula de Ciudadanía (CC)" },
  { value: "NIT", label: "NIT" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "OTHER", label: "Otro" },
];

interface Props {
  initialNombres?: string;
  initialApellidos?: string;
}

export default function CompleteProfileForm({ initialNombres, initialApellidos }: Props) {
  const [form, setForm] = useState({
    nombres: initialNombres ?? "",
    apellidos: initialApellidos ?? "",
    tipo_identificacion: "CC",
    numero_identificacion: "",
    numero_telefono: "",
  });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { nombres, apellidos, tipo_identificacion, numero_identificacion, numero_telefono } =
      form;

    if (!nombres.trim() || !apellidos.trim()) {
      setError("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!numero_identificacion.trim()) {
      setError("Por favor ingresa tu número de identificación.");
      return;
    }
    if (!numero_telefono.trim()) {
      setError("Por favor ingresa tu número de teléfono.");
      return;
    }

    startTransition(async () => {
      const result = await completeProveedorProfile({
        nombres,
        apellidos,
        tipo_identificacion,
        numero_identificacion,
        numero_telefono,
      });
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-w-0 rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-50 to-white px-6 py-8 shadow-xl sm:px-10 dark:border-gray-700/60 dark:from-dark dark:to-dark">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-2xl dark:bg-primary-500/15">
            📋
          </span>
        </div>
        <h1 className="text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
          Completa tu perfil
        </h1>
        <p className="mt-2 text-center text-sm text-body-color dark:text-body-color-dark">
          Necesitamos algunos datos adicionales antes de que puedas acceder al portal de
          proveedores.
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-6 flex gap-3 rounded-lg border border-primary-100 bg-primary-50 p-4 dark:border-primary-500/20 dark:bg-primary-500/10">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm text-primary-700 dark:text-primary-300">
          Registraste tu cuenta con Google. Por favor completa tu información para continuar.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombres + Apellidos — stacked on mobile, side by side from md */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-x-4 md:gap-y-5">
          <div className="min-w-0">
            <label htmlFor="nombres" className={labelClass}>
              Nombres
              <span className="shrink-0 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="nombres"
              type="text"
              required
              autoComplete="given-name"
              value={form.nombres}
              onChange={set("nombres")}
              placeholder="Ej: Juan Carlos"
              className={inputClass}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="apellidos" className={labelClass}>
              Apellidos
              <span className="shrink-0 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="apellidos"
              type="text"
              required
              autoComplete="family-name"
              value={form.apellidos}
              onChange={set("apellidos")}
              placeholder="Ej: Pérez González"
              className={inputClass}
            />
          </div>
        </div>

        {/* Tipo + Número de identificación — stacked on mobile, side by side from md */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-x-4 md:gap-y-5">
          <div className="min-w-0">
            <label htmlFor="tipo_identificacion" className={labelClass}>
              Tipo de Identificación
              <span className="shrink-0 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <select
              id="tipo_identificacion"
              required
              value={form.tipo_identificacion}
              onChange={set("tipo_identificacion")}
              className={selectClass}
            >
              {TIPO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor="numero_identificacion" className={labelClass}>
              Número de Identificación
              <span className="shrink-0 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="numero_identificacion"
              type="text"
              required
              inputMode="numeric"
              value={form.numero_identificacion}
              onChange={set("numero_identificacion")}
              placeholder="Ej: 1234567890"
              className={inputClass}
            />
          </div>
        </div>

        {/* Teléfono — full width, mandatory */}
        <div className="min-w-0">
          <label htmlFor="numero_telefono" className={labelClass}>
            Número de Teléfono
            <span className="shrink-0 text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="numero_telefono"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            value={form.numero_telefono}
            onChange={set("numero_telefono")}
            placeholder="+57 3001234567"
            className={inputClass}
          />
        </div>

        {/* Required note */}
        <p className="text-xs text-body-color dark:text-body-color-dark">
          <span className="text-red-500">*</span> Campos obligatorios
        </p>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-md"
        >
          {isPending ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Guardando…
            </>
          ) : (
            "Guardar y continuar al portal"
          )}
        </button>
      </form>
    </div>
  );
}
