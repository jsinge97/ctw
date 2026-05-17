import type { CreateTaskRequest, TaskDecisionRequest, TaskDto } from "@ctw/contracts";
import { Check, Clock, GitBranch, Plus, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { useUrlPanelState } from "./panel-search.js";
import type { TaskDecisionKind } from "../../lib/api/adapters/deals.js";

const statusOrder = ["in_progress", "waiting_approval", "proposed", "approved", "deferred", "completed", "rejected", "canceled"] as const;
const taskRoutes = ["self", "va", "system"] as const;

export function groupTasksByStatus(tasks: TaskDto[]) {
  return tasks.reduce<Record<string, TaskDto[]>>((groups, task) => {
    groups[task.status] = [...(groups[task.status] ?? []), task];
    return groups;
  }, {});
}

export function TasksTab({
  canApprove,
  canComplete,
  canCreate,
  canEdit,
  hasError,
  onCreateTask,
  onDecideTask,
  tasks
}: {
  canApprove: boolean;
  canComplete: boolean;
  canCreate: boolean;
  canEdit: boolean;
  hasError: boolean;
  onCreateTask: (body: CreateTaskRequest) => void;
  onDecideTask: (taskId: string, decision: TaskDecisionKind, body: TaskDecisionRequest) => void;
  tasks: TaskDto[];
}) {
  const [selectedId, setSelectedId] = useUrlPanelState("task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [route, setRoute] = useState<TaskDto["route"]>("self");
  const groupedTasks = useMemo(() => groupTasksByStatus(tasks), [tasks]);
  const currentNextAction = tasks.find((task) => task.isCurrentNextAction) ?? tasks.find((task) => task.status === "proposed") ?? null;
  const selectedTask = tasks.find((task) => task.id === selectedId) ?? currentNextAction ?? tasks[0] ?? null;

  return (
    <div className="crud-surface">
      <section className="crud-list" aria-label="Tasks">
        {currentNextAction ? (
          <button className="next-action-row" onClick={() => setSelectedId(currentNextAction.id)}>
            <Badge tone="blue">Current next action</Badge>
            <strong>{currentNextAction.title}</strong>
            <span>{currentNextAction.route} · {currentNextAction.status}</span>
          </button>
        ) : null}

        {canCreate ? (
          <form
            className="create-strip"
            onSubmit={(event) => {
              event.preventDefault();
              if (!title.trim()) return;
              onCreateTask({ title: title.trim(), description: description.trim() || undefined, route });
              setTitle("");
              setDescription("");
            }}
          >
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Create manual task" />
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional instructions" />
            <select value={route} onChange={(event) => setRoute(event.target.value as TaskDto["route"])}>
              {taskRoutes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Button type="submit">
              <Plus size={16} aria-hidden />
              Add
            </Button>
          </form>
        ) : null}

        {statusOrder.map((status) => {
          const items = groupedTasks[status] ?? [];
          if (items.length === 0) return null;
          return (
            <div className="document-group" key={status}>
              <h3>{status.replace("_", " ")}</h3>
              {items.map((task) => (
                <button className={task.id === selectedTask?.id ? "crud-row crud-row-active" : "crud-row"} key={task.id} onClick={() => setSelectedId(task.id)}>
                  <span className="crud-row-icon">
                    <Clock size={16} aria-hidden />
                  </span>
                  <span>
                    <strong>{task.title}</strong>
                    <span>{task.description ?? "No description"}</span>
                  </span>
                  <span className="crud-row-meta">
                    <Badge tone={task.route === "system" ? "purple" : task.route === "va" ? "blue" : "green"}>{task.route}</Badge>
                    <span>{task.dueAt ? formatDate(task.dueAt) : "No due date"}</span>
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </section>

      <aside className="crud-detail" aria-label="Task detail">
        {selectedTask ? (
          <TaskDecisionPanel
            canApprove={canApprove}
            canComplete={canComplete}
            canEdit={canEdit}
            task={selectedTask}
            onDecide={(decision, body) => onDecideTask(selectedTask.id, decision, body)}
          />
        ) : (
          <p>No tasks yet.</p>
        )}
        {hasError ? <p className="form-error">Task change failed.</p> : null}
      </aside>
    </div>
  );
}

function TaskDecisionPanel({
  canApprove,
  canComplete,
  canEdit,
  onDecide,
  task
}: {
  canApprove: boolean;
  canComplete: boolean;
  canEdit: boolean;
  onDecide: (decision: "approve" | "reject" | "defer" | "route" | "complete", body: { reason?: string; route?: TaskDto["route"]; editedTitle?: string }) => void;
  task: TaskDto;
}) {
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [reason, setReason] = useState("");
  const [route, setRoute] = useState<TaskDto["route"]>(task.route);

  return (
    <form className="detail-editor" onSubmit={(event) => event.preventDefault()}>
      <div className="detail-heading">
        <div>
          <h2>{task.title}</h2>
          <p>{task.route} · {task.status}</p>
        </div>
        {task.isCurrentNextAction ? <Badge tone="blue">Next action</Badge> : null}
      </div>
      {canEdit ? (
        <>
          <label>
            Edit title
            <input value={editedTitle} onChange={(event) => setEditedTitle(event.target.value)} />
          </label>
          <label>
            Reason
            <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Optional reason for history" />
          </label>
          <label>
            Route
            <select value={route} onChange={(event) => setRoute(event.target.value as TaskDto["route"])}>
              {taskRoutes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </>
      ) : null}
      {Object.keys(task.payload).length > 0 ? <pre className="payload-preview">{JSON.stringify(task.payload, null, 2)}</pre> : null}
      {canApprove || canComplete || canEdit ? (
        <div className="action-row">
          {task.route === "self" && canComplete ? (
            <Button type="button" variant="primary" onClick={() => onDecide("complete", { editedTitle, reason })}>
              <Check size={16} aria-hidden />
              Complete
            </Button>
          ) : null}
          {task.route !== "self" && canApprove ? (
            <Button type="button" variant="primary" onClick={() => onDecide("approve", { editedTitle, reason })}>
              <Check size={16} aria-hidden />
              Approve
            </Button>
          ) : null}
          {canEdit ? (
            <>
              <Button type="button" onClick={() => onDecide("defer", { editedTitle, reason })}>
                <RotateCcw size={16} aria-hidden />
                Defer
              </Button>
              <Button type="button" onClick={() => onDecide("route", { editedTitle, reason, route })}>
                <GitBranch size={16} aria-hidden />
                Route
              </Button>
              <Button type="button" variant="danger" onClick={() => onDecide("reject", { editedTitle, reason })}>
                <X size={16} aria-hidden />
                Reject
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
