import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MoreHorizontal,
  User,
  Mail,
  Phone,
  Calendar,
  Star,
  TrendingUp,
  MessageSquare,
  Edit,
  Trash2,
  Shield,
  Activity,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DataTable } from "@/components/ui/DataTable";
import { useAgentsStore, type Agent, type JobHistory, type AgentPerformance, type AgentFeedback } from "@/stores/agentsStore";
import EditAgentModal from "@/components/agents/EditAgentModal";
import DeleteAgentModal from "@/components/agents/DeleteAgentModal";
import { cn } from "@/lib/utils";

// Status chip component for agents
const StatusChip = ({ active }: { active: boolean }) => {
  return (
    <Badge 
      variant={active ? "default" : "secondary"}
      className={cn(
        "font-medium",
        active 
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
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
      variant={status === "FREE" ? "outline" : "secondary"}
      className={cn(
        "font-medium",
        status === "FREE" 
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
          : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
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
        status === "APPROVED" 
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      )}
    >
      {status === "APPROVED" ? "Approved" : "Pending"}
    </Badge>
  );
};

// Rating display component
const RatingDisplay = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

// Main component
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
        
        // Load additional data
        const [historyData, performanceData, feedbackData] = await Promise.all([
          fetchAgentJobHistory(id),
          fetchAgentPerformance(id),
          fetchAgentFeedback(id)
        ]);
        
        setJobHistory(historyData);
        setPerformance(performanceData);
        setFeedback(feedbackData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agent data");
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
      console.error("Failed to update agent status:", err);
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
      console.error("Failed to delete agent:", err);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSave = async (updatedAgent: Partial<Agent>) => {
    if (!agent) return;
    
    try {
      await updateAgent(agent.id, updatedAgent);
      setAgent({ ...agent, ...updatedAgent });
      setShowEditModal(false);
    } catch (err) {
      console.error("Failed to update agent:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading agent details..." />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <div>
          <p className="text-red-600 font-medium mb-2">Error loading agent</p>
          <p className="text-muted-foreground mb-4">{error || "Agent not found"}</p>
          <Button onClick={() => navigate("/agents")}>Back to Agents</Button>
        </div>
      </div>
    );
  }

  // Job history table columns
  const jobHistoryColumns = [
    {
      key: "requestId",
      label: "Request ID",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <Badge variant={value === "COMPLETED" ? "default" : "secondary"}>
          {value}
        </Badge>
      ),
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/agents")}
            className="shrink-0"
            aria-label="Go back to agents list"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
          
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight truncate">{agent.name}</h1>
              <StatusChip active={agent.active} />
              <OperationalStatusChip status={agent.operationalStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              Agent ID: {agent.id} • {agent.jobsDone} jobs completed
            </p>
          </div>
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

      {/* Header Card */}
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
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="jobs">Jobs History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

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

            {/* Skills & Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.tags.map((tag, index) => (
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
                searchKey="requestId"
                searchPlaceholder="Search by request ID..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {performance && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Performance Metrics Cards */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Jobs Completed</p>
                      <p className="text-2xl font-bold">{performance.jobsCompleted}</p>
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
                      <p className="text-2xl font-bold">{performance.avgResolutionTime}h</p>
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
          onSave={handleEditSave}
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