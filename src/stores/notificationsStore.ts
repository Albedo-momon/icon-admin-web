import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationKind = 
  | "NEW_BOOKING" | "AGENT_ACCEPTED" | "ETA_CONFIRMED" 
  | "DIAGNOSIS_COMPLETED" | "REPAIR_STARTED" 
  | "PC_BUILD_PHASE_CHANGE" | "CANCELLED" 
  | "AGENT_CREATED" | "SYSTEM";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  subtitle?: string;
  time: string; // ISO string
  href?: string;
  read: boolean;
  severity?: "info" | "success" | "warning" | "error";
};

export type NotificationFilter = "ALL" | "REQUESTS" | "AGENTS" | "SYSTEM" | "UNREAD";

interface NotificationsState {
  items: NotificationItem[];
  isDrawerOpen: boolean;
  
  // Actions
  markRead: (id: string) => void;
  markAllRead: () => void;
  toggleRead: (id: string) => void;
  remove: (id: string) => void;
  push: (notification: NotificationItem) => void;
  clearAll: () => void;
  setDrawerOpen: (open: boolean) => void;
  refreshData: () => void; // Add refresh method
  
  // Computed getters
  getUnreadCount: () => number;
  getFilteredItems: (filter: NotificationFilter, searchQuery?: string) => NotificationItem[];
}

