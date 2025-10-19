import { create } from 'zustand';

// Data types as per specification
export type RequestType = "IN_HOUSE" | "IN_SHOP" | "PC_BUILD";
export type RequestStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type DashboardCounts = {
  open: { 
    total: number; 
    byType: Record<RequestType, number>; 
  };
  completedToday: number;
  cancelled: { 
    total: number; 
    byActor: { user: number; agent: number; admin: number; }; 
  };
  agents: { 
    active: number; 
    total: number; 
    utilization: { free: number; busy: number; }; 
  };
  users: { 
    active: number; 
    total: number; 
  };
  csat30d?: number;
  activeOffers?: number;
};

export type TimePoint = { 
  date: string; 
  inHouse: number; 
  inShop: number; 
  pcBuild: number; 
};

export type TypeSplit = { 
  inHouse: number; 
  inShop: number; 
  pcBuild: number; 
};

export type AttentionItem = {
  bookingId: string;
  type: RequestType;
  reason: "PC_BUILD_STALLED" | "ETA_OVERDUE" | "DIAGNOSIS_DELAY";
  ageMinutes: number;
  href: string;
};

export type NotificationItem = {
  id: string;
  kind: 
    | "NEW_BOOKING" | "AGENT_ACCEPTED" | "ETA_CONFIRMED"
    | "DIAGNOSIS_COMPLETED" | "REPAIR_STARTED"
    | "PC_BUILD_PHASE_CHANGE" | "CANCELLED";
  title: string;
  subtitle?: string;
  time: string;
  href: string;
  read: boolean;
};

interface DashboardState {
  // Filters
  selectedType: RequestType | "ALL";
  selectedStatuses: RequestStatus[];
  dateRange: { from: Date; to: Date };
  
  // Data
  counts: DashboardCounts;
  timeSeries: TimePoint[];
  typeSplit: TypeSplit;
  attentionItems: AttentionItem[];
  notifications: NotificationItem[];
  
  // UI State
  isNotificationsOpen: boolean;
  
  // Actions
  setSelectedType: (type: RequestType | "ALL") => void;
  toggleStatus: (status: RequestStatus) => void;
  setDateRange: (range: { from: Date; to: Date }) => void;
  setNotificationsOpen: (open: boolean) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshData: () => void;
}

// Mock data generators
const generateMockCounts = (type: RequestType | "ALL", statuses: RequestStatus[]): DashboardCounts => {
  const baseData = {
    open: {
      total: 156,
      byType: {
        IN_HOUSE: 67,
        IN_SHOP: 45,
        PC_BUILD: 44
      }
    },
    completedToday: 89,
    cancelled: {
      total: 12,
      byActor: { user: 7, agent: 3, admin: 2 }
    },
    agents: {
      active: 156,
      total: 180,
      utilization: { free: 89, busy: 67 }
    },
    users: {
      active: 2847,
      total: 3200
    },
    csat30d: 4.2,
    activeOffers: 8
  };

  let filteredData = { ...baseData };

  // Filter by type if not "ALL"
  if (type !== "ALL") {
    const typeMultiplier = type === "IN_HOUSE" ? 0.43 : type === "IN_SHOP" ? 0.29 : 0.28;
    filteredData = {
      ...filteredData,
      open: {
        total: Math.round(filteredData.open.total * typeMultiplier),
        byType: { [type]: filteredData.open.byType[type] } as Record<RequestType, number>
      },
      completedToday: Math.round(filteredData.completedToday * typeMultiplier),
      cancelled: {
        ...filteredData.cancelled,
        total: Math.round(filteredData.cancelled.total * typeMultiplier)
      }
    };
  }

  // Filter by statuses
  if (statuses.length > 0) {
    // This is a simplified mock filtering. In a real app, you'd filter actual data.
    // For demonstration, we'll reduce counts if specific statuses are selected.
    const statusMultiplier = 0.7; // Example reduction
    filteredData = {
      ...filteredData,
      open: {
        ...filteredData.open,
        total: Math.round(filteredData.open.total * statusMultiplier)
      },
      completedToday: Math.round(filteredData.completedToday * statusMultiplier)
    };
  }

  return filteredData;
};

const generateMockTimeSeries = (): TimePoint[] => {
  const points: TimePoint[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    points.push({
      date: date.toISOString().split('T')[0],
      inHouse: Math.floor(Math.random() * 50) + 20,
      inShop: Math.floor(Math.random() * 30) + 15,
      pcBuild: Math.floor(Math.random() * 25) + 10
    });
  }
  
  return points;
};

