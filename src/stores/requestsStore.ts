import { create } from 'zustand';

// Types based on the requirements
export type JobType = "IN_HOUSE" | "IN_SHOP" | "PC_BUILD";
export type PrimaryStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email?: string;
}

export interface Agent {
  id: string;
  name: string;
  status: "FREE" | "BUSY";
}

export interface RequestRow {
  id: string;
  jobType: JobType;
  primaryStatus: PrimaryStatus;
  user: User;
  agent?: Agent;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  ts: string;
  actor: "USER" | "AGENT" | "ADMIN" | "SYSTEM";
  label: string;
  description?: string;
}

export interface RequestDetail extends RequestRow {
  address?: string;
  scheduledFor?: string;
  timeline: TimelineEvent[];
  notes: Note[];
  feedback?: {
    rating: number;
    comment?: string;
  };
}

export interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  isInternal: boolean;
}

export interface RequestFilters {
  type: JobType | "ALL";
  status: PrimaryStatus | "ALL";
  search: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  field: keyof RequestRow;
  direction: "asc" | "desc";
}

interface RequestsState {
  // Data
  requests: RequestRow[];
  requestDetails: Record<string, RequestDetail>;
  agents: Agent[];
  
  // UI State
  filters: RequestFilters;
  pagination: PaginationState;
  sort: SortState;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setFilters: (filters: Partial<RequestFilters>) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setSort: (sort: SortState) => void;
  loadRequests: () => Promise<void>;
  loadRequestDetail: (id: string) => Promise<RequestDetail | null>;
  reassignRequest: (requestId: string, agentId: string) => Promise<void>;
  cancelRequest: (requestId: string, reason: string) => Promise<void>;
  changeStatus: (requestId: string, status: PrimaryStatus) => Promise<void>;
  addNote: (requestId: string, content: string, isInternal: boolean) => Promise<void>;
  
  // Mock data generators
  generateMockRequests: () => RequestRow[];
  generateMockAgents: () => Agent[];
  generateMockTimeline: (jobType: JobType, status: PrimaryStatus) => TimelineEvent[];
}

