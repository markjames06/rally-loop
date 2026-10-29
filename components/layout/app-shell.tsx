"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, CircleDot, LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import type { FacilityRole } from "@/shared/auth/roles";

type AppShellProps = {
  children: ReactNode;
  user?: { name?: string | null; email?: string | null } | null;
  managementHref?: string | null;
  facilityName?: string | null;
  managementRole?: FacilityRole | null;
};

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
};

export function AppShell({
  children,
  user = null,
  managementHref,
  facilityName,
  managementRole,
}: AppShellProps) {
  const pathname = usePathname();
  const isAdminContext = managementRole === "admin" && Boolean(managementHref);
  const isStaffContext = managementRole === "staff" && Boolean(managementHref);
  const facilityBase = managementHref ?? "/player";
  const navigation: NavItem[] = isAdminContext
    ? [
        { href: "/player", label: "My court", shortLabel: "Court", icon: LayoutDashboard },
        { href: facilityBase, label: "Facility", shortLabel: "Facility", icon: Building2 },
        { href: `${facilityBase}/sessions`, label: "Sessions", shortLabel: "Sessions", icon: CalendarDays },
        { href: `${facilityBase}/courts`, label: "Courts", shortLabel: "Courts", icon: CircleDot },
        { href: `${facilityBase}/details`, label: "Details", shortLabel: "Details", icon: Building2 },
      ]
    : isStaffContext
      ? [
          { href: "/player", label: "My court", shortLabel: "Court", icon: LayoutDashboard },
          { href: `${facilityBase}/sessions`, label: "Sessions", shortLabel: "Sessions", icon: CalendarDays },
          { href: "/sessions", label: "Open play", shortLabel: "Play", icon: CircleDot },
        ]
      : [
          ...(user
            ? [{ href: "/player", label: "My court", shortLabel: "Court", icon: LayoutDashboard }]
            : []),
          { href: "/sessions", label: "Open play", shortLabel: "Play", icon: CalendarDays },
          ...(managementHref
            ? [{
                href: managementHref,
                label: facilityName || "Facility",
                shortLabel: "Facility",
                icon: Building2,
              }]
            : []),
        ];
  const pageTitle = pathname.startsWith("/management")
    ? pathname.includes("/sessions/")
      ? "Session operations"
      : pathname.endsWith("/sessions")
        ? "Sessions"
        : pathname.endsWith("/courts")
          ? "Courts"
          : pathname.endsWith("/details")
            ? "Details"
            : facilityName || "Facility"
    : pathname.startsWith("/sessions/")
      ? "Session"
      : pathname === "/sessions"
        ? "Open play"
        : "My court";

  return (
    <div className={`app-shell${isAdminContext || isStaffContext ? " admin-management-shell" : ""}`}>
      <aside aria-label="Main navigation" className="app-sidebar">
        <Link aria-label="RallyLoop home" className="app-brand" href="/">
          <span className="app-brand-mark">
            <CircleDot aria-hidden="true" className="size-5" strokeWidth={2.5} />
          </span>
          <span>RallyLoop</span>
        </Link>
        <p className="app-nav-heading">{isAdminContext || isStaffContext ? "Facility" : "Play"}</p>
        <nav className="app-nav-list">
          {navigation.map(({ href, label, icon: Icon }) => {
            const targetPath = href.split("#")[0];
            const active =
              !href.includes("#") &&
              (pathname === targetPath ||
                (targetPath !== "/" &&
                  targetPath !== managementHref &&
                  pathname.startsWith(`${targetPath}/`)));
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`app-nav-link${active ? " is-active" : ""}`}
                href={href}
                key={`${href}-${label}`}
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
          {navigation.map(({ href, label, shortLabel, icon: Icon }) => {
            const targetPath = href.split("#")[0];
            const active =
              !href.includes("#") &&
              (pathname === targetPath ||
                (targetPath !== "/" &&
                  targetPath !== managementHref &&
                  pathname.startsWith(`${targetPath}/`)));
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`app-mobile-nav-link${active ? " is-active" : ""}`}
                href={href}
                key={`mobile-${href}-${label}`}
              >
                <Icon aria-hidden="true" className="size-[18px]" />
                <span>{shortLabel}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