// Demo data generator
const generateDemoNotifications = (): NotificationItem[] => {
  const now = new Date();
  const notifications: NotificationItem[] = [
    // TODAY - Recent notifications (within last 24 hours)
    {
      id: "n1",
      kind: "NEW_BOOKING",
      title: "New Service Request",
      subtitle: "PC Repair - John Smith",
      time: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      href: "/requests/req-001",
      read: false,
      severity: "info"
    },
    {
      id: "n2",
      kind: "AGENT_ACCEPTED",
      title: "Agent Accepted Request",
      subtitle: "Emily Rodriguez accepted PC Build",
      time: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      href: "/requests/req-002",
      read: false,
      severity: "success"
    },
    {
      id: "n3",
      kind: "ETA_CONFIRMED",
      title: "ETA Confirmed",
      subtitle: "Technician arriving at 2:30 PM",
      time: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      href: "/requests/req-003",
      read: true,
      severity: "info"
    },
    {
      id: "n4",
      kind: "DIAGNOSIS_COMPLETED",
      title: "Diagnosis Complete",
      subtitle: "Hardware issue identified - GPU replacement needed",
      time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      href: "/requests/req-004",
      read: true,
      severity: "success"
    },
    {
      id: "n5",
      kind: "PC_BUILD_PHASE_CHANGE",
      title: "Build Phase Updated",
      subtitle: "Assembly → Testing",
      time: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      href: "/requests/req-005",
      read: false,
      severity: "info"
    },
    {
      id: "n6",
      kind: "CANCELLED",
      title: "Request Cancelled",
      subtitle: "Customer cancelled repair service",
      time: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      href: "/requests/req-006",
      read: true,
      severity: "warning"
    },
    {
      id: "n7",
      kind: "AGENT_CREATED",
      title: "New Agent Registered",
      subtitle: "Michael Chen joined the team",
      time: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      href: "/agents/agent-007",
      read: false,
      severity: "success"
    },
    {
      id: "n11",
      kind: "REPAIR_STARTED",
      title: "Repair Started",
      subtitle: "Laptop screen replacement in progress",
      time: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      href: "/requests/req-011",
      read: true,
      severity: "info"
    },
    {
      id: "n12",
      kind: "NEW_BOOKING",
      title: "Urgent Service Request",
      subtitle: "Gaming PC - No Display Issue",
      time: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
      href: "/requests/req-012",
      read: false,
      severity: "error"
    },
    {
      id: "n13",
      kind: "SYSTEM",
      title: "System Update",
      subtitle: "Inventory management system updated",
      time: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      read: true,
      severity: "info"
    },

    // YESTERDAY - Notifications from 24-48 hours ago
    {
      id: "n14",
      kind: "AGENT_ACCEPTED",
      title: "Agent Accepted Request",
      subtitle: "Sarah Wilson accepted Data Recovery",
      time: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(), // 26 hours ago
      href: "/requests/req-014",
      read: true,
      severity: "success"
    },
    {
      id: "n15",
      kind: "DIAGNOSIS_COMPLETED",
      title: "Diagnosis Complete",
      subtitle: "Hard drive failure confirmed",
      time: new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString(), // 28 hours ago
      href: "/requests/req-015",
      read: false,
      severity: "warning"
    },
    {
      id: "n16",
      kind: "PC_BUILD_PHASE_CHANGE",
      title: "Build Phase Updated",
      subtitle: "Testing → Quality Check",
      time: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
      href: "/requests/req-016",
      read: true,
      severity: "info"
    },
    {
      id: "n17",
      kind: "ETA_CONFIRMED",
      title: "ETA Updated",
      subtitle: "Delivery scheduled for tomorrow 10 AM",
      time: new Date(now.getTime() - 32 * 60 * 60 * 1000).toISOString(), // 32 hours ago
      href: "/requests/req-017",
      read: true,
      severity: "info"
    },
    {
      id: "n18",
      kind: "NEW_BOOKING",
      title: "New Service Request",
      subtitle: "Office PC Setup - 5 Computers",
      time: new Date(now.getTime() - 35 * 60 * 60 * 1000).toISOString(), // 35 hours ago
      href: "/requests/req-018",
      read: false,
      severity: "info"
    },
    {
      id: "n19",
      kind: "REPAIR_STARTED",
      title: "Repair In Progress",
      subtitle: "Motherboard replacement started",
      time: new Date(now.getTime() - 38 * 60 * 60 * 1000).toISOString(), // 38 hours ago
      href: "/requests/req-019",
      read: true,
      severity: "info"
    },
    {
      id: "n8",
      kind: "SYSTEM",
      title: "System Maintenance",
      subtitle: "Scheduled maintenance completed",
      time: new Date(now.getTime() - 40 * 60 * 60 * 1000).toISOString(), // 40 hours ago
      read: true,
      severity: "info"
    },

    // OLDER - Notifications older than 48 hours
    {
      id: "n20",
      kind: "AGENT_CREATED",
      title: "New Agent Registered",
      subtitle: "David Park joined the team",
      time: new Date(now.getTime() - 50 * 60 * 60 * 1000).toISOString(), // 50 hours ago
      href: "/agents/agent-020",
      read: true,
      severity: "success"
    },
    {
      id: "n21",
      kind: "CANCELLED",
      title: "Request Cancelled",
      subtitle: "Customer cancelled PC build order",
      time: new Date(now.getTime() - 55 * 60 * 60 * 1000).toISOString(), // 55 hours ago
      href: "/requests/req-021",
      read: true,
      severity: "warning"
    },
    {
      id: "n10",
      kind: "SYSTEM",
      title: "Backup Complete",
      subtitle: "Daily system backup finished",
      time: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
      read: true,
      severity: "success"
    },
    {
      id: "n22",
      kind: "DIAGNOSIS_COMPLETED",
      title: "Diagnosis Complete",
      subtitle: "Software corruption detected",
      time: new Date(now.getTime() - 96 * 60 * 60 * 1000).toISOString(), // 4 days ago
      href: "/requests/req-022",
      read: true,
      severity: "error"
    },
    {
      id: "n23",
      kind: "PC_BUILD_PHASE_CHANGE",
      title: "Build Complete",
      subtitle: "Custom gaming rig ready for pickup",
      time: new Date(now.getTime() - 120 * 60 * 60 * 1000).toISOString(), // 5 days ago
      href: "/requests/req-023",
      read: true,
      severity: "success"
    }
  ];
  
  return notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: generateDemoNotifications(),
      isDrawerOpen: false,
      
      markRead: (id: string) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, read: true } : item
          )
        }));
      },
      
      markAllRead: () => {
        set((state) => ({
          items: state.items.map(item => ({ ...item, read: true }))
        }));
      },
      
      toggleRead: (id: string) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, read: !item.read } : item
          )
        }));
      },
      
      remove: (id: string) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },
      
      push: (notification: NotificationItem) => {
        set((state) => ({
          items: [notification, ...state.items]
        }));
      },
      
      clearAll: () => {
        set({ items: [] });
      },
      
      setDrawerOpen: (open: boolean) => {
        set({ isDrawerOpen: open });
      },
      
      refreshData: () => {
        set({ items: generateDemoNotifications() });
      },
      
      getUnreadCount: () => {
        const { items } = get();
        return items.filter(item => !item.read).length;
      },
      
      getFilteredItems: (filter: NotificationFilter, searchQuery?: string) => {
        const { items } = get();
        let filtered = items;
        
        // Apply filter
        switch (filter) {
          case "UNREAD":
            filtered = items.filter(item => !item.read);
            break;
          case "REQUESTS":
            filtered = items.filter(item => 
              ["NEW_BOOKING", "AGENT_ACCEPTED", "ETA_CONFIRMED", "DIAGNOSIS_COMPLETED", "REPAIR_STARTED", "PC_BUILD_PHASE_CHANGE", "CANCELLED"].includes(item.kind)
            );
            break;
          case "AGENTS":
            filtered = items.filter(item => 
              ["AGENT_CREATED", "AGENT_ACCEPTED"].includes(item.kind)
            );
            break;
          case "SYSTEM":
            filtered = items.filter(item => item.kind === "SYSTEM");
            break;
          case "ALL":
          default:
            filtered = items;
            break;
        }
        
        // Apply search query
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(item =>
            item.title.toLowerCase().includes(query) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(query))
          );
        }
        
        return filtered;
      }
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({
        items: state.items,
        // Don't persist drawer state
      }),
    }
  )
);

