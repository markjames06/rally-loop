import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { isFacilityRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

type PlayerPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function PlayerPage({ searchParams }: PlayerPageProps) {
  const { user, supabase } = await requireAuthenticatedUser("/player");
  const { reason } = await searchParams;
  const [
    { data: profile, error: profileError },
    { data: memberships, error: membershipError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("facility_members")
      .select("facility_id, role")
      .eq("user_id", user.id),
  ]);

  if (profileError) {
    console.error("Could not load the current profile.", profileError.code);
  }
  if (membershipError) {
    console.error(
      "Could not load the current user's facility memberships.",
      membershipError.code,
    );
  }

  const visibleMemberships =
    memberships?.filter((membership) => isFacilityRole(membership.role)) ?? [];

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
          Player account
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {profile?.display_name
            ? `Good to see you, ${profile.display_name}.`
            : "Your RallyLoop account"}
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Signed in as {user.email ?? "your account"}.
        </p>

        {profileError || !profile ? (
          <p
            className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            We could not load your profile. Refresh the page or contact the
            facility administrator.
          </p>
        ) : null}
        {membershipError ? (
          <p
            className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            We could not check your facility access. Refresh the page to try
            again.
          </p>
        ) : null}
        {reason === "forbidden" ? (
          <p
            className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
            role="status"
          >
            You do not have staff or administrator access to that facility.
          </p>
        ) : null}
        {reason === "authorization" ? (
          <p
            className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            Facility access could not be verified. Please try again.
          </p>
        ) : null}
        {reason === "signout" ? (
          <p
            className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            Sign-out did not complete. Please try again.
          </p>
        ) : null}

        {visibleMemberships.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-white">Facility access</h2>
            <ul className="mt-4 space-y-3">
              {visibleMemberships.map(({ facility_id, role }) => (
                <li
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:flex-row sm:items-center"
                  key={facility_id}
                >
                  <span className="text-sm text-slate-300">
                    {role === "admin" ? "Administrator" : "Staff"} access
                  </span>
                  <Link
                    className="text-sm font-bold text-lime-300 hover:text-lime-200"
                    href={`/management/${facility_id}`}
                  >
                    Open management access
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  );
}
