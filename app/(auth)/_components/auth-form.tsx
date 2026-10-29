"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  CircleDot,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useActionState } from "react";

import {
  signInAction,
  signUpAction,
  type AuthActionState,
} from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionToast } from "@/components/ui/toast";

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
  useActionToast(state);

  return (
    <div className="w-full max-w-md">
      <Link
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
        href="/"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to RallyLoop
      </Link>

      <div className="auth-card p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="auth-brand-mark">
            <CircleDot aria-hidden="true" className="size-6" strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-extrabold tracking-tight text-white">RallyLoop</p>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              Every game. One queue.
            </p>
          </div>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
          {isSignUp ? "Join RallyLoop" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isSignUp
            ? "Create your player account to get started."
            : "Sign in to continue to your player space."}
        </p>

        {message ? (
          <p
            className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
            role="status"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {message}
          </p>
        ) : null}
        {state.error ? (
          <p
            className="mt-5 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        ) : null}
        {state.notice ? (
          <p
            className="mt-5 flex items-start gap-2 rounded-xl border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-sm text-lime-100"
            role="status"
          >
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {state.notice}
          </p>
        ) : null}

        <form action={formAction} className="mt-6 space-y-5">
          <input name="next" type="hidden" value={nextPath} />

          {isSignUp ? (
            <div className="space-y-2">
              <Label className="inline-flex items-center gap-2 text-slate-200" htmlFor="display_name">
                <UserRound aria-hidden="true" className="size-4 text-[#52732f]" />
                Display name
              </Label>
              <Input
                autoComplete="nickname"
                className="h-11"
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
            <Label className="inline-flex items-center gap-2 text-slate-200" htmlFor="email">
              <Mail aria-hidden="true" className="size-4 text-[#52732f]" />
              Email
            </Label>
            <Input
              autoComplete="email"
              className="h-11"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-center gap-2 text-slate-200" htmlFor="password">
              <LockKeyhole aria-hidden="true" className="size-4 text-[#52732f]" />
              Password
            </Label>
            <Input
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="h-11"
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
            className="auth-submit h-11 w-full rounded-md font-semibold"
            disabled={pending}
            type="submit"
          >
            {pending
              ? "Please wait..."
              : isSignUp
                ? (
                  <>
                    Create account
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </>
                )
                : (
                  <>
                    Sign in
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </>
                )}
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
