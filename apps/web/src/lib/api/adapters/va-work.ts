import type { SendBackVaWorkRequest, VaWorkDecisionRequest, VaWorkItemDto } from "@ctw/contracts";
import { api } from "../runtime.js";

export async function listVaWorkItems(): Promise<VaWorkItemDto[]> {
  return api.getVaWorkItems();
}

export type VaWorkDecisionKind = "start" | "accept" | "submit" | "send-back" | "cancel";

export async function decideVaWorkItem(itemId: string, decision: VaWorkDecisionKind, body: SendBackVaWorkRequest | VaWorkDecisionRequest): Promise<VaWorkItemDto> {
  if (decision === "start") return api.postVaWorkItemsitemIdStart({ itemId }, body);
  if (decision === "accept") return api.postVaWorkItemsitemIdAccept({ itemId }, body);
  if (decision === "submit") return api.postVaWorkItemsitemIdSubmit({ itemId }, body);
  if (decision === "send-back") return api.postVaWorkItemsitemIdSendBack({ itemId }, body as SendBackVaWorkRequest);
  return api.postVaWorkItemsitemIdCancel({ itemId }, body);
}
