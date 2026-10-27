import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { isAllowedRedirectPath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

function isSupportedOtpType(value: string | null): value is EmailOtpType {
  return value === "signup" || value === "email";
}

export async function GET(request: NextRequest) {
  if (!hasEnvVars) {
    return NextResponse.redirect(new URL("/login?reason=setup", request.url));
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const otpType = request.nextUrl.searchParams.get("type");
  const nextPath = isAllowedRedirectPath(
    request.nextUrl.searchParams.get("next"),
    "/player",
  );

  if (!tokenHash || !isSupportedOtpType(otpType)) {
    return NextResponse.redirect(
      new URL("/login?reason=confirmation", request.url),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: otpType,
  });

  if (error) {
    console.error("Email confirmation failed.", error.code);
    return NextResponse.redirect(
      new URL("/login?reason=confirmation", request.url),
    );
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
