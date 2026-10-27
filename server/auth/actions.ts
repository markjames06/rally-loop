"use server";

import { redirect } from "next/navigation";

import {
  isAllowedRedirectPath,
  validateCredentials,
  validateDisplayName,
} from "@/shared/auth/roles";
import { createClient } from "@/server/supabase/server";
import { hasEnvVars } from "@/shared/lib/utils";

export type AuthActionState = {
  error?: string;
  notice?: string;
};

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getSiteUrl(): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    if (!URL.canParse(configuredUrl)) {
      return null;
    }

    const url = new URL(configuredUrl);
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return null;
    }

    return url.origin;
  }

  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

function configuredActionError(): AuthActionState | null {
  if (!hasEnvVars) {
    return {
      error:
        "Authentication is not configured yet. Add the Supabase URL and publishable key to your local environment.",
    };
  }

  return null;
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getFormValue(formData, "email").trim();
  const password = getFormValue(formData, "password");
  const validationError = validateCredentials(email, password);

  if (validationError) {
    return { error: validationError };
  }

  const setupError = configuredActionError();
  if (setupError) {
    return setupError;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Sign-in failed.", error.code);
    return { error: "We could not sign you in with those details." };
  }

  redirect(isAllowedRedirectPath(getFormValue(formData, "next"), "/player"));
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const displayName = getFormValue(formData, "display_name").trim();
  const email = getFormValue(formData, "email").trim();
  const password = getFormValue(formData, "password");
  const displayNameError = validateDisplayName(displayName);
  const credentialsError = validateCredentials(email, password);

  if (displayNameError || credentialsError) {
    return { error: displayNameError ?? credentialsError ?? "Check your details." };
  }

  const setupError = configuredActionError();
  if (setupError) {
    return setupError;
  }

  const nextPath = isAllowedRedirectPath(
    getFormValue(formData, "next"),
    "/player",
  );
  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    return {
      error:
        "Set NEXT_PUBLIC_SITE_URL to an HTTPS address (localhost is allowed for development).",
    };
  }

  const confirmationUrl = new URL("/auth/confirm", siteUrl);
  confirmationUrl.searchParams.set("next", nextPath);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: confirmationUrl.toString(),
    },
  });

  if (error) {
    console.error("Sign-up failed.", error.code);
    return {
      error:
        "We could not create your account. Check your details or try again later.",
    };
  }

  if (!data.session) {
    return {
      notice:
        "Your account was created. Check your email for the confirmation link before signing in.",
    };
  }

  redirect(nextPath);
}

export async function signOutAction(): Promise<void> {
  if (hasEnvVars) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign-out failed.", error.code);
      redirect("/player?reason=signout");
    }
  }

  redirect("/");
}
