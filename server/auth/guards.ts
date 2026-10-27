import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import type { FacilityRole } from "@/shared/auth/roles";
import { createClient } from "@/server/supabase/server";
import { hasEnvVars } from "@/shared/lib/utils";

export async function requireAuthenticatedUser(nextPath = "/player") {
  if (!hasEnvVars) {
    redirect("/login?reason=setup");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Could not verify the current user.", error.code);
    redirect(`/login?reason=verification&next=${encodeURIComponent(nextPath)}`);
  }

  if (!data.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return { supabase, user: data.user };
}

export async function requireFacilityRole(
  facilityId: string,
  allowedRoles: readonly FacilityRole[],
  nextPath: string,
): Promise<{ user: User; role: FacilityRole }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(facilityId)) {
    redirect("/player?reason=forbidden");
  }

  const { supabase, user } = await requireAuthenticatedUser(nextPath);
  const { data, error } = await supabase
    .from("facility_members")
    .select("role")
    .eq("facility_id", facilityId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Could not verify facility membership.", error.code);
    redirect("/player?reason=authorization");
  }

  if (!data || !allowedRoles.includes(data.role)) {
    redirect("/player?reason=forbidden");
  }

  return { user, role: data.role };
}
