export const dealStages = ["prospect", "loi", "negotiation", "diligence", "close", "closed_won", "lost"] as const;
export type DealStage = (typeof dealStages)[number];

const stageOrder = new Map<DealStage, number>(dealStages.map((stage, index) => [stage, index]));

export function isTerminalDealStage(stage: DealStage): boolean {
  return stage === "closed_won" || stage === "lost";
}

export function canTransitionDealStage(from: DealStage, to: DealStage): boolean {
  if (from === to) return true;
  if (isTerminalDealStage(from)) return false;
  if (to === "lost") return true;
  const fromIndex = stageOrder.get(from) ?? 0;
  const toIndex = stageOrder.get(to) ?? 0;
  return Math.abs(toIndex - fromIndex) <= 2;
}

export function transitionReason(from: DealStage, to: DealStage): string | null {
  if (canTransitionDealStage(from, to)) return null;
  if (isTerminalDealStage(from)) return "Closed or lost deals cannot move stages without reopening.";
  return "Stage jumps are limited to nearby workflow stages.";
}