// Helper function to create new notifications for demo purposes
export const createDemoNotification = (kind: NotificationKind): NotificationItem => {
  const id = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const templates: Record<NotificationKind, Omit<NotificationItem, 'id' | 'time' | 'read'>> = {
    NEW_BOOKING: {
      kind: "NEW_BOOKING",
      title: "New Service Request",
      subtitle: `PC Repair - Customer ${Math.floor(Math.random() * 1000)}`,
      href: `/requests/req-${Math.floor(Math.random() * 1000)}`,
      severity: "info"
    },
    AGENT_ACCEPTED: {
      kind: "AGENT_ACCEPTED",
      title: "Agent Accepted Request",
      subtitle: "Agent accepted your service request",
      href: `/requests/req-${Math.floor(Math.random() * 1000)}`,
      severity: "success"
    },
    ETA_CONFIRMED: {
      kind: "ETA_CONFIRMED",
      title: "ETA Confirmed",
      subtitle: `Technician arriving at ${new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString()}`,
      href: `/requests/req-${Math.floor(Math.random() * 1000)}`,
      severity: "info"
    },
    DIAGNOSIS_COMPLETED: {
      kind: "DIAGNOSIS_COMPLETED",
      title: "Diagnosis Complete",
      subtitle: "Issue identified and quote prepared",
      href: `/requests/req-${Math.floor(Math.random() * 1000)}`,
      severity: "success"
    },
    REPAIR_STARTED: {
      kind: "REPAIR_STARTED",
      title: "Repair In Progress",
      subtitle: "Technician has started the repair",
      href: `/requests/req-${Math.floor(Math.random() * 1000)}`,
      severity: "info"
    },
    PC_BUILD_PHASE_CHANGE: {
      kind: "PC_BUILD_PHASE_CHANGE",
      title: "Build Phase Updated",
      subtitle: "Your PC build has progressed to the next phase",
      href: `/requests/req-${Math.floor(Math.random() * 1000)}`,
      severity: "info"
    },
    CANCELLED: {
      kind: "CANCELLED",
      title: "Request Cancelled",
      subtitle: "Service request has been cancelled",
      href: `/requests/req-${Math.floor(Math.random() * 1000)}`,
      severity: "warning"
    },
    AGENT_CREATED: {
      kind: "AGENT_CREATED",
      title: "New Agent Registered",
      subtitle: `Agent ${Math.floor(Math.random() * 1000)} joined the team`,
      href: `/agents/agent-${Math.floor(Math.random() * 1000)}`,
      severity: "success"
    },
    SYSTEM: {
      kind: "SYSTEM",
      title: "System Notification",
      subtitle: "System maintenance or update completed",
      severity: "info"
    }
  };
  
  return {
    id,
    time: now,
    read: false,
    ...templates[kind]
  };
};