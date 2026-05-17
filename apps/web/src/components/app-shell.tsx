import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, BriefcaseBusiness, Inbox, LogOut, Search, Settings, UserRoundCheck } from "lucide-react";
import type { CurrentSession } from "@ctw/contracts";
import { useLogout } from "../hooks/use-current-session.js";
import { settingsHomeForSession } from "../lib/api/adapters/session.js";
import { Badge } from "./ui/badge.js";

type AppShellProps = {
  session: CurrentSession | undefined;
  children: React.ReactNode;
};

const navItems = [
  { to: "/deals", label: "Deals", icon: BriefcaseBusiness, capability: "viewKanban" },
  { to: "/routing-review", label: "Routing review", icon: Inbox, capability: "viewRoutingReview" },
  { to: "/va", label: "VA queue", icon: UserRoundCheck, capability: "viewVaQueue" },
  { to: "/settings", label: "Settings", icon: Settings, capability: "viewSettingsUsers" }
] as const;

export function AppShell({ session, children }: AppShellProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const logout = useLogout();
  const capabilities = session?.capabilities ?? [];
  const visibleItems = navItems.filter((item) => item.to === "/settings" ? capabilities.includes("viewSettingsUsers") || capabilities.includes("viewSettingsOrganization") : capabilities.includes(item.capability));

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <div className="brand-lockup">
          <div className="brand-mark">C</div>
          <div>
            <strong>CTW 2.0</strong>
            <span>{session?.activeOrganization.name ?? "Northgate CRE"}</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link key={item.to} to={item.to === "/settings" ? settingsHomeForSession(session) : item.to} className={active || (item.to === "/settings" && pathname.startsWith("/settings")) ? "nav-item nav-item-active" : "nav-item"}>
                <Icon size={16} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rail-footer">
          <div className="user-chip">
            <span className="avatar">{session?.user.displayName.slice(0, 2).toUpperCase() ?? "MR"}</span>
            <div>
              <strong>{session?.user.displayName ?? "Maria Reyes"}</strong>
              <span>{session?.membership.role.toUpperCase() ?? "AM"}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-frame">
        <header className="top-bar">
          <div className="search-box">
            <Search size={16} aria-hidden />
            <span>Search deals, contacts, documents</span>
          </div>
          <div className="top-actions">
            {capabilities.includes("viewRoutingReview") ? <Badge tone="amber">3 messages to review</Badge> : null}
            <button className="icon-button" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <button className="icon-button" aria-label="Sign out" onClick={() => logout.mutate()}>
              <LogOut size={16} />
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
