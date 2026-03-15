"use client";

import { useState } from "react";
import Link from "next/link";
import { createSPASassClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white/80 px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

function mapError(message: string): string {
  if (message.includes("For security purposes"))
    return "Please wait before requesting another email.";
  if (message.includes("Email rate limit") || message.includes("Too many"))
    return "Too many requests. Please try again later.";
  if (message.includes("Invalid email")) return "Please enter a valid email address.";
  if (message.includes("User not found")) return "No account found with that email.";
  return message;
}

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const client = createSPASassClient();
      const { error } = await client.resendVerificationEmail(email);
      if (error) throw error;
      setSuccess(true);
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
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-black">Check your email</h1>
      <p className="mb-8 text-sm text-body-color">
        We sent you a verification link. Click it to activate your account.
        Check your spam folder if you don&apos;t see it.
      </p>

      <div className="text-left space-y-3">
        <p className="text-sm text-gray-600 text-center">
          Didn&apos;t receive it? Enter your email to resend:
        </p>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Verification email resent successfully.
          </div>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className={inputClass}
        />

        <button
          onClick={handleResend}
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending…" : "Resend verification email"}
        </button>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-6">
        <Link
          href="/auth/clientes/login"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
