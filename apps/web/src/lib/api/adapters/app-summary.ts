import { api } from "../runtime.js";

export type AppSummaryItem = {
  href: string;
  id: string;
  kind: "routing_review" | "approval" | "va_work";
  label: string;
};

export type AppSummary = {
  pendingApprovalCount: number;
  recentItems: AppSummaryItem[];
  routingReviewCount: number;
  vaQueueCount: number;
};

export async function getAppSummary(): Promise<AppSummary> {
  const [deals, routingReviewItems, vaWorkItems] = await Promise.all([
    api.getDeals().catch(() => []),
    api.getRoutingReviewItems().catch(() => []),
    api.getVaWorkItems().catch(() => [])
  ]);
  const openRouting = routingReviewItems.filter((item) => item.status === "open");
  const activeVa = vaWorkItems.filter((item) => ["queued", "in_progress", "submitted", "sent_back", "blocked"].includes(item.status));
  const pendingApprovalCount = deals.reduce((count, deal) => count + deal.pendingApprovals, 0);

  return {
    pendingApprovalCount,
    recentItems: [
      ...openRouting.slice(0, 3).map((item) => ({
        href: `/routing-review?item=${encodeURIComponent(item.id)}`,
        id: item.id,
        kind: "routing_review" as const,
        label: item.subject ?? item.preview
      })),
      ...activeVa.slice(0, 3).map((item) => ({
        href: `/va?work=${encodeURIComponent(item.id)}`,
        id: item.id,
        kind: "va_work" as const,
        label: item.title
      }))
    ].slice(0, 5),
    routingReviewCount: openRouting.length,
    vaQueueCount: activeVa.length
  };
}
