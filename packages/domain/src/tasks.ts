export const taskStatuses = ["proposed", "approved", "in_progress", "waiting_approval", "completed", "rejected", "deferred", "canceled"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskRoutes = ["system", "va", "self"] as const;
export type TaskRoute = (typeof taskRoutes)[number];

export type TaskLike = {
  status: TaskStatus;
  route: TaskRoute;
  isCurrentNextAction: boolean;
};

export function isTerminalTaskStatus(status: TaskStatus): boolean {
  return status === "completed" || status === "rejected" || status === "canceled";
}

export function canMarkCurrentNextAction(task: Pick<TaskLike, "status">): boolean {
  return !isTerminalTaskStatus(task.status) && task.status !== "deferred";
}

export function buildTaskOutcome(previous: TaskLike, next: TaskLike) {
  if (previous.route !== next.route) {
    return { outcome: "rerouted" as const, fromRoute: previous.route, toRoute: next.route };
  }
  if (next.status === "completed") return { outcome: "completed" as const };
  if (next.status === "rejected") return { outcome: "rejected" as const };
  if (next.status === "deferred") return { outcome: "deferred" as const };
  return { outcome: "edited" as const };
}
