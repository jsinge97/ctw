import { useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Check, Clock, FileText, Mail, MoreHorizontal, Users } from "lucide-react";
import { AppShell } from "../components/app-shell.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { Skeleton } from "../components/ui/skeleton.js";
import { useCurrentSession } from "../hooks/use-current-session.js";
import { useDealWorkspace } from "../hooks/use-deals.js";

const tabs = ["Overview", "Messages", "Documents", "Tasks", "Participants", "Activity"];

export function DealWorkspaceRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId" });
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
              {["prospect", "loi", "negotiation", "diligence", "close"].map((stage) => (
                <span className={workspace.data.deal.stage === stage ? "stage-pill stage-pill-active" : "stage-pill"} key={stage}>{stage}</span>
              ))}
            </div>
          </header>

          <nav className="workspace-tabs" aria-label="Deal workspace tabs">
            {tabs.map((tab) => (
              <button className={tab === "Overview" ? "workspace-tab workspace-tab-active" : "workspace-tab"} key={tab}>{tab}</button>
            ))}
          </nav>

          <div className="workspace-grid">
            <article className="next-action-panel">
              <Badge tone="blue">System proposed</Badge>
              <h2>{workspace.data.deal.nextActionLabel ?? "No current next action"}</h2>
              <p>Review the current recommendation and approve only after checking recipients and payload.</p>
              <div className="action-row">
                <Button variant="primary">
                  <Check size={16} aria-hidden />
                  Approve
                </Button>
                <Button>Edit</Button>
                <Button>Defer</Button>
                <Button variant="ghost" aria-label="More actions">
                  <MoreHorizontal size={16} />
                </Button>
              </div>
            </article>

            <aside className="workspace-summary">
              <SummaryMetric icon={<Mail size={16} />} label="Messages" value={workspace.data.messages.length} />
              <SummaryMetric icon={<FileText size={16} />} label="Documents" value={workspace.data.documents.length} />
              <SummaryMetric icon={<Clock size={16} />} label="Tasks" value={workspace.data.tasks.length} />
              <SummaryMetric icon={<Users size={16} />} label="Participants" value={workspace.data.participants.length} />
            </aside>

            <article className="workspace-panel">
              <h2>Recent activity</h2>
              <div className="activity-list">
                {workspace.data.activity.slice(0, 4).map((event) => (
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
                <strong>{workspace.data.deal.ownerInitials}</strong>
                <span>Status</span>
                <strong>{workspace.data.deal.status}</strong>
                <span>Pending approvals</span>
                <strong>{workspace.data.deal.pendingApprovals}</strong>
              </div>
            </article>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
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
