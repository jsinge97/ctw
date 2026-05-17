import type { VaWorkItemDto } from "@ctw/contracts";
import { vaWorkItems } from "../demo-store.js";

export function listVaWork(): VaWorkItemDto[] {
  return vaWorkItems;
}

export function submitVaWork(itemId: string): VaWorkItemDto {
  const item = vaWorkItems.find((work) => work.id === itemId);
  if (!item) throw Object.assign(new Error("VA item not found"), { statusCode: 404 });
  item.status = "submitted";
  return item;
}

export function sendBackVaWork(itemId: string): VaWorkItemDto {
  const item = vaWorkItems.find((work) => work.id === itemId);
  if (!item) throw Object.assign(new Error("VA item not found"), { statusCode: 404 });
  item.status = "sent_back";
  return item;
}
