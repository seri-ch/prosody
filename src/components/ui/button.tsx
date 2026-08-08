import { cn } from "@/lib/utils";
import { forwardRef, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-accent hover:bg-accent-light text-white shadow-lg shadow-accent/25 hover:shadow-accent/40":
              variant === "primary",
            "bg-white/5 hover:bg-white/10 text-foreground border border-white/10":
              variant === "secondary",
            "hover:bg-white/5 text-muted hover:text-foreground": variant === "ghost",
            "bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30":
              variant === "danger",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-5 py-2.5 text-sm": size === "md",
            "px-8 py-3.5 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
