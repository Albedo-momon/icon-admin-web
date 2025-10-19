import React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onRemove?: () => void;
  className?: string;
}

const chipVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  success: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30",
  warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
};

const chipSizes = {
  sm: "h-6 px-2 text-xs",
  md: "h-7 px-3 text-sm", 
  lg: "h-8 px-4 text-sm",
};

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ children, variant = "default", size = "md", selected = false, onRemove, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
          chipVariants[variant],
          chipSizes[size],
          selected && "ring-2 ring-ring",
          className
        )}
        role="button"
        aria-pressed={selected}
        {...props}
      >
        <span className="truncate">{children}</span>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1 rounded-full hover:bg-background/20 p-0.5"
            aria-label="Remove filter"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </button>
    );
  }
);

Chip.displayName = "Chip";

export { Chip };
export interface StatusChipProps {
  status: string;
  size?: ChipProps["size"];
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = "md", className }) => {
  const getStatusVariant = (status: string): ChipProps["variant"] => {
    const normalizedStatus = status.toLowerCase();
    
    if (["completed", "approved", "active", "online"].includes(normalizedStatus)) {
      return "success";
    }
    
    if (["pending", "in_progress", "processing", "reviewing"].includes(normalizedStatus)) {
      return "warning";
    }
    
    if (["cancelled", "rejected", "failed", "offline", "inactive"].includes(normalizedStatus)) {
      return "destructive";
    }
    
    if (["draft", "paused", "on_hold"].includes(normalizedStatus)) {
      return "secondary";
    }
    
    return "default";
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Chip variant={getStatusVariant(status)} size={size} className={className}>
      {formatStatus(status)}
    </Chip>
  );
};

// Priority chip for displaying priority levels
export interface PriorityChipProps {
  priority: "low" | "medium" | "high" | "urgent";
  size?: ChipProps["size"];
  className?: string;
}

export const PriorityChip: React.FC<PriorityChipProps> = ({ priority, size = "md", className }) => {
  const getPriorityVariant = (priority: string): ChipProps["variant"] => {
    switch (priority.toLowerCase()) {
      case "urgent":
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  };

  return (
    <Chip variant={getPriorityVariant(priority)} size={size} className={className}>
      {formatPriority(priority)}
    </Chip>
  );
};

// Chip group for displaying multiple chips
export interface ChipGroupProps {
  children: React.ReactNode;
  className?: string;
  wrap?: boolean;
  label?: string;
}

export const ChipGroup: React.FC<ChipGroupProps> = ({ 
  children, 
  className, 
  wrap = true,
  label,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-1",
        wrap ? "flex-wrap" : "overflow-x-auto",
        className
      )}
      role="group"
      aria-label={label}
      {...props}
    >
      {children}
    </div>
  );
};