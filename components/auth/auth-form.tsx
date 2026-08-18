"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle, LockKeyhole, LogIn, UserPlus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/lib/auth/validation";

interface AuthFormProps {
  mode: "login" | "register";
}

function responseError(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return null;
  }
  return typeof value.error === "string" ? value.error : null;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        // The status fallback below handles a non-JSON response.
      }

      if (!response.ok) {
        throw new Error(
          responseError(body) ??
            (isRegister ? "Registration failed." : "Login failed.")
        );
      }

      window.location.assign("/");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong. Please try again."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_35%)]"
      />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
            <Zap className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            MetricMind
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            {isRegister
              ? "Register with a username and start exploring the BI demo."
              : "Sign in to continue to your metric workspace."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-xs font-semibold text-zinc-700"
            >
              Username
            </label>
            <Input
              id="username"
              name="username"
              value={username}
              minLength={USERNAME_MIN_LENGTH}
              maxLength={USERNAME_MAX_LENGTH}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              placeholder="your_username"
              className="h-11"
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-zinc-700"
            >
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              placeholder="••••••••"
              className="h-11"
              onChange={(event) => setPassword(event.target.value)}
            />
            {isRegister && (
              <p className="text-[11px] text-zinc-400">
                Use 8–128 characters with at least one letter and one number.
              </p>
            )}
          </div>

          {isRegister && (
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-xs font-semibold text-zinc-700"
              >
                Confirm password
              </label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="h-11"
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-zinc-950 text-white hover:bg-zinc-800"
          >
            {isSubmitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : isRegister ? (
              <UserPlus className="h-4 w-4" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {isSubmitting
              ? isRegister
                ? "Creating account…"
                : "Signing in…"
              : isRegister
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          {isRegister ? "Already registered?" : "New to MetricMind?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
          >
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>

        <div className="mt-6 flex items-start gap-2 rounded-xl bg-zinc-50 px-3 py-3 text-[11px] leading-relaxed text-zinc-500">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
          Passwords are stored as salted hashes. This local account system is for
          development; use a managed database/auth provider before deployment.
        </div>
      </section>
    </main>
  );
}
