import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";
import { cn } from "../../lib/cn.js";

// Adapted from janhesters/shadcn-kanban-board's registry component.
// The upstream component uses native DataTransfer drag/drop; this local version
// keeps that contract while mapping class names to this app's non-Tailwind CSS.
type KanbanMonitor = {
  activeId: string | null;
  announce: (message: string) => void;
  setActiveId: (id: string | null) => void;
};

const KanbanContext = createContext<KanbanMonitor | null>(null);
const cardTransferType = "application/x-ctw-kanban-card";

export type KanbanCardData = {
  id: string;
  [key: string]: unknown;
};

export function KanbanBoardProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const value = useMemo(() => ({ activeId, announce: setAnnouncement, setActiveId }), [activeId]);
  return (
    <KanbanContext.Provider value={value}>
      <div className="kanban-sr-instructions" id="kanban-drag-instructions">
        To pick up a draggable item, drag it to a column. Drop it to move, or leave the board to cancel.
      </div>
      <div aria-live="assertive" aria-atomic="true" className="kanban-live-region" role="status">
        {announcement}
      </div>
      {children}
    </KanbanContext.Provider>
  );
}

export function KanbanBoard({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("kanban-board", className)} aria-label={props["aria-label"] ?? "Kanban board"} {...props} />;
}

export function KanbanColumn({
  canDrop = true,
  children,
  className,
  columnId,
  invalidReason,
  onDropOverColumn,
  ...props
}: ComponentProps<"article"> & {
  canDrop?: boolean;
  columnId: string;
  invalidReason?: string | null;
  onDropOverColumn?: (data: KanbanCardData, columnId: string) => void;
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const context = useContext(KanbanContext);
  return (
    <article
      className={cn("kanban-column", isDropTarget && canDrop && "kanban-column-drop", isDropTarget && !canDrop && "kanban-column-invalid", className)}
      onDragLeave={() => setIsDropTarget(false)}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(cardTransferType)) return;
        event.preventDefault();
        setIsDropTarget(true);
        event.dataTransfer.dropEffect = canDrop ? "move" : "none";
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDropTarget(false);
        const data = parseKanbanCardData(event.dataTransfer.getData(cardTransferType));
        if (!data || !canDrop) return;
        context?.announce(`Draggable item ${data.id} was dropped over ${columnId}.`);
        onDropOverColumn?.(data, columnId);
      }}
      {...props}
    >
      {children}
      {invalidReason ? <p className="kanban-invalid">{invalidReason}</p> : null}
    </article>
  );
}

export function parseKanbanCardData(rawData: string): KanbanCardData | null {
  if (!rawData) return null;
  try {
    const value = JSON.parse(rawData) as Partial<KanbanCardData>;
    return typeof value.id === "string" ? (value as KanbanCardData) : null;
  } catch {
    return null;
  }
}

export function KanbanColumnHeader(props: ComponentProps<"header">) {
  return <header {...props} />;
}

export function KanbanColumnTitle({ columnId, ...props }: ComponentProps<"span"> & { columnId: string }) {
  return <span id={`column-${columnId}-title`} {...props} />;
}

export function KanbanColumnList(props: ComponentProps<"div">) {
  return <div className={cn("kanban-card-list", props.className)} {...props} />;
}

export function KanbanCard({
  className,
  data,
  disabled = false,
  onDragEnd,
  onDragStart,
  onKanbanDragEnd,
  onKanbanDragStart,
  ...props
}: ComponentProps<"button"> & {
  data: KanbanCardData;
  disabled?: boolean;
  onKanbanDragEnd?: () => void;
  onKanbanDragStart?: () => void;
}) {
  const context = useContext(KanbanContext);
  const dragging = context?.activeId === data.id;
  return (
    <button
      aria-describedby="kanban-drag-instructions"
      aria-roledescription="draggable"
      className={cn("deal-card", dragging && "deal-card-dragging", className)}
      draggable={!disabled}
      onDragEnd={(event) => {
        context?.setActiveId(null);
        onKanbanDragEnd?.();
        onDragEnd?.(event);
      }}
      onDragStart={(event) => {
        if (disabled) return;
        context?.setActiveId(data.id);
        context?.announce(`Picked up draggable item ${data.id}.`);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(cardTransferType, JSON.stringify(data));
        onKanbanDragStart?.();
        onDragStart?.(event);
      }}
      type="button"
      {...props}
    />
  );
}
