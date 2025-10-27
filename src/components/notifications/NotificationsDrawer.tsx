import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { NotificationItem } from "./NotificationItem";

interface NotificationsDrawerProps {
  children: React.ReactNode;
}

export function NotificationsDrawer({ children }: NotificationsDrawerProps) {
  const { items, markAllRead, toggleRead, remove } = useNotificationsStore();

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // Filter logic
  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return items.filter(item => !item.read);
      case "requests":
        return items.filter(item => 
          ["NEW_BOOKING", "AGENT_ACCEPTED", "ETA_CONFIRMED", "DIAGNOSIS_COMPLETED", "REPAIR_STARTED", "CANCELLED"].includes(item.kind)
        );
      case "agents":
        return items.filter(item => 
          ["AGENT_CREATED", "AGENT_ACCEPTED"].includes(item.kind)
        );
      case "system":
        return items.filter(item => 
          ["PC_BUILD_PHASE_CHANGE", "SYSTEM"].includes(item.kind)
        );
      default:
        return items;
    }
  }, [items, activeFilter]);

  const unreadCount = items.filter(item => !item.read).length;

  const filterOptions = [
    { key: "all", label: "All", count: items.length },
    { key: "requests", label: "Requests", count: items.filter(item => 
      ["NEW_BOOKING", "AGENT_ACCEPTED", "ETA_CONFIRMED", "DIAGNOSIS_COMPLETED", "REPAIR_STARTED", "CANCELLED"].includes(item.kind)
    ).length },
    { key: "agents", label: "Agents", count: items.filter(item => 
      ["AGENT_CREATED", "AGENT_ACCEPTED"].includes(item.kind)
    ).length },
    { key: "system", label: "System", count: items.filter(item => 
      ["PC_BUILD_PHASE_CHANGE", "SYSTEM"].includes(item.kind)
    ).length },
    { key: "unread", label: "Unread", count: unreadCount },
  ];

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full md:w-96 p-0 bg-background/80 backdrop-blur-xl border-l border-border/50 md:max-w-96"
      >
        <motion.div
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </SheetTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Filters */}
          <div className="p-4 border-b border-border/50">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.key}
                  variant={activeFilter === option.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(option.key)}
                  className="h-8 text-xs"
                >
                  {option.label}
                  {option.count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                      {option.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              <AnimatePresence mode="popLayout">
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center py-12"
                  >
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-sm font-medium mb-2">No notifications</h3>
                    <p className="text-xs text-muted-foreground">
                      {activeFilter === "all" ? "You're all caught up!" : `No ${activeFilter} notifications`}
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <NotificationItem
                          item={item}
                          variant="drawer"
                          onToggleRead={toggleRead}
                          onRemove={remove}
                          onCloseDrawer={() => setDrawerOpen(false)}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}