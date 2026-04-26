"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSPASassClient } from "@/lib/supabase/client";

const inputClass =
  "w-full min-w-0 rounded-lg border border-gray-300 bg-white/80 px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

const selectClass = inputClass;

/** Two columns only from md — avoids cramped selects/labels on phones and small tablets. */
const fieldGrid = "grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 md:gap-y-4";

const fieldCell = "min-w-0";

const labelRow =
  "mb-1.5 flex min-w-0 flex-wrap items-baseline gap-x-1 text-sm font-medium text-gray-700 dark:text-gray-200";

function mapError(message: string): string {
  if (message.includes("User already registered"))
    return "Ya existe una cuenta con este correo. Intenta iniciar sesión.";
  if (message.includes("Password should be at least"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (message.includes("Invalid email")) return "Por favor ingresa un correo válido.";
  if (message.includes("Too many requests") || message.includes("rate limit"))
    return "Demasiados intentos. Por favor espera un momento.";
  return message;
}

const TIPO_OPTIONS = [
  { value: "CC", label: "Cédula de Ciudadanía (CC)" },
  { value: "NIT", label: "NIT" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "OTHER", label: "Otro" },
];

export default function ProveedorRegisterPage() {
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    tipo_identificacion: "CC",
    numero_identificacion: "",
    correo: "",
    numero_telefono: "",
    password: "",
    confirmPassword: "",
  });
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!terms) {
      setError("Debes aceptar los Términos de Servicio y la Política de Privacidad.");
      return;
    }

    setLoading(true);
    try {
      const client = createSPASassClient();
      const { error: signUpError } = await client.registerEmail(
        form.correo,
        form.password,
        {
          role: "proveedor",
          nombres: form.nombres,
          apellidos: form.apellidos,
          tipo_identificacion: form.tipo_identificacion,
          numero_identificacion: form.numero_identificacion,
          numero_telefono: form.numero_telefono,
        },
      );
      if (signUpError) throw signUpError;
      router.push("/auth/verify-email?back=/auth/proveedores/login");
    } catch (err) {
      if (err instanceof Error) {
        setError(mapError(err.message));
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-0 rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-50 to-white px-6 py-8 shadow-xl sm:px-10">
      <h1 className="mb-1 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
        Crear cuenta de proveedor
      </h1>
      <p className="mb-8 text-center text-sm text-body-color">
        Regístrate para acceder al portal de proveedores
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="min-w-0 space-y-5">
        {/* Nombres + Apellidos */}
        <div className={fieldGrid}>
          <div className={fieldCell}>
            <label htmlFor="nombres" className={labelRow}>
              <span>Nombres</span>
              <span className="shrink-0 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="nombres"
              type="text"
              required
              value={form.nombres}
              onChange={set("nombres")}
              placeholder="Ej: Juan Carlos"
              className={inputClass}
            />
          </div>
          <div className={fieldCell}>
            <label htmlFor="apellidos" className={labelRow}>
              <span>Apellidos</span>
              <span className="shrink-0 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="apellidos"
              type="text"
              required
              value={form.apellidos}
              onChange={set("apellidos")}
              placeholder="Ej: Pérez González"
              className={inputClass}
            />
          </div>
        </div>

        {/* Tipo + Número de identificación */}
        <div className={fieldGrid}>
          <div className={fieldCell}>
            <label htmlFor="tipo_identificacion" className={labelRow}>
              <span>Tipo de Identificación</span>
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
          <div className={fieldCell}>
            <label htmlFor="numero_identificacion" className={labelRow}>
              <span>Número de Identificación</span>
              <span className="shrink-0 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="numero_identificacion"
              type="text"
              required
              value={form.numero_identificacion}
              onChange={set("numero_identificacion")}
              placeholder="Ej: 1234567890"
              className={inputClass}
            />
          </div>
        </div>

        {/* Correo */}
        <div className={fieldCell}>
          <label htmlFor="correo" className={labelRow}>
            <span>Correo electrónico</span>
            <span className="shrink-0 text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="correo"
            type="email"
            autoComplete="email"
            required
            value={form.correo}
            onChange={set("correo")}
            placeholder="correo@ejemplo.com"
            className={inputClass}
          />
        </div>

        {/* Teléfono */}
        <div className={fieldCell}>
          <label htmlFor="numero_telefono" className={labelRow}>
            <span>Número de Teléfono</span>
          </label>
          <input
            id="numero_telefono"
            type="tel"
            value={form.numero_telefono}
            onChange={set("numero_telefono")}
            placeholder="+57 3001234567"
            className={inputClass}
          />
        </div>

        {/* Contraseña */}
        <div className={fieldCell}>
          <label htmlFor="password" className={labelRow}>
            <span>Contraseña</span>
            <span className="shrink-0 text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={set("password")}
            placeholder="Mínimo 6 caracteres"
            className={inputClass}
          />
        </div>

        {/* Confirmar contraseña */}
        <div className={fieldCell}>
          <label htmlFor="confirmPassword" className={labelRow}>
            <span>Confirmar contraseña</span>
            <span className="shrink-0 text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            placeholder="Repite tu contraseña"
            className={inputClass}
          />
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <input
            id="terms"
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="terms" className="text-sm text-body-color">
            Acepto los{" "}
            <Link href="/terminos" className="font-medium text-primary hover:underline">
              Términos de Servicio
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" className="font-medium text-primary hover:underline">
              Política de Privacidad
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-md"
        >
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-body-color">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/auth/proveedores/login"
          className="font-medium text-primary hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
