import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent gradient-primary text-primary-foreground shadow-sm hover:brightness-105",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/90",
        outline: "border-border text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        success:
          "border-transparent bg-priority-green/15 text-priority-green",
        warning:
          "border-transparent bg-priority-yellow/15 text-priority-yellow",
        danger: "border-transparent bg-priority-red/15 text-priority-red",
        triageRed:
          "border-transparent bg-priority-red/12 text-priority-red",
        triageYellow:
          "border-transparent bg-priority-yellow/15 text-priority-yellow",
        triageGreen:
          "border-transparent bg-priority-green/15 text-priority-green",
        triageBlack:
          "border-transparent bg-priority-black/12 text-priority-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
export { Badge, badgeVariants };
