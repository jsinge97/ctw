import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";
import { Spinner } from "./spinner.js";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ children, className, disabled, isLoading = false, loadingLabel, variant = "secondary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn("button", `button-${variant}`, `button-${size}`, isLoading ? "button-loading" : null, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : null}
      {isLoading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
