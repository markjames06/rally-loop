import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import {
  isPublishableSupabaseKey,
  isValidSupabaseProjectUrl,
} from "@/lib/auth/roles";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasEnvVars = Boolean(
  isValidSupabaseProjectUrl(supabaseUrl) &&
    isPublishableSupabaseKey(publishableKey),
);