const generateMockAttentionItems = (): AttentionItem[] => {
  const items: AttentionItem[] = [
    {
      bookingId: "REQ-2024-001",
      type: "PC_BUILD",
      reason: "PC_BUILD_STALLED",
      ageMinutes: 1440, // 24 hours
      href: "/requests/REQ-2024-001"
    },
    {
      bookingId: "REQ-2024-002",
      type: "IN_HOUSE",
      reason: "ETA_OVERDUE",
      ageMinutes: 720, // 12 hours
      href: "/requests/REQ-2024-002"
    },
    {
      bookingId: "REQ-2024-003",
      type: "IN_SHOP",
      reason: "DIAGNOSIS_DELAY",
      ageMinutes: 480, // 8 hours
      href: "/requests/REQ-2024-003"
    },
    {
      bookingId: "REQ-2024-004",
      type: "PC_BUILD",
      reason: "PC_BUILD_STALLED",
      ageMinutes: 2160, // 36 hours
      href: "/requests/REQ-2024-004"
    },
    {
      bookingId: "REQ-2024-005",
      type: "IN_HOUSE",
      reason: "ETA_OVERDUE",
      ageMinutes: 960, // 16 hours
      href: "/requests/REQ-2024-005"
    },
    {
      bookingId: "REQ-2024-006",
      type: "IN_SHOP",
      reason: "DIAGNOSIS_DELAY",
      ageMinutes: 600, // 10 hours
      href: "/requests/REQ-2024-006"
    },
    {
      bookingId: "REQ-2024-007",
      type: "PC_BUILD",
      reason: "PC_BUILD_STALLED",
      ageMinutes: 180, // 3 hours
      href: "/requests/REQ-2024-007"
    }
  ];
  
  return items; // Return all items for scrollable list
};

const generateMockNotifications = (): NotificationItem[] => {
  return [
    {
      id: "notif-1",
      kind: "NEW_BOOKING",
      title: "New PC Build Request",
      subtitle: "Gaming PC - High Priority",
      time: new Date(Date.now() - 300000).toISOString(), // 5 min ago
      href: "/requests/REQ-2024-004",
      read: false
    },
    {
      id: "notif-2",
      kind: "AGENT_ACCEPTED",
      title: "Agent Accepted Request",
      subtitle: "John D. accepted REQ-2024-001",
      time: new Date(Date.now() - 900000).toISOString(), // 15 min ago
      href: "/requests/REQ-2024-001",
      read: false
    },
    {
      id: "notif-3",
      kind: "ETA_CONFIRMED",
      title: "ETA Confirmed",
      subtitle: "Repair will be completed by 3 PM",
      time: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      href: "/requests/REQ-2024-002",
      read: true
    }
  ];
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  selectedType: "ALL",
  selectedStatuses: [],
  dateRange: {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  },
  
  counts: generateMockCounts("ALL", []),
  timeSeries: generateMockTimeSeries(),
  typeSplit: { inHouse: 67, inShop: 45, pcBuild: 44 },
  attentionItems: generateMockAttentionItems(),
  notifications: generateMockNotifications(),
  
  isNotificationsOpen: false,
  
  // Actions
  setSelectedType: (type) => {
    set((state) => ({
      selectedType: type,
      counts: generateMockCounts(type, state.selectedStatuses)
    }));
  },
  
  toggleStatus: (status) => {
    set((state) => {
      const newStatuses = state.selectedStatuses.includes(status)
        ? state.selectedStatuses.filter(s => s !== status)
        : [...state.selectedStatuses, status];
      
      return {
        selectedStatuses: newStatuses,
        counts: generateMockCounts(state.selectedType, newStatuses)
      };
    });
  },
  
  setDateRange: (range) => {
    set({ dateRange: range });
  },
  
  setNotificationsOpen: (open) => {
    set({ isNotificationsOpen: open });
  },
  
  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    }));
  },
  
  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(notif => ({ ...notif, read: true }))
    }));
  },
  
  refreshData: () => {
    const state = get();
    set({
      counts: generateMockCounts(state.selectedType, state.selectedStatuses),
      timeSeries: generateMockTimeSeries(),
      attentionItems: generateMockAttentionItems(),
      notifications: generateMockNotifications()
    });
  }
}));