import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useDashboardStore, type NotificationItem } from "@/stores/dashboardStore";
import { cn } from "@/lib/utils";

const notificationIcons = {
  NEW_BOOKING: "📋",
  AGENT_ACCEPTED: "✅",
  ETA_CONFIRMED: "⏰",
  DIAGNOSIS_COMPLETED: "🔍",
  REPAIR_STARTED: "🔧",
  PC_BUILD_PHASE_CHANGE: "🖥️",
  CANCELLED: "❌"
};

const notificationColors = {
  NEW_BOOKING: "bg-blue-100 text-blue-800 border-blue-200",
  AGENT_ACCEPTED: "bg-green-100 text-green-800 border-green-200",
  ETA_CONFIRMED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DIAGNOSIS_COMPLETED: "bg-purple-100 text-purple-800 border-purple-200",
  REPAIR_STARTED: "bg-orange-100 text-orange-800 border-orange-200",
  PC_BUILD_PHASE_CHANGE: "bg-indigo-100 text-indigo-800 border-indigo-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200"
};

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

interface NotificationsDrawerProps {
  children: React.ReactNode;
}

export function NotificationsDrawer({ children }: NotificationsDrawerProps) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: NotificationItem) => {
    markNotificationRead(notification.id);
    setIsOpen(false);
    window.open(notification.href, '_blank');
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          {children}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="w-96 p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer",
                    notification.read 
                      ? "bg-muted/30 border-muted" 
                      : "bg-card border-border shadow-sm"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg flex-shrink-0 mt-0.5">
                      {notificationIcons[notification.kind]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={cn(
                          "text-sm font-medium truncate",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.time)}
                          </span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                      {notification.subtitle && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {notification.subtitle}
                        </p>
                      )}
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", notificationColors[notification.kind])}
                      >
                        {notification.kind.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                      {!notification.read && (
                        <div className="flex items-center gap-1 mt-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-xs text-primary font-medium">New</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}