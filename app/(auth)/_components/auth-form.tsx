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
import { motion } from "framer-motion";

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

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function AuthForm({ mode, nextPath, message }: AuthFormProps) {
  const action = mode === "sign-in" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignUp = mode === "sign-up";
  useActionToast(state);

  return (
    <motion.div
      className="w-full max-w-md"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Link
        className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition hover:underline"
        style={{ color: 'var(--muted)' }}
        href="/"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to RallyLoop
      </Link>

      <motion.div
        className="auth-card p-6 sm:p-8"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        variants={itemVariants}
      >
        <div className="mb-6 flex items-center gap-3">
          <motion.span
            className="auth-brand-mark"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] as const }}
          >
            <CircleDot aria-hidden="true" className="size-6" strokeWidth={2.5} />
          </motion.span>
          <div>
            <p className="font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>RallyLoop</p>
            <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>
              Every game. One queue.
            </p>
          </div>
        </div>
        <motion.h1
          className="mt-3 text-3xl font-bold tracking-tight"
          style={{ color: 'var(--text)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] as const }}
        >
          {isSignUp ? "Join RallyLoop" : "Welcome back"}
        </motion.h1>
        <motion.p
          className="mt-2 text-sm leading-6"
          style={{ color: 'var(--muted)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }}
        >
          {isSignUp
            ? "Create your player account to get started."
            : "Sign in to continue to your player space."}
        </motion.p>

        {message ? (
          <motion.p
            className="mt-5 flex items-start gap-2 rounded-md border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--warning)', backgroundColor: 'var(--pill-warning-bg)', color: 'var(--pill-warning-ink)' }}
            role="status"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {message}
          </motion.p>
        ) : null}
        {state.error ? (
          <motion.p
            className="mt-5 flex items-start gap-2 rounded-md border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--negative)', backgroundColor: 'var(--pill-negative-bg)', color: 'var(--pill-negative-ink)' }}
            role="alert"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </motion.p>
        ) : null}
        {state.notice ? (
          <motion.p
            className="mt-5 flex items-start gap-2 rounded-md border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--positive)', backgroundColor: 'var(--pill-positive-bg)', color: 'var(--pill-positive-ink)' }}
            role="status"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {state.notice}
          </motion.p>
        ) : null}

        <form action={formAction} className="mt-6 space-y-5">
          <input name="next" type="hidden" value={nextPath} />

          {isSignUp ? (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
            >
              <Label className="inline-flex items-center gap-2" style={{ color: 'var(--text)' }} htmlFor="display_name">
                <UserRound aria-hidden="true" className="size-4" style={{ color: 'var(--accent-ink)' }} />
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
            </motion.div>
          ) : null}

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: isSignUp ? 0.3 : 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
          >
            <Label className="inline-flex items-center gap-2" style={{ color: 'var(--text)' }} htmlFor="email">
              <Mail aria-hidden="true" className="size-4" style={{ color: 'var(--accent-ink)' }} />
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
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: isSignUp ? 0.35 : 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
          >
            <Label className="inline-flex items-center gap-2" style={{ color: 'var(--text)' }} htmlFor="password">
              <LockKeyhole aria-hidden="true" className="size-4" style={{ color: 'var(--accent-ink)' }} />
              Password
            </Label>
            <Input
              autoComplete={isSignUp ? "new-password" : "current-password"}
              aria-describedby={isSignUp ? "password-help" : undefined}
              className="h-11"
              id="password"
              maxLength={128}
              minLength={8}
              name="password"
              required
              type="password"
            />
            {isSignUp ? (
              <p className="text-xs" style={{ color: 'var(--muted)' }} id="password-help">
                Use at least 8 characters.
              </p>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: isSignUp ? 0.4 : 0.35, ease: [0.25, 0.1, 0.25, 1] as const }}
          >
            <motion.div
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                className="auth-submit h-11 w-full rounded-md font-semibold text-white transition"
                style={{ backgroundColor: 'var(--accent)' }}
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
            </motion.div>
          </motion.div>
        </form>

        <motion.p
          className="mt-6 text-center text-sm"
          style={{ color: 'var(--muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] as const }}
        >
          {isSignUp ? "Already have an account?" : "New to RallyLoop?"}{" "}
          <Link
            className="inline-flex min-h-11 items-center font-bold underline-offset-4 hover:underline"
            style={{ color: 'var(--accent-ink)' }}
            href={
              isSignUp
                ? `/login?next=${encodeURIComponent(nextPath)}`
                : `/signup?next=${encodeURIComponent(nextPath)}`
            }
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
