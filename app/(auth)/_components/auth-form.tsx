"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  signInAction,
  signUpAction,
  type AuthActionState,
} from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  nextPath: string;
  message?: string;
};

const initialState: AuthActionState = {};

export function AuthForm({ mode, nextPath, message }: AuthFormProps) {
  const action = mode === "sign-in" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignUp = mode === "sign-up";

  return (
    <div className="w-full max-w-md">
      <Link
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
        href="/"
      >
        <span aria-hidden="true">←</span> Back to RallyLoop
      </Link>

      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-lime-300">
          Every Game. One Queue.
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
          {isSignUp ? "Join RallyLoop" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isSignUp
            ? "Create your player account to get started."
            : "Sign in to continue to your player space."}
        </p>

        {message ? (
          <p
            className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
            role="status"
          >
            {message}
          </p>
        ) : null}
        {state.error ? (
          <p
            className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        {state.notice ? (
          <p
            className="mt-5 rounded-xl border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-sm text-lime-100"
            role="status"
          >
            {state.notice}
          </p>
        ) : null}

        <form action={formAction} className="mt-6 space-y-5">
          <input name="next" type="hidden" value={nextPath} />

          {isSignUp ? (
            <div className="space-y-2">
              <Label className="text-slate-200" htmlFor="display_name">
                Display name
              </Label>
              <Input
                autoComplete="nickname"
                className="h-11 border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500"
                id="display_name"
                maxLength={80}
                minLength={2}
                name="display_name"
                placeholder="How should we call you?"
                required
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label className="text-slate-200" htmlFor="email">
              Email
            </Label>
            <Input
              autoComplete="email"
              className="h-11 border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200" htmlFor="password">
              Password
            </Label>
            <Input
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="h-11 border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500"
              id="password"
              maxLength={128}
              minLength={8}
              name="password"
              required
              type="password"
            />
            {isSignUp ? (
              <p className="text-xs text-slate-500">
                Use at least 8 characters.
              </p>
            ) : null}
          </div>

          <Button
            className="h-11 w-full rounded-full bg-lime-300 font-bold text-slate-950 hover:bg-lime-200"
            disabled={pending}
            type="submit"
          >
            {pending
              ? "Please wait..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isSignUp ? "Already have an account?" : "New to RallyLoop?"}{" "}
          <Link
            className="font-bold text-lime-300 hover:text-lime-200"
            href={
              isSignUp
                ? `/login?next=${encodeURIComponent(nextPath)}`
                : `/signup?next=${encodeURIComponent(nextPath)}`
            }
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