// Mock data generators
const generateMockRequests = (): RequestRow[] => {
  const jobTypes: JobType[] = ["IN_HOUSE", "IN_SHOP", "PC_BUILD"];
  const statuses: PrimaryStatus[] = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  
  const users = [
    { id: "u1", name: "John Smith", email: "john@example.com" },
    { id: "u2", name: "Sarah Johnson", email: "sarah@example.com" },
    { id: "u3", name: "Mike Davis", email: "mike@example.com" },
    { id: "u4", name: "Emily Brown", email: "emily@example.com" },
    { id: "u5", name: "David Wilson", email: "david@example.com" },
  ];
  
  const agents = [
    { id: "a1", name: "Alex Thompson", status: "FREE" as const },
    { id: "a2", name: "Lisa Chen", status: "BUSY" as const },
    { id: "a3", name: "Mark Rodriguez", status: "FREE" as const },
    { id: "a4", name: "Anna Kim", status: "BUSY" as const },
  ];
  
  const requests: RequestRow[] = [];
  
  for (let i = 1; i <= 50; i++) {
    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const agent = status !== "PENDING" && Math.random() > 0.3 ? agents[Math.floor(Math.random() * agents.length)] : undefined;
    
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    const updatedAt = new Date(new Date(createdAt).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    
    requests.push({
      id: `REQ-${String(i).padStart(4, '0')}`,
      jobType,
      primaryStatus: status,
      user,
      agent,
      createdAt,
      updatedAt,
    });
  }
  
  return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const generateMockAgents = (): Agent[] => [
  { id: "a1", name: "Alex Thompson", status: "FREE" },
  { id: "a2", name: "Lisa Chen", status: "BUSY" },
  { id: "a3", name: "Mark Rodriguez", status: "FREE" },
  { id: "a4", name: "Anna Kim", status: "BUSY" },
  { id: "a5", name: "Chris Lee", status: "FREE" },
  { id: "a6", name: "Jessica Wang", status: "FREE" },
];

const generateMockTimeline = (jobType: JobType, status: PrimaryStatus): TimelineEvent[] => {
  const baseEvents: TimelineEvent[] = [
    {
      ts: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      actor: "USER",
      label: "Request Raised",
      description: "Customer submitted a new service request"
    }
  ];
  
  if (jobType === "IN_HOUSE") {
    baseEvents.push(
      {
        ts: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        actor: "SYSTEM",
        label: "Searching for Agent",
        description: "System is looking for available technicians"
      }
    );
    
    if (status !== "PENDING") {
      baseEvents.push(
        {
          ts: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          actor: "AGENT",
          label: "Agent Assigned",
          description: "Technician has been assigned to the request"
        },
        {
          ts: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          actor: "AGENT",
          label: "En Route",
          description: "Technician is traveling to customer location"
        }
      );
    }
  } else if (jobType === "IN_SHOP") {
    if (status !== "PENDING") {
      baseEvents.push(
        {
          ts: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          actor: "AGENT",
          label: "Request Accepted",
          description: "Shop has accepted the service request"
        }
      );
    }
  } else if (jobType === "PC_BUILD") {
    if (status !== "PENDING") {
      baseEvents.push(
        {
          ts: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          actor: "AGENT",
          label: "Build Started",
          description: "PC build process has commenced"
        }
      );
    }
  }
  
  if (status === "COMPLETED") {
    baseEvents.push({
      ts: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      actor: "AGENT",
      label: "Service Completed",
      description: "Request has been successfully completed"
    });
  } else if (status === "CANCELLED") {
    baseEvents.push({
      ts: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      actor: "ADMIN",
      label: "Request Cancelled",
      description: "Request was cancelled due to customer request"
    });
  }
  
  return baseEvents.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
};

export const useRequestsStore = create<RequestsState>((set, get) => ({
  // Initial state
  requests: [],
  requestDetails: {},
  agents: [],
  
  filters: {
    type: "ALL",
    status: "ALL",
    search: "",
  },
  
  pagination: {
    page: 1,
    pageSize: 25,
    total: 0,
  },
  
  sort: {
    field: "createdAt",
    direction: "desc",
  },
  
  isLoading: false,
  error: null,
  
  // Actions
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page when filtering
    }));
    get().loadRequests();
  },
  
  setPagination: (newPagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...newPagination },
    }));
    get().loadRequests();
  },
  
  setSort: (newSort) => {
    set({ sort: newSort });
    get().loadRequests();
  },
  
  loadRequests: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { filters, sort, pagination } = get();
      let allRequests = generateMockRequests();
      
      // Apply filters
      if (filters.type !== "ALL") {
        allRequests = allRequests.filter(req => req.jobType === filters.type);
      }
      
      if (filters.status !== "ALL") {
        allRequests = allRequests.filter(req => req.primaryStatus === filters.status);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        allRequests = allRequests.filter(req => 
          req.id.toLowerCase().includes(searchLower) ||
          req.user.name.toLowerCase().includes(searchLower) ||
          req.agent?.name.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply date range filter
      if (filters.dateRange?.from || filters.dateRange?.to) {
        allRequests = allRequests.filter(req => {
          const requestDate = new Date(req.createdAt);
          
          if (filters.dateRange?.from && filters.dateRange?.to) {
            // Both dates selected - filter between range
            return requestDate >= filters.dateRange.from && requestDate <= filters.dateRange.to;
          } else if (filters.dateRange?.from) {
            // Only from date - filter from this date onwards
            return requestDate >= filters.dateRange.from;
          } else if (filters.dateRange?.to) {
            // Only to date - filter up to this date
            return requestDate <= filters.dateRange.to;
          }
          
          return true;
        });
      }
      
      // Apply sorting
      allRequests.sort((a, b) => {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sort.direction === 'asc' ? comparison : -comparison;
        }
        
        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
      
      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.pageSize;
      const paginatedRequests = allRequests.slice(startIndex, startIndex + pagination.pageSize);
      
      set({
        requests: paginatedRequests,
        pagination: { ...pagination, total: allRequests.length },
        isLoading: false,
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load requests',
        isLoading: false 
      });
    }
  },
  
  loadRequestDetail: async (id) => {
    const { requestDetails } = get();
    
    // Return cached detail if available
    if (requestDetails[id]) {
      return requestDetails[id];
    }
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Find the request in the current list or generate mock data
      const allRequests = generateMockRequests();
      const request = allRequests.find(req => req.id === id);
      
      if (!request) {
        return null;
      }
      
      const detail: RequestDetail = {
        ...request,
        address: request.jobType === "IN_HOUSE" ? "123 Main St, City, State 12345" : undefined,
        scheduledFor: request.jobType === "IN_HOUSE" ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        timeline: generateMockTimeline(request.jobType, request.primaryStatus),
        notes: [
          {
            id: "n1",
            content: "Customer reported intermittent connectivity issues",
            author: "System",
            createdAt: request.createdAt,
            isInternal: false,
          },
          {
            id: "n2", 
            content: "Scheduled for next available slot",
            author: "Admin",
            createdAt: new Date(new Date(request.createdAt).getTime() + 60 * 60 * 1000).toISOString(),
            isInternal: true,
          }
        ],
        feedback: request.primaryStatus === "COMPLETED" ? {
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          comment: "Great service, very professional technician!"
        } : undefined,
      };
      
      set((state) => ({
        requestDetails: { ...state.requestDetails, [id]: detail }
      }));
      
      return detail;
    } catch (error) {
      console.error('Failed to load request detail:', error);
      return null;
    }
  },
  
  reassignRequest: async (requestId, agentId) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const agents = generateMockAgents();
      const agent = agents.find(a => a.id === agentId);
      
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      // Update the request in the list
      set((state) => ({
        requests: state.requests.map(req => 
          req.id === requestId ? { ...req, agent, updatedAt: new Date().toISOString() } : req
        )
      }));
      
      // Update cached detail if exists
      const { requestDetails } = get();
      if (requestDetails[requestId]) {
        const newEvent: TimelineEvent = {
          ts: new Date().toISOString(),
          actor: "ADMIN",
          label: "Agent Reassigned",
          description: `Request reassigned to ${agent.name}`
        };
        
        set((state) => ({
          requestDetails: {
            ...state.requestDetails,
            [requestId]: {
              ...state.requestDetails[requestId],
              agent,
              updatedAt: new Date().toISOString(),
              timeline: [...state.requestDetails[requestId].timeline, newEvent]
            }
          }
        }));
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reassign request');
    }
  },
  
  cancelRequest: async (requestId, reason) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the request in the list
      set((state) => ({
        requests: state.requests.map(req => 
          req.id === requestId ? { 
            ...req, 
            primaryStatus: "CANCELLED", 
            updatedAt: new Date().toISOString() 
          } : req
        )
      }));
      
      // Update cached detail if exists
      const { requestDetails } = get();
      if (requestDetails[requestId]) {
        const newEvent: TimelineEvent = {
          ts: new Date().toISOString(),
          actor: "ADMIN",
          label: "Request Cancelled",
          description: `Reason: ${reason}`
        };
        
        set((state) => ({
          requestDetails: {
            ...state.requestDetails,
            [requestId]: {
              ...state.requestDetails[requestId],
              primaryStatus: "CANCELLED",
              updatedAt: new Date().toISOString(),
              timeline: [...state.requestDetails[requestId].timeline, newEvent]
            }
          }
        }));
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to cancel request');
    }
  },
  
  changeStatus: async (requestId, status) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the request in the list
      set((state) => ({
        requests: state.requests.map(req => 
          req.id === requestId ? { 
            ...req, 
            primaryStatus: status, 
            updatedAt: new Date().toISOString() 
          } : req
        )
      }));
      
      // Update cached detail if exists
      const { requestDetails } = get();
      if (requestDetails[requestId]) {
        const newEvent: TimelineEvent = {
          ts: new Date().toISOString(),
          actor: "ADMIN",
          label: "Status Changed",
          description: `Status updated to ${status}`
        };
        
        set((state) => ({
          requestDetails: {
            ...state.requestDetails,
            [requestId]: {
              ...state.requestDetails[requestId],
              primaryStatus: status,
              updatedAt: new Date().toISOString(),
              timeline: [...state.requestDetails[requestId].timeline, newEvent]
            }
          }
        }));
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to change status');
    }
  },
  
  addNote: async (requestId, content, isInternal) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newNote: Note = {
        id: `n${Date.now()}`,
        content,
        author: "Admin", // In real app, this would come from auth context
        createdAt: new Date().toISOString(),
        isInternal,
      };
      
      // Update cached detail if exists
      const { requestDetails } = get();
      if (requestDetails[requestId]) {
        set((state) => ({
          requestDetails: {
            ...state.requestDetails,
            [requestId]: {
              ...state.requestDetails[requestId],
              notes: [...state.requestDetails[requestId].notes, newNote]
            }
          }
        }));
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add note');
    }
  },
  
  // Mock data generators (exposed for initial load)
  generateMockRequests,
  generateMockAgents,
  generateMockTimeline,
}));

// Initialize the store with mock data
useRequestsStore.getState().loadRequests();
useRequestsStore.setState({ agents: generateMockAgents() });