"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSPASassClient } from "@/lib/supabase/client";
import GoogleSignInButton from "@/components/Auth/GoogleSignInButton";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white/80 px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

function mapError(message: string): string {
  if (message.includes("Invalid login credentials"))
    return "Correo o contraseña incorrectos. Inténtalo de nuevo.";
  if (message.includes("Email not confirmed"))
    return "Por favor verifica tu correo electrónico antes de iniciar sesión.";
  if (message.includes("Too many requests") || message.includes("rate limit"))
    return "Demasiados intentos. Por favor espera un momento.";
  if (message.includes("Invalid email")) return "Por favor ingresa un correo válido.";
  if (message.includes("For security purposes"))
    return "Por seguridad, espera un momento antes de intentar de nuevo.";
  return message;
}

export default function ProveedorLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const client = createSPASassClient();
      const { error: signInError } = await client.loginEmail(email, password);
      if (signInError) throw signInError;
      router.push("/proveedor-portal");
      router.refresh();
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
    <div className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-50 to-white px-6 py-8 shadow-xl sm:px-10">
      <h1 className="mb-1 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
        Portal Proveedor
      </h1>
      <p className="mb-8 text-center text-sm text-body-color">
        Inicia sesión para acceder a tu portal
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <GoogleSignInButton
        redirectPath="/proveedor-portal"
        label="Continuar con Google"
      />

      <div className="relative my-5 flex items-center">
        <div className="flex-grow border-t border-gray-200" />
        <span className="mx-3 flex-shrink text-xs text-body-color">o</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            className={inputClass}
          />
        </div>

        <div className="flex items-center justify-end">
          <Link
            href="/auth/forgot-password?back=/auth/proveedores/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-md"
        >
          {loading ? "Iniciando sesión…" : "Iniciar sesión"}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-200" />
          <span className="mx-3 flex-shrink text-xs text-body-color">
            ¿Nuevo proveedor?
          </span>
          <div className="flex-grow border-t border-gray-200" />
        </div>
        <Link
          href="/auth/proveedores/register"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:border-primary hover:bg-primary-100 hover:-translate-y-0.5 hover:shadow-md dark:bg-primary-500/10 dark:text-primary-300 dark:border-primary-500/30 dark:hover:bg-primary-500/20"
        >
          Crear cuenta de proveedor
        </Link>
      </div>

      <p className="mt-5 text-center text-sm text-body-color">
        ¿Quieres ser proveedor?{" "}
        <Link
          href="/proveedores#registro-proveedor"
          className="font-medium text-primary hover:underline"
        >
          Contáctanos
        </Link>
      </p>
    </div>
  );
}
