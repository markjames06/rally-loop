import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireFacilityRole } from "@/lib/auth/guards";
import { facilityRoles } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

type ManagementPageProps = {
  params: Promise<{ facilityId: string }>;
};

export default async function ManagementPage({
  params,
}: ManagementPageProps) {
  const { facilityId } = await params;
  const { user, role } = await requireFacilityRole(
    facilityId,
    facilityRoles,
    `/management/${facilityId}`,
  );

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex items-center justify-between border-b border-white/10 pb-6">
        <Link className="text-xl font-extrabold tracking-tight" href="/">
          Rally<span className="text-lime-300">Loop</span>
        </Link>
        <SignOutButton />
      </header>

      <section className="py-12">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-lime-300">
          Facility access verified
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Management access
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Your {role} membership for this facility was checked on the server.
        </p>
        <p className="mt-2 break-all font-mono text-xs text-slate-500">
          Facility ID: {facilityId}
        </p>
        <p className="mt-8 text-sm text-slate-300">
          Facility management tools will be added in a later phase.
        </p>
        <Link
          className="mt-6 inline-flex text-sm font-bold text-lime-300 hover:text-lime-200"
          href="/player"
        >
          Return to your player space
        </Link>
        <p className="mt-3 text-xs text-slate-500">
          Signed in as {user.email ?? "your account"}.
        </p>
      </section>
    </main>
  );
}
