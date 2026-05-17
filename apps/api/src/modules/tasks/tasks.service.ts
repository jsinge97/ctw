import type { TaskDto } from "@ctw/contracts";
import { messages, nextId, tasks } from "../demo-store.js";

export function listTasks(dealId: string): TaskDto[] {
  return tasks.filter((task) => task.dealId === dealId);
}

export function createTask(dealId: string, input: { title: string; description?: string; route?: TaskDto["route"] }): TaskDto {
  const task: TaskDto = { id: nextId("task", tasks.length), dealId, title: input.title, description: input.description ?? null, status: "proposed", route: input.route ?? "self", isCurrentNextAction: false, payload: {}, dueAt: null };
  tasks.push(task);
  return task;
}

export function decideTask(taskId: string, decision: "approve" | "reject" | "defer" | "route", input: { route?: TaskDto["route"]; editedTitle?: string } = {}): TaskDto {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) throw Object.assign(new Error("Task not found"), { statusCode: 404 });
  if (input.editedTitle) task.title = input.editedTitle;
  if (decision === "approve") {
    task.status = task.route === "system" ? "completed" : "approved";
    if (task.route === "system") {
      messages.push({ id: nextId("msg", messages.length), dealId: task.dealId, channelType: "email", direction: "outbound", subject: task.title, preview: "Sent approved System draft.", bodyText: String(task.payload["draft"] ?? "Approved draft sent."), occurredAt: new Date().toISOString(), visibility: "shared", routingConfidence: null });
    }
  }
  if (decision === "reject") task.status = "rejected";
  if (decision === "defer") task.status = "deferred";
  if (decision === "route" && input.route) task.route = input.route;
  return task;
}
