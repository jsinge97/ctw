export function generateSystemDraft(input: { dealTitle: string; taskTitle: string }) {
  return {
    subject: input.taskTitle,
    bodyText: `Hi,\n\nFollowing up on ${input.dealTitle}. ${input.taskTitle}.\n\nBest,\nCTW`,
    recipients: [] as string[]
  };
}
