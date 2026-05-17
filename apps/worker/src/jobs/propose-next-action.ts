export function proposeNextAction(input: { dealId: string; sourceMessageSubject?: string }) {
  const title = input.sourceMessageSubject?.toLowerCase().includes("loi") ? "Send LOI response" : "Review latest inbound message";
  return { dealId: input.dealId, title, route: "system" as const, confidence: 0.84 };
}
