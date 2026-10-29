import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { FacilitySetup } from "@/components/facilities/facility-setup";
import { requireFacilityRole } from "@/server/auth/guards";
import { isValidTimezone } from "@/shared/facilities/validation";
import { createClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

type CourtsPageProps = {
  params: Promise<{ facilityId: string }>;
};

export default async function FacilityCourtsPage({ params }: CourtsPageProps) {
  const { facilityId } = await params;
  const { user, role } = await requireFacilityRole(
    facilityId,
    ["admin"],
    `/management/${facilityId}/courts`,
  );
  const supabase = await createClient();
  const [facilityResult, sportsResult, courtsResult] = await Promise.all([
    supabase.from("facilities").select("id, name, slug, address, timezone").eq("id", facilityId).maybeSingle(),
    supabase.from("sports").select("id, name, slug").eq("is_active", true).order("name"),
    supabase.from("courts").select("id, facility_id, name, sport_id, status").eq("facility_id", facilityId).order("name"),
  ]);

  if (facilityResult.error) console.error("Could not load facility details.", facilityResult.error.code);
  if (sportsResult.error) console.error("Could not load active sports.", sportsResult.error.code);
  if (courtsResult.error) console.error("Could not load facility courts.", courtsResult.error.code);
  if (!facilityResult.data && !facilityResult.error) notFound();
  const facility = facilityResult.data;
  const failed = Boolean(facilityResult.error || sportsResult.error || courtsResult.error);

  return (
    <AppShell
      facilityName={facility?.name}
      managementHref={`/management/${facilityId}`}
      managementRole={role}
      user={{ email: user.email }}
    >
      <main className="app-page management-page mx-auto min-h-screen max-w-7xl px-1 sm:px-4">
        <section className="management-route-page">
          <Link className="management-back-link" href={`/management/${facilityId}`}><ArrowLeft aria-hidden="true" className="size-4" /> Facility overview</Link>
          <header className="management-route-heading">
            <div><p>Facility workspace</p><h1>Courts</h1><span>Set court names, sport compatibility, and availability.</span></div>
            <span className="management-route-count">{courtsResult.data?.length ?? 0} configured</span>
          </header>
          {failed || !facility ? (
            <p className="player-feedback player-feedback-error" role="alert">Facility courts could not be loaded. Refresh the page to try again.</p>
          ) : (
            <FacilitySetup
              courts={courtsResult.data ?? []}
              defaultStartValue=""
              editable
              facility={facility}
              section="courts"
              sessionOperationsBaseHref={`/management/${facilityId}/sessions`}
              sessions={[]}
              sports={sportsResult.data ?? []}
              timezoneValid={isValidTimezone(facility.timezone)}
            />
          )}
        </section>
      </main>
    </AppShell>
  );
}
