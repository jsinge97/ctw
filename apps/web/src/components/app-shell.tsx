import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, BriefcaseBusiness, Inbox, LogOut, Search, Settings, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import type { CurrentSession } from "@ctw/contracts";
import { useAppSummary } from "../hooks/use-app-summary.js";
import { useGlobalSearch } from "../hooks/use-global-search.js";
import { useLogout } from "../hooks/use-current-session.js";
import { settingsHomeForSession } from "../lib/api/adapters/session.js";
import { Badge } from "./ui/badge.js";
import { Spinner } from "./ui/spinner.js";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [query, setQuery] = useState("");
  const capabilities = session?.capabilities ?? [];
  const visibleItems = navItems.filter((item) => item.to === "/settings" ? capabilities.includes("viewSettingsUsers") || capabilities.includes("viewSettingsOrganization") : capabilities.includes(item.capability));
  const search = useGlobalSearch(query, Boolean(session) && searchOpen);
  const summary = useAppSummary(Boolean(session));
  const notificationCount = (summary.data?.routingReviewCount ?? 0) + (summary.data?.pendingApprovalCount ?? 0) + (summary.data?.vaQueueCount ?? 0);

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
          <div className="search-shell">
          <label className="search-box">
            <Search size={16} aria-hidden />
            <input
              aria-label="Search deals, contacts, documents"
              placeholder="Search deals, contacts, documents"
              value={query}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
              }}
            />
            {search.isFetching ? <Spinner size="sm" /> : null}
          </label>
          {searchOpen && query.trim().length >= 2 ? (
            <div className="search-popover">
              {search.isError ? <p className="popover-empty">Search failed. Try again.</p> : null}
              {search.isPending || search.isFetching ? <p className="popover-empty">Searching...</p> : null}
              {search.data?.length === 0 ? <p className="popover-empty">No matches.</p> : null}
              {search.data?.map((result) => (
                <a className="popover-row" href={result.href} key={`${result.type}-${result.id}`}>
                  <strong>{result.label}</strong>
                  <span>{result.secondaryLabel ?? result.type}</span>
                </a>
              ))}
            </div>
          ) : null}
          </div>
          <div className="top-actions">
            {notificationCount > 0 ? <Badge tone="amber">{notificationLabel(summary.data)}</Badge> : null}
            <button className="icon-button" aria-label="Notifications" onClick={() => setNotificationOpen((current) => !current)}>
              {summary.isFetching ? <Spinner size="sm" /> : <Bell size={16} />}
            </button>
            {notificationOpen ? (
              <div className="notification-popover">
                {summary.data?.recentItems.length ? summary.data.recentItems.map((item) => (
                  <a className="popover-row" href={item.href} key={item.id}>
                    <strong>{item.label}</strong>
                    <span>{item.kind.replace("_", " ")}</span>
                  </a>
                )) : <p className="popover-empty">No notifications.</p>}
              </div>
            ) : null}
            <button className="icon-button" aria-label="Sign out" disabled={logout.isPending} onClick={() => logout.mutate()}>
              {logout.isPending ? <Spinner size="sm" /> : <LogOut size={16} />}
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function notificationLabel(summary: ReturnType<typeof useAppSummary>["data"]) {
  if (!summary) return "Checking queues";
  if (summary.routingReviewCount > 0) return `${summary.routingReviewCount} to route`;
  if (summary.pendingApprovalCount > 0) return `${summary.pendingApprovalCount} approvals`;
  return `${summary.vaQueueCount} VA items`;
}
