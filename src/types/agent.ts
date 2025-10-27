export type Agent = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  operationalStatus: "FREE" | "BUSY";
  onboardingStatus: "PENDING" | "APPROVED";
  ratingAvg: number;
  jobsDone: number;
  tags: string[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentFilters = {
  active: "ALL" | "ACTIVE" | "INACTIVE";
  operationalStatus: "ALL" | "FREE" | "BUSY";
  rating: "ALL" | "HIGH" | "MEDIUM" | "LOW";
  dateAdded: "ALL" | "TODAY" | "WEEK" | "MONTH";
  search: string;
};

export type AgentPaginationState = {
  page: number;
  pageSize: number;
  total: number;
};

export type AgentSortState = {
  field: keyof Agent;
  direction: "asc" | "desc";
};

export type JobHistory = {
  id: string;
  requestId: string;
  jobType: "IN_HOUSE" | "IN_SHOP" | "PC_BUILD";
  status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  customerName: string;
  completedAt?: string;
  rating?: number;
  feedback?: string;
};

export type AgentPerformance = {
  jobsDone: number;
  csatScore: number;
  cancelRate: number;
  avgCompletionTime: number;
  monthlyStats: {
    month: string;
    jobsCompleted: number;
    avgRating: number;
  }[];
};

export type AgentFeedback = {
  id: string;
  requestId: string;
  customerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type CreateAgentData = Omit<Agent, "id" | "createdAt" | "updatedAt" | "jobsDone" | "ratingAvg">;
export type UpdateAgentData = Partial<CreateAgentData>;