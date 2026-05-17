import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "blue" | "green" | "amber" | "red" | "purple";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={cn("badge", `badge-${tone}`, className)} {...props} />;
}
