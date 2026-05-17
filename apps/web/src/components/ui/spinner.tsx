import { cn } from "../../lib/cn.js";

export function Spinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return <span aria-hidden="true" className={cn("spinner", `spinner-${size}`, className)} />;
}
