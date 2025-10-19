import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationItem as NotificationItemType, NotificationKind } from "@/stores/notificationsStore";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Icon mapping for notification kinds
const getNotificationIcon = (kind: NotificationKind): string => {
  const icons: Record<NotificationKind, string> = {
    NEW_BOOKING: "📋",
    AGENT_ACCEPTED: "✅", 
    ETA_CONFIRMED: "⏰",
    DIAGNOSIS_COMPLETED: "🔍",
    REPAIR_STARTED: "🔧",
    PC_BUILD_PHASE_CHANGE: "🖥️",
    CANCELLED: "❌",
    AGENT_CREATED: "👤",
    SYSTEM: "⚙️"
  };
  return icons[kind] || "📢";
};

// Severity color mapping
const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    info: "text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950",
    success: "text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950",
    warning: "text-yellow-600 border-yellow-200 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-950",
    error: "text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950"
  };
  return colors[severity] || colors.info;
};

const hrefByKind = (n: NotificationItemType) => {
  const id = encodeURIComponent(n.entityId || "");
  switch (n.kind) {
    case "NEW_BOOKING": return `/requests/${id}?tab=timeline&focus=raised`;
    case "AGENT_ACCEPTED": return `/requests/${id}?tab=timeline&focus=accepted`;
    case "ETA_CONFIRMED": return `/requests/${id}?tab=timeline&focus=eta_confirmed`;
    case "DIAGNOSIS_COMPLETED": return `/requests/${id}?tab=timeline&focus=diagnosis_completed`;
    case "REPAIR_STARTED": return `/requests/${id}?tab=timeline&focus=repair_in_progress`;
    case "PC_BUILD_PHASE_CHANGE": return `/requests/${id}?tab=timeline&focus=pc_build&phase=${n.meta?.phase||"build"}`;
    case "CANCELLED": return `/requests/${id}?tab=timeline&focus=cancelled`;
    case "AGENT_CREATED": return `/agents/${id}?tab=profile`;
    default: return `/notifications`;
  }
};

interface NotificationItemProps {
  item: NotificationItemType;
  isSelected?: boolean;
  showCheckbox?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onMarkRead?: (id: string) => void;
  onToggleRead?: (id: string) => void;
  onRemove?: (id: string) => void;
  onClick?: (item: NotificationItemType) => void;
  onCloseDrawer?: () => void; // New prop to close the drawer
  variant?: "drawer" | "page";
}

export function NotificationItem({
  item,
  isSelected = false,
  showCheckbox = false,
  onSelect,
  onMarkRead,
  onToggleRead,
  onRemove,
  onClick,
  onCloseDrawer, // Destructure new prop
  variant = "drawer"
}: NotificationItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!item.read && onMarkRead) {
      onMarkRead(item.id);
    }
    if (onCloseDrawer) {
      onCloseDrawer();
    }
    navigate(hrefByKind(item));

    if (onClick) {
      onClick(item);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(item.id, checked);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: variant === "page" ? -1 : 0 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer",
        item.read 
          ? "bg-background border-border" 
          : "bg-muted/30 border-border shadow-sm",
        variant === "drawer" && "hover:bg-muted/50",
        variant === "page" && "hover:shadow-sm"
      )}
      onClick={handleClick}
    >
      {showCheckbox && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="mt-1"
        />
      )}
      
      <div className={cn(
        "flex-shrink-0 mt-0.5",
        variant === "drawer" ? "text-lg" : "text-2xl"
      )}>
        {getNotificationIcon(item.kind)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className={cn(
            "font-medium truncate",
            variant === "drawer" ? "text-sm" : "text-base",
            item.read ? "text-muted-foreground" : "text-foreground"
          )}>
            {item.title}
          </h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
            </span>
            {variant === "drawer" && item.href && (
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            )}
            {!item.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>
        </div>
        
        {item.subtitle && (
          <p className={cn(
            "text-muted-foreground mb-2 line-clamp-2",
            variant === "drawer" ? "text-xs" : "text-sm"
          )}>
            {item.subtitle}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          {item.severity && (
            <Badge 
              variant="outline" 
              className={cn("text-xs", getSeverityColor(item.severity))}
            >
              {item.severity}
            </Badge>
          )}
          
          {variant === "page" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onToggleRead?.(item.id)}>
                  {item.read ? "Mark unread" : "Mark read"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRemove?.(item.id)}>
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {variant === "drawer" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onToggleRead?.(item.id)}>
                {item.read ? "Mark unread" : "Mark read"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRemove?.(item.id)}>
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
}