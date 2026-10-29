import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { FacilityHub } from "@/components/facilities/facility-hub";
import { requireFacilityRole } from "@/server/auth/guards";
import { createClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

type ManagementPageProps = {
  params: Promise<{ facilityId: string }>;
};

export default async function ManagementPage({ params }: ManagementPageProps) {
  const { facilityId } = await params;
  const { user, role } = await requireFacilityRole(
    facilityId,
    ["admin", "staff"],
    `/management/${facilityId}`,
  );
  if (role === "staff") {
    redirect(`/management/${facilityId}/sessions`);
  }

  const supabase = await createClient();
  const [facilityResult, sessionsResult, courtsResult] = await Promise.all([
    supabase
      .from("facilities")
      .select("id, name, address, timezone")
      .eq("id", facilityId)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("id, name, status, starts_at")
      .eq("facility_id", facilityId)
      .order("starts_at", { ascending: true }),
    supabase
      .from("courts")
      .select("id, status")
      .eq("facility_id", facilityId),
  ]);

  if (facilityResult.error) {
    console.error("Could not load facility overview.", facilityResult.error.code);
  }
  if (sessionsResult.error) {
    console.error("Could not load facility sessions.", sessionsResult.error.code);
  }
  if (courtsResult.error) {
    console.error("Could not load facility courts.", courtsResult.error.code);
  }
  if (!facilityResult.data && !facilityResult.error) {
    notFound();
  }

  return (
    <AppShell
      facilityName={facilityResult.data?.name}
      managementHref={`/management/${facilityId}`}
      managementRole={role}
      user={{ email: user.email }}
    >
      {facilityResult.data ? (
        <FacilityHub
          courts={courtsResult.data ?? []}
          facility={facilityResult.data}
          loadError={Boolean(sessionsResult.error || courtsResult.error)}
          sessions={sessionsResult.data ?? []}
        />
      ) : (
        <main className="app-page mx-auto min-h-screen max-w-7xl px-1 sm:px-4">
          <p className="player-feedback player-feedback-error mt-8" role="alert">
            Facility information could not be loaded. Refresh the page to try again.
          </p>
        </main>
      )}
    </AppShell>
  );
}
