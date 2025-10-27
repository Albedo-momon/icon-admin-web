import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MoreHorizontal,
  User,
  Mail,
  Phone,
  Star,
  MessageSquare,
  Edit,
  Trash2,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type JobType } from "../stores/requestsStore";
import { JobTypeBadge } from "./RequestsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DataTable } from "@/components/ui/DataTable";
import { useAgentsStore } from "@/stores/agentsStore";
import { type Agent, type JobHistory, type AgentPerformance, type AgentFeedback, type UpdateAgentData } from "@/types/agent";
import EditAgentModal from "@/components/agents/EditAgentModal";
import DeleteAgentModal from "@/components/agents/DeleteAgentModal";
import { cn } from "@/lib/utils";

// Status chip component
const StatusChip = ({ active }: { active: boolean }) => {
  return (
    <Badge 
      variant={active ? "default" : "secondary"}
      className={cn(
        "font-medium",
        active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      )}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
};

// Operational status chip component
const OperationalStatusChip = ({ status }: { status: "FREE" | "BUSY" }) => {
  return (
    <Badge 
      variant="outline"
      className={cn(
        "font-medium",
        status === "FREE" ? "border-green-500 text-green-700 dark:text-green-400" : "border-orange-500 text-orange-700 dark:text-orange-400"
      )}
    >
      {status}
    </Badge>
  );
};

// Onboarding status chip component
const OnboardingStatusChip = ({ status }: { status: "PENDING" | "APPROVED" }) => {
  return (
    <Badge 
      variant={status === "APPROVED" ? "default" : "secondary"}
      className={cn(
        "font-medium",
        status === "APPROVED" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      )}
    >
      {status}
    </Badge>
  );
};

// Rating display component
const RatingDisplay = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
};

