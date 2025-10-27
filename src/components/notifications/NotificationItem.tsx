import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, FileText, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Chip } from "@/components/ui/chip";
import type { NotificationItem as NotificationItemType, NotificationKind } from "@/stores/notificationsStore";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Icon mapping for notification kinds
const iconMap = {
  NEW_BOOKING: FileText,
  AGENT_ACCEPTED: CheckCircle,
  ETA_CONFIRMED: Clock,
  DIAGNOSIS_COMPLETED: CheckCircle,
  REPAIR_STARTED: CheckCircle,
  PC_BUILD_PHASE_CHANGE: FileText,
  CANCELLED: FileText,
  AGENT_CREATED: CheckCircle,
  SYSTEM: Clock,
};

const getNotificationIcon = (kind: NotificationKind) => {
  return iconMap[kind] || FileText;
};

const hrefByKind = (n: NotificationItemType) => {
  const id = encodeURIComponent(n.id || "");
  switch (n.kind) {
    case "NEW_BOOKING": return `/requests/${id}?tab=timeline&focus=raised`;
    case "AGENT_ACCEPTED": return `/requests/${id}?tab=timeline&focus=accepted`;
    case "ETA_CONFIRMED": return `/requests/${id}?tab=timeline&focus=eta_confirmed`;
    case "DIAGNOSIS_COMPLETED": return `/requests/${id}?tab=timeline&focus=diagnosis_completed`;
    case "REPAIR_STARTED": return `/requests/${id}?tab=timeline&focus=repair_in_progress`;
    case "PC_BUILD_PHASE_CHANGE": return `/requests/${id}?tab=timeline&focus=pc_build&phase=build`;
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
  const Icon = getNotificationIcon(item.kind);

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
        "bg-card border border-card-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30 cursor-pointer",
        !item.read && "border-primary/50 bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        {showCheckbox && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
        )}

        {/* Left: Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            item.severity === "error" && "bg-destructive/10",
            item.severity === "warning" && "bg-warning/10", 
            item.severity === "success" && "bg-success/10",
            (!item.severity || item.severity === "info") && "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              item.severity === "error" && "text-destructive",
              item.severity === "warning" && "text-warning",
              item.severity === "success" && "text-success", 
              (!item.severity || item.severity === "info") && "text-primary"
            )} />
          </div>
        </div>

        {/* Center: Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              {item.title}
            </h3>
            {item.subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {item.subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {item.severity && (
              <Chip variant={item.severity as any}>{item.severity}</Chip>
            )}
          </div>
        </div>

        {/* Right: Time + Actions */}
        <div className="flex items-start gap-2 flex-shrink-0">
          {!item.read && (
            <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
          )}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
          </span>
          {variant === "drawer" && item.href && (
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleRead?.(item.id);
                }}
              >
                {item.read ? "Mark as unread" : "Mark as read"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.(item.id);
                }}
                className="text-destructive"
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}