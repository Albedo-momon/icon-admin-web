import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Bell, Check, X, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { NotificationItem } from "@/components/notifications/NotificationItem";

const NotificationsPage = () => {
  const { items, markRead, markAllRead, toggleRead, remove, clearAll, refreshData } = useNotificationsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Filter and search logic
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by tab
    switch (activeTab) {
      case "unread":
        filtered = filtered.filter(item => !item.read);
        break;
      case "requests":
        filtered = filtered.filter(item => 
          ["NEW_BOOKING", "AGENT_ACCEPTED", "ETA_CONFIRMED", "DIAGNOSIS_COMPLETED", "REPAIR_STARTED", "CANCELLED"].includes(item.kind)
        );
        break;
      case "agents":
        filtered = filtered.filter(item => 
          ["AGENT_CREATED", "AGENT_ACCEPTED"].includes(item.kind)
        );
        break;
      case "system":
        filtered = filtered.filter(item => 
          ["PC_BUILD_PHASE_CHANGE", "SYSTEM"].includes(item.kind)
        );
        break;
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  }, [items, activeTab, searchQuery]);

  // Group by date
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: typeof filteredItems } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    filteredItems.forEach(item => {
      const itemDate = new Date(item.time);
      const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      
      let groupKey: string;
      if (itemDay.getTime() === today.getTime()) {
        groupKey = "Today";
      } else if (itemDay.getTime() === yesterday.getTime()) {
        groupKey = "Yesterday";
      } else {
        groupKey = "Older";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [filteredItems]);

  const unreadCount = items.filter(item => !item.read).length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkMarkRead = () => {
    selectedItems.forEach(id => markRead(id));
    setSelectedItems(new Set());
  };

  const handleBulkMarkUnread = () => {
    selectedItems.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item?.read) {
        toggleRead(id);
      }
    });
    setSelectedItems(new Set());
  };

  const handleBulkRemove = () => {
    selectedItems.forEach(id => remove(id));
    setSelectedItems(new Set());
  };

  return (
    <div className="min-h-screen bg-surface-base p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold text-text-strong">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="bg-surface-card border-border-soft hover:bg-surface-elevated"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="bg-surface-card border-border-soft hover:bg-surface-elevated"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-surface-card border-border-soft"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-surface-card border border-border-soft">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">All</TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-primary data-[state=active]:text-white">Unread</TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-white">Requests</TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-primary data-[state=active]:text-white">Agents</TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-primary data-[state=active]:text-white">System</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* Bulk Actions */}
            {selectedItems.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 bg-surface-card border border-border-soft rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              >
                <span className="text-sm text-text-muted">
                  {selectedItems.size} selected
                </span>
                <Button size="sm" variant="outline" onClick={handleBulkMarkRead}>
                  Mark read
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkMarkUnread}>
                  Mark unread
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkRemove}>
                  Remove
                </Button>
              </motion.div>
            )}

            {/* Select All */}
            {filteredItems.length > 0 && (
              <div className="flex items-center gap-2 pb-2 border-b border-border-soft">
                <Checkbox
                  checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-text-muted">
                  Select all ({filteredItems.length})
                </span>
              </div>
            )}

            {/* Notifications List */}
            {Object.keys(groupedItems).length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-text-muted mb-4" />
                <h3 className="text-lg font-medium mb-2 text-text-strong">No notifications</h3>
                <p className="text-text-muted">
                  {searchQuery ? "No notifications match your search." : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {["Today", "Yesterday", "Older"].map(groupKey => {
                  const groupItems = groupedItems[groupKey];
                  if (!groupItems || groupItems.length === 0) return null;

                  return (
                    <div key={groupKey}>
                      <div className="flex items-center gap-2 mb-4 sticky top-0 bg-background/95 backdrop-blur-sm py-2 border-b border-border/50">
                        <h3 className="text-sm font-semibold text-foreground">
                          {groupKey}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {groupItems.length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {groupItems.map((item) => (
                          <NotificationItem
                            key={item.id}
                            item={item}
                            variant="page"
                            isSelected={selectedItems.has(item.id)}
                            showCheckbox={true}
                            onSelect={handleSelectItem}
                            onToggleRead={toggleRead}
                            onRemove={remove}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NotificationsPage;