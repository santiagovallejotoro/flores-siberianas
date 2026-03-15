"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSPASassClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white/80 px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

function mapError(message: string): string {
  if (message.includes("Password should be at least"))
    return "Password must be at least 6 characters.";
  if (message.includes("same as the old password"))
    return "New password must be different from your current password.";
  if (message.includes("Session not found") || message.includes("invalid"))
    return "Reset link is invalid or has expired. Please request a new one.";
  if (message.includes("rate limit"))
    return "Too many attempts. Please try again later.";
  return message;
}

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifySession = async () => {
      try {
        const client = createSPASassClient();
        const {
          data: { user },
          error,
        } = await client.getSupabaseClient().auth.getUser();
        if (error || !user) {
          setError(
            "Reset link is invalid or has expired. Please request a new one.",
          );
        }
      } catch {
        setError("Could not verify reset session.");
      }
    };
    verifySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const client = createSPASassClient();
      const { error } = await client
        .getSupabaseClient()
        .auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push("/client-portal"), 2500);
    } catch (err) {
      if (err instanceof Error) {
        setError(mapError(err.message));
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-gray-200/60 bg-white px-6 py-10 shadow-lg sm:px-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-black">Password updated</h2>
        <p className="text-sm text-body-color">
          Your password has been reset. Redirecting to your portal…
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white px-6 py-8 shadow-lg sm:px-10">
      <h1 className="mb-1 text-center text-2xl font-bold text-black sm:text-3xl">
        Create new password
      </h1>
      <p className="mb-8 text-center text-sm text-body-color">
        Enter and confirm your new password below.
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="new-password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            New password
          </label>
          <input
            id="new-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Confirm password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your new password"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-md"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
