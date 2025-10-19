import { create } from "zustand";
import { 
  Agent, 
  AgentFilters, 
  AgentPaginationState, 
  AgentSortState, 
  CreateAgentData, 
  UpdateAgentData,
  JobHistory,
  AgentPerformance,
  AgentFeedback
} from "@/types/agent";

interface AgentsState {
  agents: Agent[];
  filteredAgents: Agent[];
  selectedAgent: Agent | null;
  agentJobHistory: Record<string, JobHistory[]>;
  agentPerformance: Record<string, AgentPerformance>;
  agentFeedback: Record<string, AgentFeedback[]>;
  filters: AgentFilters;
  pagination: AgentPaginationState;
  sort: AgentSortState;
  loading: boolean;
  error: string | null;

  // Actions
  fetchAgents: () => Promise<void>;
  fetchAgentById: (id: string) => Promise<Agent | null>;
  createAgent: (data: CreateAgentData) => Promise<void>;
  updateAgent: (id: string, data: UpdateAgentData) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  toggleAgentStatus: (id: string) => Promise<void>;
  bulkUpdateAgentStatus: (ids: string[], active: boolean) => Promise<void>;
  setFilters: (filters: Partial<AgentFilters>) => void;
  setPagination: (pagination: Partial<AgentPaginationState>) => void;
  setSort: (sort: AgentSortState) => void;
  applyFiltersAndSort: () => void;
  fetchAgentJobHistory: (agentId: string) => Promise<JobHistory[]>;
  fetchAgentPerformance: (agentId: string) => Promise<AgentPerformance>;
  fetchAgentFeedback: (agentId: string) => Promise<AgentFeedback[]>;
}

// Mock data generators
const generateMockAgents = (): Agent[] => {
  const names = [
    "Sarah Johnson", "Mike Chen", "Emily Rodriguez", "David Kim", 
    "Jessica Brown", "Alex Thompson", "Maria Garcia", "James Wilson",
    "Lisa Anderson", "Robert Taylor", "Amanda Martinez", "Chris Lee"
  ];
  
  const tags = [
    ["Hardware", "Troubleshooting"], ["Software", "Windows"], ["Mac", "iOS"],
    ["Gaming", "PC Build"], ["Network", "Security"], ["Mobile", "Android"],
    ["Printer", "Scanner"], ["Data Recovery"], ["Virus Removal"], 
    ["Setup", "Installation"], ["Repair", "Maintenance"], ["Consultation"]
  ];

  return names.map((name, index) => ({
    id: `agent-${index + 1}`,
    name,
    email: `${name.toLowerCase().replace(" ", ".")}@icontech.com`,
    phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    active: Math.random() > 0.2,
    operationalStatus: Math.random() > 0.3 ? "FREE" : "BUSY" as const,
    onboardingStatus: Math.random() > 0.1 ? "APPROVED" : "PENDING" as const,
    ratingAvg: Math.round((Math.random() * 2 + 3) * 10) / 10,
    jobsDone: Math.floor(Math.random() * 500) + 10,
    tags: tags[index] || ["General Support"],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

const generateMockJobHistory = (agentId: string): JobHistory[] => {
  const jobTypes = ["IN_HOUSE", "IN_SHOP", "PC_BUILD"] as const;
  const statuses = ["COMPLETED", "CANCELLED"] as const;
  const customers = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"];
  
  return Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, index) => ({
    id: `job-${agentId}-${index + 1}`,
    requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
    jobType: jobTypes[Math.floor(Math.random() * jobTypes.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    customerName: customers[Math.floor(Math.random() * customers.length)],
    completedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    rating: Math.random() > 0.2 ? Math.floor(Math.random() * 2) + 4 : undefined,
    feedback: Math.random() > 0.5 ? "Great service, very professional!" : undefined,
  }));
};

const generateMockPerformance = (agent: Agent): AgentPerformance => {
  const monthlyStats = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - index);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      jobsCompleted: Math.floor(Math.random() * 50) + 10,
      avgRating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
    };
  }).reverse();

  return {
    jobsDone: agent.jobsDone,
    csatScore: Math.round((Math.random() * 20 + 80) * 10) / 10,
    cancelRate: Math.round((Math.random() * 10 + 2) * 10) / 10,
    avgCompletionTime: Math.round((Math.random() * 120 + 30) * 10) / 10,
    monthlyStats,
  };
};

