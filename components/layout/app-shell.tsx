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

  const userInitial = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();
  const roleLabel = isAdminContext
    ? "Administrator"
    : isStaffContext
      ? "Staff"
      : "Player";

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside aria-label="Main navigation" className="app-sidebar">
        {/* Brand */}
        <div className="px-2 pt-1 pb-4">
          <Link aria-label="RallyLoop home" className="app-brand" href="/">
            <span className="app-brand-mark">
              <CircleDot aria-hidden="true" className="size-5" strokeWidth={2.5} />
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight">RallyLoop</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>Every Game. One Queue.</span>
            </div>
          </Link>
          {facilityName ? (
            <div className="mt-3 mx-2 flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)', color: 'var(--muted)' }}>
              <Building2 aria-hidden="true" className="size-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="truncate font-medium">{facilityName}</span>
            </div>
          ) : null}
        </div>

        {/* Navigation list */}
        <div className="px-2">
          <p className="app-nav-heading">
            {isAdminContext || isStaffContext ? "Facility Management" : "Court Navigation"}
          </p>
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
                  className={`app-nav-link ${active ? "is-active" : ""}`}
                  href={href}
                  key={`${href}-${label}`}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-4.5 shrink-0"
                  />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="app-sidebar-bottom">
          {user ? (
            <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full font-bold text-xs" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-ink)' }}>
                  {userInitial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold" style={{ color: 'var(--text)' }}>
                    {user.name || user.email}
                  </p>
                  <span className="inline-block rounded px-1.5 py-0.2 text-[10px] font-medium" style={{ backgroundColor: 'var(--pill-accent-bg)', color: 'var(--pill-accent-ink)' }}>
                    {roleLabel}
                  </span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--rule)' }}>
                <SignOutButton />
              </div>
            </div>
          ) : (
            <Link
              className="flex items-center justify-center rounded-md px-3 py-2 text-xs font-semibold text-white transition"
              style={{ backgroundColor: 'var(--accent)' }}
              href="/login"
            >
              Sign in to play
            </Link>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="app-workspace flex flex-col">
        {/* Sticky Topbar */}
        <header className="app-topbar">
          {/* Mobile brand & title */}
          <div className="app-mobile-brand flex items-center gap-2.5">
            <Link aria-label="RallyLoop home" className="flex items-center gap-2" href="/">
              <span className="flex size-7 items-center justify-center rounded-md" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                <CircleDot aria-hidden="true" className="size-4" strokeWidth={2.5} />
              </span>
              <span className="font-bold tracking-tight text-sm" style={{ color: 'var(--text)' }}>RallyLoop</span>
            </Link>
            <span style={{ color: 'var(--control)' }}>/</span>
            <span className="app-mobile-title text-xs font-semibold truncate max-w-[120px]">
              {pageTitle}
            </span>
          </div>

          {/* Desktop breadcrumb context */}
          <div className="app-topbar-context hidden sm:flex items-center gap-2 text-xs font-medium">
            <span>{facilityName ? facilityName : "Community Play"}</span>
            <span style={{ color: 'var(--control)' }}>/</span>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>{pageTitle}</span>
          </div>

          {/* Right account controls */}
          <div className="app-account flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="app-account-name hidden sm:inline-block max-w-[180px] truncate text-xs font-medium">
                  {user.name || user.email}
                </span>
                <div className="sm:hidden">
                  <SignOutButton />
                </div>
              </div>
            ) : (
              <Link
                className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                style={{ backgroundColor: 'var(--accent)' }}
                href="/login"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        {/* Content canvas */}
        <div className="app-shell-content flex-1">{children}</div>

        {/* Mobile Bottom Navigation */}
        <nav
          aria-label="Mobile navigation"
          className="app-mobile-nav"
        >
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
                className={`app-mobile-nav-link ${active ? "is-active" : ""}`}
                href={href}
                key={`mobile-${href}-${label}`}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span className="truncate">{shortLabel}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
