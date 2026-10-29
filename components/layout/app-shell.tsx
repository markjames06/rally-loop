"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, CircleDot, LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";

type AppShellProps = {
  children: ReactNode;
  user?: { name?: string | null; email?: string | null } | null;
  managementHref?: string | null;
  facilityName?: string | null;
};

const primaryNavigation = [
  { href: "/player", label: "My space", icon: LayoutDashboard, signedIn: true },
  { href: "/sessions", label: "Open sessions", icon: CalendarDays, signedIn: false },
] as const;

export function AppShell({
  children,
  user = null,
  managementHref,
  facilityName,
}: AppShellProps) {
  const pathname = usePathname();
  const navigation = [
    ...primaryNavigation.filter((item) => !item.signedIn || user),
    ...(managementHref
      ? [{ href: managementHref, label: facilityName || "Facility", icon: Building2 }]
      : []),
  ];
  const pageTitle = pathname.startsWith("/management")
    ? facilityName || "Facility management"
    : pathname.startsWith("/sessions/")
      ? "Session details"
      : pathname === "/sessions"
        ? "Open sessions"
        : "My space";

  return (
    <div className="app-shell">
      <aside aria-label="Main navigation" className="app-sidebar">
        <Link aria-label="RallyLoop home" className="app-brand" href="/">
          <span className="app-brand-mark">
            <CircleDot aria-hidden="true" className="size-5" strokeWidth={2.5} />
          </span>
          <span>RallyLoop</span>
        </Link>
        <p className="app-nav-heading">Your court</p>
        <nav className="app-nav-list">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`app-nav-link${active ? " is-active" : ""}`}
                href={href}
                key={href}
              >
                <Icon aria-hidden="true" className="size-[18px]" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="app-sidebar-bottom">
          <p>Every game. One queue.</p>
        </div>
      </aside>

      <div className="app-workspace">
        <header className="app-topbar">
          <div className="app-mobile-brand">
            <Link aria-label="RallyLoop home" className="app-brand" href="/">
              <span className="app-brand-mark">
                <CircleDot aria-hidden="true" className="size-5" strokeWidth={2.5} />
              </span>
              <span>RallyLoop</span>
            </Link>
            <span className="app-mobile-title">{pageTitle}</span>
          </div>
          <div className="app-topbar-context">
            {facilityName ? <span>{facilityName}</span> : <span>Community play</span>}
          </div>
          <div className="app-account">
            {user ? (
              <>
                <span className="app-account-name">{user.name || user.email}</span>
                <SignOutButton />
              </>
            ) : (
              <Link className="app-signin-link" href="/login">Sign in</Link>
            )}
          </div>
        </header>

        <div className="app-shell-content">{children}</div>

        <nav aria-label="Mobile navigation" className="app-mobile-nav">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`app-mobile-nav-link${active ? " is-active" : ""}`}
                href={href}
                key={href}
              >
                <Icon aria-hidden="true" className="size-[18px]" />
                <span>{label === "Open sessions" ? "Sessions" : label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