// Job status badge component
const JobStatusBadge = ({ status }: { status: JobHistory["status"] }) => {
  const variants = {
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    ACCEPTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  return (
    <Badge className={cn("font-medium", variants[status as keyof typeof variants])}>
      {status}
    </Badge>
  );
};

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    agents, 
    fetchAgents, 
    updateAgent, 
    deleteAgent,
    fetchAgentJobHistory,
    fetchAgentPerformance,
    fetchAgentFeedback
  } = useAgentsStore();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [jobHistory, setJobHistory] = useState<JobHistory[]>([]);
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [feedback, setFeedback] = useState<AgentFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const loadAgentData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch agents if not already loaded
        if (agents.length === 0) {
          await fetchAgents();
        }
        
        // Find the agent
        const foundAgent = agents.find(a => a.id === id);
        if (!foundAgent) {
          setError("Agent not found");
          return;
        }
        
        setAgent(foundAgent);
        
        // Fetch additional data
        const [jobHistoryData, performanceData, feedbackData] = await Promise.all([
          fetchAgentJobHistory(id),
          fetchAgentPerformance(id),
          fetchAgentFeedback(id)
        ]);
        
        setJobHistory(jobHistoryData);
        setPerformance(performanceData);
        setFeedback(feedbackData);
      } catch (err) {
        setError("Failed to load agent data");
        console.error("Error loading agent data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentData();
  }, [id, agents, fetchAgents, fetchAgentJobHistory, fetchAgentPerformance, fetchAgentFeedback]);

  const handleToggleActive = async () => {
    if (!agent) return;
    
    try {
      await updateAgent(agent.id, { active: !agent.active });
      setAgent({ ...agent, active: !agent.active });
    } catch (err) {
      console.error("Error updating agent status:", err);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!agent) return;
    
    try {
      await deleteAgent(agent.id);
      navigate("/agents");
    } catch (err) {
      console.error("Error deleting agent:", err);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSave = async (agentId: string, updatedAgent: UpdateAgentData) => {
    try {
      await updateAgent(agentId, updatedAgent);
      // Refresh agent data
      const updatedAgentData = agents.find(a => a.id === agentId);
      if (updatedAgentData) {
        setAgent(updatedAgentData);
      }
    } catch (err) {
      console.error("Error updating agent:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg text-muted-foreground">{error || "Agent not found"}</p>
        <Button onClick={() => navigate("/agents")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Agents
        </Button>
      </div>
    );
  }

  const jobHistoryColumns = [
    {
      key: "requestId",
      label: "Request ID",
      sortable: true,
      render: (value: string) => (
        <button 
          className="text-primary hover:underline font-medium"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/requests/${value}`);
          }}
        >
          {value}
        </button>
      ),
    },
    {
      key: "customerName",
      label: "Customer Name",
      sortable: true,
    },
    {
      key: "jobType",
      label: "Type",
      sortable: true,
      render: (value: string) => <JobTypeBadge type={value as JobType} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => <JobStatusBadge status={value as JobHistory["status"]} />,
    },
    {
      key: "completedAt",
      label: "Completed",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (value: number) => value ? <RatingDisplay rating={value} /> : "N/A",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/agents")}
              className="group hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-2 hover:border-primary shadow-sm"
              aria-label="Go back to agents list"
            >
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
              <span className="font-medium">Back to Agents</span>
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Agent Profile</span>
            </div>
          </div>
        </div>

        {/* Agent Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight truncate">{agent.name}</h1>
              <StatusChip active={agent.active} />
              <OperationalStatusChip status={agent.operationalStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              Agent ID: {agent.id} • {agent.jobsDone} jobs completed
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  aria-label="More actions for this agent"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Agent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Agent Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {agent.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold mb-1">{agent.name}</h2>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {agent.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{agent.email}</span>
                    </div>
                  )}
                  {agent.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{agent.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status and Controls */}
            <div className="flex flex-col md:flex-row gap-6 md:ml-auto">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Onboarding Status
                  </p>
                  <OnboardingStatusChip status={agent.onboardingStatus} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Rating
                  </p>
                  <RatingDisplay rating={agent.ratingAvg} />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Active Status
                  </p>
                  <p className="text-sm font-medium">
                    {agent.active ? "Active" : "Inactive"}
                  </p>
                </div>
                <Switch
                  checked={agent.active}
                  onCheckedChange={handleToggleActive}
                  aria-label="Toggle agent active status"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="w-full justify-start md:w-auto md:justify-center">
            <TabsTrigger value="profile" className="whitespace-nowrap">Profile</TabsTrigger>
            <TabsTrigger value="jobs" className="whitespace-nowrap">Jobs History</TabsTrigger>
            <TabsTrigger value="performance" className="whitespace-nowrap">Performance</TabsTrigger>
            <TabsTrigger value="feedback" className="whitespace-nowrap">Feedback</TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                  <p className="font-medium">{agent.name}</p>
                </div>
                {agent.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{agent.email}</p>
                  </div>
                )}
                {agent.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{agent.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Agent ID</p>
                  <p className="font-medium font-mono text-sm">{agent.id}</p>
                </div>
              </CardContent>
            </Card>

            {/* Skills & Expertise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.tags.map((tag: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Jobs History Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Jobs History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={jobHistory}
                columns={jobHistoryColumns}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {performance && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Jobs Completed */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Jobs Completed</p>
                      <p className="text-2xl font-bold">{performance.jobsDone}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CSAT Score</p>
                      <p className="text-2xl font-bold">{performance.csatScore.toFixed(1)}</p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cancel Rate</p>
                      <p className="text-2xl font-bold">{performance.cancelRate.toFixed(1)}%</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg. Resolution</p>
                      <p className="text-2xl font-bold">{performance.avgCompletionTime}h</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Customer Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <RatingDisplay rating={item.rating} />
                        <span className="text-sm text-muted-foreground">
                          Request #{item.requestId}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {item.comment && (
                      <p className="text-sm text-muted-foreground">{item.comment}</p>
                    )}
                  </div>
                ))}
                {feedback.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No feedback available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showEditModal && (
        <EditAgentModal
          agent={agent}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onConfirm={handleEditSave}
        />
      )}
      {showDeleteModal && (
        <DeleteAgentModal
          agent={agent}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}