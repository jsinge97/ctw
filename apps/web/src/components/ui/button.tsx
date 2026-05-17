import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ className, variant = "secondary", size = "md", ...props }: ButtonProps) {
  return <button className={cn("button", `button-${variant}`, `button-${size}`, className)} {...props} />;
}