const generateMockFeedback = (agentId: string): AgentFeedback[] => {
  const comments = [
    "Excellent service, very knowledgeable!",
    "Quick resolution, professional attitude.",
    "Went above and beyond to help.",
    "Clear communication throughout the process.",
    "Fixed the issue perfectly, thank you!",
  ];
  
  return Array.from({ length: Math.floor(Math.random() * 15) + 5 }, (_, index) => ({
    id: `feedback-${agentId}-${index + 1}`,
    requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
    customerName: `Customer ${index + 1}`,
    rating: Math.floor(Math.random() * 2) + 4,
    comment: Math.random() > 0.3 ? comments[Math.floor(Math.random() * comments.length)] : undefined,
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  filteredAgents: [],
  selectedAgent: null,
  agentJobHistory: {},
  agentPerformance: {},
  agentFeedback: {},
  filters: {
    active: "ALL",
    operationalStatus: "ALL",
    rating: "ALL",
    dateAdded: "ALL",
    search: "",
  },
  pagination: {
    page: 1,
    pageSize: 25,
    total: 0,
  },
  sort: {
    field: "name",
    direction: "asc",
  },
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const agents = generateMockAgents();
      set({ agents, loading: false });
      get().applyFiltersAndSort();
    } catch (error) {
      set({ error: "Failed to fetch agents", loading: false });
    }
  },

  fetchAgentById: async (id: string) => {
    const { agents } = get();
    const agent = agents.find(a => a.id === id);
    if (agent) {
      set({ selectedAgent: agent });
      return agent;
    }
    return null;
  },

  createAgent: async (data: CreateAgentData) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        active: true, // Default to true
        operationalStatus: "FREE", // Default to FREE
        onboardingStatus: "PENDING", // Default to PENDING
        jobsDone: 0, // Default to 0
        ratingAvg: 0, // Default to 0
        tags: data.tags || [],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const { agents } = get();
      // Add new agent to the beginning of the list
      set({ agents: [newAgent, ...agents], loading: false });
      get().applyFiltersAndSort();
    } catch (error) {
      set({ error: "Failed to create agent", loading: false });
    }
  },

  updateAgent: async (id: string, data: UpdateAgentData) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { agents } = get();
      const updatedAgents = agents.map(agent =>
        agent.id === id
          ? { ...agent, ...data, updatedAt: new Date().toISOString() }
          : agent
      );
      
      set({ agents: updatedAgents, loading: false });
      get().applyFiltersAndSort();
    } catch (error) {
      set({ error: "Failed to update agent", loading: false });
    }
  },

  deleteAgent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { agents } = get();
      const updatedAgents = agents.filter(agent => agent.id !== id);
      
      set({ agents: updatedAgents, loading: false });
      get().applyFiltersAndSort();
    } catch (error) {
      set({ error: "Failed to delete agent", loading: false });
    }
  },

  toggleAgentStatus: async (id: string) => {
    const { agents } = get();
    const agent = agents.find(a => a.id === id);
    if (agent) {
      await get().updateAgent(id, { active: !agent.active });
    }
  },

  bulkUpdateAgentStatus: async (ids: string[], active: boolean) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { agents } = get();
      const updatedAgents = agents.map(agent =>
        ids.includes(agent.id)
          ? { ...agent, active, updatedAt: new Date().toISOString() }
          : agent
      );
      
      set({ agents: updatedAgents, loading: false });
      get().applyFiltersAndSort();
    } catch (error) {
      set({ error: "Failed to update agents", loading: false });
    }
  },

  setFilters: (newFilters: Partial<AgentFilters>) => {
    const { filters } = get();
    set({ filters: { ...filters, ...newFilters } });
    get().applyFiltersAndSort();
  },

  setPagination: (newPagination: Partial<AgentPaginationState>) => {
    const { pagination } = get();
    set({ pagination: { ...pagination, ...newPagination } });
  },

  setSort: (sort: AgentSortState) => {
    set({ sort });
    get().applyFiltersAndSort();
  },

  applyFiltersAndSort: () => {
    const { agents, filters, sort } = get();
    
    let filtered = agents.filter(agent => {
      // Active filter
      if (filters.active !== "ALL") {
        const isActive = filters.active === "ACTIVE";
        if (agent.active !== isActive) return false;
      }
      
      // Operational status filter
      if (filters.operationalStatus !== "ALL") {
        if (agent.operationalStatus !== filters.operationalStatus) return false;
      }
      
      // Rating filter
      if (filters.rating !== "ALL") {
        const rating = agent.ratingAvg;
        switch (filters.rating) {
          case "HIGH":
            if (rating < 4.5) return false;
            break;
          case "MEDIUM":
            if (rating < 3.5 || rating >= 4.5) return false;
            break;
          case "LOW":
            if (rating >= 3.5) return false;
            break;
        }
      }
      
      // Date added filter
      if (filters.dateAdded !== "ALL") {
        const agentDate = new Date(agent.createdAt);
        const now = new Date();
        const diffInHours = (now.getTime() - agentDate.getTime()) / (1000 * 60 * 60);
        
        switch (filters.dateAdded) {
          case "TODAY":
            if (diffInHours > 24) return false;
            break;
          case "WEEK":
            if (diffInHours > 168) return false; // 7 days
            break;
          case "MONTH":
            if (diffInHours > 720) return false; // 30 days
            break;
        }
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          agent.name.toLowerCase().includes(searchLower) ||
          agent.email.toLowerCase().includes(searchLower) ||
          agent.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
    
    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sort.direction === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sort.direction === "asc" 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });
    
    set({ 
      filteredAgents: filtered,
      pagination: { ...get().pagination, total: filtered.length }
    });
  },

  fetchAgentJobHistory: async (agentId: string) => {
    const { agentJobHistory } = get();
    
    if (agentJobHistory[agentId]) {
      return agentJobHistory[agentId];
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    const jobHistory = generateMockJobHistory(agentId);
    
    set({
      agentJobHistory: { ...agentJobHistory, [agentId]: jobHistory }
    });
    
    return jobHistory;
  },

  fetchAgentPerformance: async (agentId: string) => {
    const { agentPerformance, agents } = get();
    
    if (agentPerformance[agentId]) {
      return agentPerformance[agentId];
    }
    
    const agent = agents.find(a => a.id === agentId);
    if (!agent) throw new Error("Agent not found");
    
    await new Promise(resolve => setTimeout(resolve, 300));
    const performance = generateMockPerformance(agent);
    
    set({
      agentPerformance: { ...agentPerformance, [agentId]: performance }
    });
    
    return performance;
  },

  fetchAgentFeedback: async (agentId: string) => {
    const { agentFeedback } = get();
    
    if (agentFeedback[agentId]) {
      return agentFeedback[agentId];
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    const feedback = generateMockFeedback(agentId);
    
    set({
      agentFeedback: { ...agentFeedback, [agentId]: feedback }
    });
    
    return feedback;
  },
}));