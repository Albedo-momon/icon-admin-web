import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Clock, User, CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  type?: "info" | "success" | "warning" | "error" | "default";
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
  icon?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  compact?: boolean;
  showTime?: boolean;
  showUser?: boolean;
  reverse?: boolean;
  focusedEventId?: string; // New prop for highlighting a specific event
}

const typeStyles = {
  default: {
    dot: "bg-muted-foreground",
    line: "bg-border",
    icon: Info,
    iconColor: "text-muted-foreground",
  },
  info: {
    dot: "bg-blue-500",
    line: "bg-blue-200 dark:bg-blue-900/30",
    icon: Info,
    iconColor: "text-blue-500",
  },
  success: {
    dot: "bg-green-500",
    line: "bg-green-200 dark:bg-green-900/30",
    icon: CheckCircle,
    iconColor: "text-green-500",
  },
  warning: {
    dot: "bg-yellow-500",
    line: "bg-yellow-200 dark:bg-yellow-900/30",
    icon: AlertCircle,
    iconColor: "text-yellow-500",
  },
  error: {
    dot: "bg-red-500",
    line: "bg-red-200 dark:bg-red-900/30",
    icon: XCircle,
    iconColor: "text-red-500",
  },
};

export const Timeline: React.FC<TimelineProps> = ({
  items,
  className,
  compact = false,
  showTime = true,
  showUser = true,
  reverse = false,
  focusedEventId, // Destructure new prop
}) => {
  const sortedItems = reverse ? [...items].reverse() : items;

  return (
    <div className={cn("relative", className)} role="region" aria-label="Timeline of events">
      {sortedItems.map((item, index) => {
        const isLast = index === sortedItems.length - 1;
        const style = typeStyles[item.type || "default"];
        const IconComponent = item.icon ? () => item.icon : style.icon;
        const isFocused = focusedEventId && item.id === focusedEventId; // Check if item is focused

        return (
          <div 
            key={item.id} 
            className={cn(
              "relative flex gap-4 pb-6 last:pb-0",
              isFocused && "rounded-md bg-yellow-100/20 dark:bg-yellow-900/10 p-2 -mx-2"
            )}
          >
            {/* Timeline Line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-4 top-8 w-0.5 h-full",
                  style.line
                )}
                aria-hidden="true"
              />
            )}

            {/* Timeline Dot/Icon */}
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 border-background",
                  style.dot
                )}
              >
                <IconComponent className={cn("h-4 w-4", style.iconColor)} />
              </div>
            </div>

            {/* Content */}
            <div className={cn("flex-1 min-w-0", compact ? "space-y-1" : "space-y-2")}>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "font-medium leading-tight",
                    compact ? "text-sm" : "text-base"
                  )} id={`timeline-item-${item.id}`}>
                    {item.title}
                  </h4>
                  
                  {/* User and Time */}
                  <div className="flex items-center gap-2 mt-1">
                    {showUser && item.user && (
                      <div className="flex items-center gap-1.5">
                        {item.user.avatar ? (
                          <img
                            src={item.user.avatar}
                            alt={item.user.name}
                            className="w-4 h-4 rounded-full"
                          />
                        ) : (
                          <User className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {item.user.name}
                        </span>
                      </div>
                    )}
                    
                    {showTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <time 
                          className="text-xs text-muted-foreground"
                          dateTime={item.timestamp.toISOString()}
                          aria-label={`Event occurred on ${item.timestamp.toLocaleDateString()}`}
                        >
                          {format(item.timestamp, "MMM dd, yyyy 'at' h:mm a")}
                        </time>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <p className={cn(
                  "text-muted-foreground leading-relaxed",
                  compact ? "text-xs" : "text-sm"
                )}>
                  {item.description}
                </p>
              )}

              {/* Metadata */}
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(item.metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                      </span>
                      <span className="font-medium">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Specialized timeline for status changes
export interface StatusTimelineItem {
  id: string;
  fromStatus?: string;
  toStatus: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
  };
  comment?: string;
  reason?: string;
}

export interface StatusTimelineProps {
  items: StatusTimelineItem[];
  className?: string;
  compact?: boolean;
  focusedEventId?: string; // New prop for highlighting a specific event
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  items,
  className,
  compact = false,
  focusedEventId, // Destructure new prop
}) => {
  const getStatusType = (status: string): TimelineItem["type"] => {
    const normalizedStatus = status.toLowerCase();
    
    if (["completed", "approved", "resolved"].includes(normalizedStatus)) {
      return "success";
    }
    
    if (["cancelled", "rejected", "failed"].includes(normalizedStatus)) {
      return "error";
    }
    
    if (["pending", "in_progress", "reviewing"].includes(normalizedStatus)) {
      return "warning";
    }
    
    return "info";
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const timelineItems: TimelineItem[] = items.map((item) => ({
    id: item.id,
    title: item.fromStatus 
      ? `Status changed from ${formatStatus(item.fromStatus)} to ${formatStatus(item.toStatus)}`
      : `Status set to ${formatStatus(item.toStatus)}`,
    description: item.comment || item.reason,
    timestamp: item.timestamp,
    type: getStatusType(item.toStatus),
    user: item.user,
    metadata: item.reason ? { reason: item.reason } : undefined,
  }));

  return (
    <Timeline
      items={timelineItems}
      className={className}
      compact={compact}
      showTime={true}
      showUser={true}
      focusedEventId={focusedEventId} // Pass focusedEventId to Timeline
    />
  );
};

// Simple activity timeline
export interface ActivityTimelineProps {
  activities: Array<{
    id: string;
    action: string;
    timestamp: Date;
    user?: string;
    details?: string;
  }>;
  className?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  className,
}) => {
  const timelineItems: TimelineItem[] = activities.map((activity) => ({
    id: activity.id,
    title: activity.action,
    description: activity.details,
    timestamp: activity.timestamp,
    type: "default",
    user: activity.user ? { name: activity.user } : undefined,
  }));

  return (
    <Timeline
      items={timelineItems}
      className={className}
      compact={true}
      showTime={true}
      showUser={true}
    />
  );
};