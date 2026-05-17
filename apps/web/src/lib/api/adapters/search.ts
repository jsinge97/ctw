import { api } from "../runtime.js";

export type GlobalSearchResult = {
  href: string;
  id: string;
  label: string;
  secondaryLabel?: string;
  type: "deal" | "participant" | "document" | "message";
};

export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  const deals = await api.getDeals();
  return deals
    .filter((deal) => [deal.title, deal.primaryCompanyName, deal.nextActionLabel].filter(Boolean).some((value) => value?.toLowerCase().includes(normalized)))
    .slice(0, 8)
    .map((deal) => {
      const secondaryLabel = deal.primaryCompanyName ?? deal.nextActionLabel;
      return {
        href: `/deals/${encodeURIComponent(deal.id)}`,
        id: deal.id,
        label: deal.title,
        ...(secondaryLabel ? { secondaryLabel } : {}),
        type: "deal" as const
      };
    });
}
