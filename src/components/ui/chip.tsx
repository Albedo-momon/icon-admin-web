import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        active: "bg-status-active/20 text-status-active",
        inactive: "bg-status-inactive/20 text-status-inactive",
        free: "bg-status-free/20 text-status-free",
        busy: "bg-status-busy/20 text-status-busy",
        pending: "bg-status-pending/20 text-status-pending",
        approved: "bg-status-approved/20 text-status-approved",
        info: "bg-severity-info/20 text-severity-info",
        success: "bg-severity-success/20 text-severity-success",
        warning: "bg-severity-warning/20 text-severity-warning",
        error: "bg-severity-error/20 text-severity-error",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {}

function Chip({ className, variant, ...props }: ChipProps) {
  return (
    <div className={cn(chipVariants({ variant }), className)} {...props} />
  );
}

export { Chip, chipVariants };