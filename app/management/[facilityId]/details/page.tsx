import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { FacilitySetup } from "@/components/facilities/facility-setup";
import { requireFacilityRole } from "@/server/auth/guards";
import { isValidTimezone } from "@/shared/facilities/validation";
import { createClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

type FacilityDetailsPageProps = {
  params: Promise<{ facilityId: string }>;
};

export default async function FacilityDetailsPage({ params }: FacilityDetailsPageProps) {
  const { facilityId } = await params;
  const { user, role } = await requireFacilityRole(
    facilityId,
    ["admin"],
    `/management/${facilityId}/details`,
  );
  const supabase = await createClient();
  const { data: facility, error } = await supabase
    .from("facilities")
    .select("id, name, slug, address, timezone")
    .eq("id", facilityId)
    .maybeSingle();

  if (error) console.error("Could not load facility details.", error.code);
  if (!facility && !error) notFound();

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
            <div><p>Facility workspace</p><h1>Facility details</h1><span>Keep the location and timezone used for session schedules up to date.</span></div>
          </header>
          {error || !facility ? (
            <p className="player-feedback player-feedback-error" role="alert">Facility details could not be loaded. Refresh the page to try again.</p>
          ) : (
            <FacilitySetup
              courts={[]}
              defaultStartValue=""
              editable
              facility={facility}
              section="details"
              sessionOperationsBaseHref={`/management/${facilityId}/sessions`}
              sessions={[]}
              sports={[]}
              timezoneValid={isValidTimezone(facility.timezone)}
            />
          )}
        </section>
      </main>
    </AppShell>
  );
}
