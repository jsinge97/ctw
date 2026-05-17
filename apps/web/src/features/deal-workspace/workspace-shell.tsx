import type { ReactNode } from "react";
import type { CurrentSession } from "@ctw/contracts";
import { Link } from "@tanstack/react-router";
import { Check, Clock, FileText, Mail, MoreHorizontal, Users } from "lucide-react";
import { AppShell } from "../../components/app-shell.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import { useCurrentSession } from "../../hooks/use-current-session.js";
import { useDealWorkspace } from "../../hooks/use-deals.js";
import type { DealWorkspaceModel } from "../../lib/api/adapters/deals.js";

export type DealWorkspaceTab = "overview" | "messages" | "documents" | "tasks" | "participants" | "activity";

const tabLinks: Array<{ id: DealWorkspaceTab; label: string; to: string }> = [
  { id: "overview", label: "Overview", to: "/deals/$dealId" },
  { id: "messages", label: "Messages", to: "/deals/$dealId/messages" },
  { id: "documents", label: "Documents", to: "/deals/$dealId/documents" },
  { id: "tasks", label: "Tasks", to: "/deals/$dealId/tasks" },
  { id: "participants", label: "Participants", to: "/deals/$dealId/participants" },
  { id: "activity", label: "Activity", to: "/deals/$dealId/activity" }
];

export function DealWorkspaceShell({
  activeTab,
  children,
  dealId
}: {
  activeTab: DealWorkspaceTab;
  children: (workspace: DealWorkspaceModel, session: CurrentSession | undefined) => ReactNode;
  dealId: string;
}) {
  const session = useCurrentSession();
  const workspace = useDealWorkspace(dealId);

  return (
    <AppShell session={session.data}>
      {workspace.isPending ? <WorkspaceSkeleton /> : null}
      {workspace.isError ? <div className="error-panel">Could not load deal workspace.</div> : null}
      {workspace.data ? (
        <section className="workspace">
          <header className="workspace-header">
            <div>
              <h1>{workspace.data.deal.title}</h1>
              <p>{workspace.data.deal.primaryCompanyName ?? "No primary company"}</p>
            </div>
            <div className="stage-strip" aria-label="Deal stage">
              {["prospect", "loi", "negotiation", "diligence", "close", "closed_won", "lost"].map((stage) => (
                <span className={workspace.data.deal.stage === stage ? "stage-pill stage-pill-active" : "stage-pill"} key={stage}>
                  {stage.replace("_", " ")}
                </span>
              ))}
            </div>
          </header>

          <nav className="workspace-tabs" aria-label="Deal workspace tabs">
            {tabLinks.filter((tab) => canViewWorkspaceTab(tab.id, session.data)).map((tab) => (
              <Link className={tab.id === activeTab ? "workspace-tab workspace-tab-active" : "workspace-tab"} key={tab.id} to={tab.to} params={{ dealId }}>
                {tab.label}
              </Link>
            ))}
          </nav>

          {workspace.data.unavailable.length > 0 ? <p className="workspace-limited-note">Some internal deal data is hidden for your role.</p> : null}
          {children(workspace.data, session.data)}
        </section>
      ) : null}
    </AppShell>
  );
}

export function OverviewTab({ session, workspace }: { session: CurrentSession | undefined; workspace: DealWorkspaceModel }) {
  const canApprove = Boolean(session?.capabilities.includes("approveProposedAction"));
  const canEditTask = Boolean(session?.capabilities.includes("editTask"));
  return (
    <div className="workspace-grid">
      <article className="next-action-panel">
        <Badge tone="blue">System proposed</Badge>
        <h2>{workspace.deal.nextActionLabel ?? "No current next action"}</h2>
        <p>Review the current recommendation and approve only after checking recipients and payload.</p>
        {canApprove || canEditTask ? (
          <div className="action-row">
            {canApprove ? (
              <Button variant="primary">
                <Check size={16} aria-hidden />
                Approve
              </Button>
            ) : null}
            {canEditTask ? <Button>Edit</Button> : null}
            {canEditTask ? <Button>Defer</Button> : null}
            {canEditTask ? (
              <Button variant="ghost" aria-label="More actions">
                <MoreHorizontal size={16} />
              </Button>
            ) : null}
          </div>
        ) : null}
      </article>

      <aside className="workspace-summary">
        <SummaryMetric icon={<Mail size={16} />} label="Messages" value={workspace.messages.length} />
        <SummaryMetric icon={<FileText size={16} />} label="Documents" value={workspace.documents.length} />
        <SummaryMetric icon={<Clock size={16} />} label="Tasks" value={workspace.tasks.length} />
        <SummaryMetric icon={<Users size={16} />} label="Participants" value={workspace.participants.length} />
      </aside>

      <article className="workspace-panel">
        <h2>Recent activity</h2>
        <div className="activity-list">
          {workspace.activity.slice(0, 4).map((event) => (
            <div className="activity-row" key={event.id}>
              <strong>{event.action}</strong>
              <span>{event.summary}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="workspace-panel">
        <h2>Deal facts</h2>
        <div className="facts-grid">
          <span>Owner</span>
          <strong>{workspace.deal.ownerInitials}</strong>
          <span>Status</span>
          <strong>{workspace.deal.status}</strong>
          <span>Pending approvals</span>
          <strong>{workspace.deal.pendingApprovals}</strong>
        </div>
      </article>
    </div>
  );
}

export function canViewWorkspaceTab(tab: DealWorkspaceTab, session: CurrentSession | undefined) {
  if (tab === "overview" || tab === "participants") return Boolean(session?.capabilities.includes("viewDeal"));
  if (tab === "messages") return Boolean(session?.capabilities.includes("viewMessages"));
  if (tab === "documents") return Boolean(session?.capabilities.includes("viewDocuments"));
  if (tab === "tasks") return Boolean(session?.capabilities.includes("viewDeal"));
  if (tab === "activity") return Boolean(session?.capabilities.includes("viewActivity"));
  return false;
}

function SummaryMetric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="summary-metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <section className="workspace">
      <div className="page-header">
        <Skeleton className="skeleton-card" />
      </div>
    </section>
  );
}
