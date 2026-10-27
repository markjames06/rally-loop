import type { Metadata } from "next";

import { AuthForm } from "../_components/auth-form";
import { getAuthMessage } from "../_components/auth-message";
import { isAllowedRedirectPath } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Sign in | RallyLoop",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, reason } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <AuthForm
        message={getAuthMessage(reason)}
        mode="sign-in"
        nextPath={isAllowedRedirectPath(next ?? null, "/player")}
      />
    </main>
  );
}
