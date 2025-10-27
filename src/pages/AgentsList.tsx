import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  UserCheck,
  UserX,
  Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, type Column, type RowAction } from "@/components/ui/DataTable";
import { FilterBar, type FilterGroup } from "@/components/ui/FilterBar";
import { CreateAgentModal } from "@/components/agents/CreateAgentModal";
import EditAgentModal from "@/components/agents/EditAgentModal";
import DeleteAgentModal from "@/components/agents/DeleteAgentModal";
import { useAgentsStore } from "@/stores/agentsStore";
import type { Agent } from "@/types/agent";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AgentsList() {
  const navigate = useNavigate();
  const {
    filteredAgents,
    filters,
    pagination,
    sort,
    loading,
    error,
    fetchAgents,
    setFilters,
    setPagination,
    setSort,
    toggleAgentStatus,
    bulkUpdateAgentStatus,
    updateAgent,
    deleteAgent,
  } = useAgentsStore();

  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Get paginated data
  const paginatedAgents = filteredAgents.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  // Filter groups for FilterBar
  const filterGroups: FilterGroup[] = [
    {
      key: "active",
      label: "Status",
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
      ],
    },
    {
      key: "operationalStatus",
      label: "Operational Status",
      options: [
        { value: "FREE", label: "Free" },
        { value: "BUSY", label: "Busy" },
      ],
    },
    {
      key: "rating",
      label: "Rating",
      options: [
        { value: "HIGH", label: "High (4.5+)" },
        { value: "MEDIUM", label: "Medium (3.5-4.4)" },
        { value: "LOW", label: "Low (<3.5)" },
      ],
    },
    {
      key: "dateAdded",
      label: "Date Added",
      options: [
        { value: "TODAY", label: "Last 24 Hours" },
        { value: "WEEK", label: "Last 7 Days" },
        { value: "MONTH", label: "Last 30 Days" },
      ],
    },
  ];

  // Convert filters for FilterBar
  const selectedFilters = {
    active: filters.active !== "ALL" ? [filters.active] : [],
    operationalStatus: filters.operationalStatus !== "ALL" ? [filters.operationalStatus] : [],
    rating: filters.rating !== "ALL" ? [filters.rating] : [],
    dateAdded: filters.dateAdded !== "ALL" ? [filters.dateAdded] : [],
  };

  const handleFiltersChange = (newFilters: Record<string, string[]>) => {
    setFilters({
      active: (newFilters.active?.[0] || "ALL") as "ALL" | "ACTIVE" | "INACTIVE",
      operationalStatus: (newFilters.operationalStatus?.[0] || "ALL") as "ALL" | "FREE" | "BUSY",
      rating: (newFilters.rating?.[0] || "ALL") as "ALL" | "HIGH" | "MEDIUM" | "LOW",
      dateAdded: (newFilters.dateAdded?.[0] || "ALL") as "ALL" | "TODAY" | "WEEK" | "MONTH",
    });
  };

  // Table columns
  const columns: Column<Agent>[] = [
    {
      key: "agent",
      header: "AGENT",
      width: "300px",
      render: (_, agent) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={agent.avatar} alt={agent.name} />
            <AvatarFallback>
              {agent.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{agent.name}</div>
            <div className="text-sm text-muted-foreground">{agent.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "PHONE",
      render: (_, agent) => agent.phone || "—",
    },
    {
      key: "active",
      header: "STATUS",
      render: (_, agent) => (
        <Badge 
          variant={agent.active ? "default" : "secondary"}
          className={cn(
            agent.active 
              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
              : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
          )}
        >
          {agent.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "operationalStatus",
      header: "OPERATIONAL STATUS",
      render: (_, agent) => (
        <Badge 
          variant={agent.operationalStatus === "FREE" ? "default" : "secondary"}
          className={cn(
            agent.operationalStatus === "FREE"
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
              : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
          )}
        >
          {agent.operationalStatus === "FREE" ? "Free" : "Busy"}
        </Badge>
      ),
    },
    {
      key: "onboardingStatus",
      header: "ONBOARDING STATUS",
      render: (_, agent) => (
        <Badge 
          variant={agent.onboardingStatus === "APPROVED" ? "default" : "secondary"}
          className={cn(
            agent.onboardingStatus === "APPROVED"
              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
          )}
        >
          {agent.onboardingStatus === "APPROVED" ? "Approved" : "Pending"}
        </Badge>
      ),
    },
    {
      key: "jobsDone",
      header: "JOBS DONE",
      sortable: true,
      hideOnMobile: true,
      mobileLabel: "Jobs",
      render: (_, agent) => agent.jobsDone.toLocaleString(),
    },
    {
      key: "ratingAvg",
      header: "RATING AVG",
      sortable: true,
      hideOnMobile: true,
      mobileLabel: "Rating",
      render: (_, agent) => (
        <div className="flex items-center gap-1">
          <span>{agent.ratingAvg.toFixed(1)}</span>
          <span className="text-yellow-500">★</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "DATE ADDED",
      sortable: true,
      hideOnMobile: true,
      mobileLabel: "Added",
      render: (_, agent) => {
        const date = new Date(agent.createdAt);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
          return <span className="text-green-600 font-medium">Just now</span>;
        } else if (diffInHours < 24) {
          return <span className="text-green-600 font-medium">{diffInHours}h ago</span>;
        } else if (diffInHours < 168) { // 7 days
          const days = Math.floor(diffInHours / 24);
          return <span className="text-blue-600">{days}d ago</span>;
        } else {
          return <span className="text-muted-foreground">{date.toLocaleDateString()}</span>;
        }
      },
    },
  ];

  // Row actions
  const rowActions: RowAction<Agent>[] = [
    {
      label: "View Details",
      onClick: (agent) => navigate(`/agents/${agent.id}`),
    },
    {
      label: "Edit",
      onClick: (agent) => {
        setSelectedAgent(agent);
        setShowEditModal(true);
      },
    },
    {
      label: agent => agent.active ? "Deactivate" : "Activate",
      onClick: async (agent) => {
        try {
          await toggleAgentStatus(agent.id);
          toast.success(`Agent ${agent.active ? "deactivated" : "activated"} successfully`);
        } catch (error) {
          toast.error("Failed to update agent status");
        }
      },
    },
    {
      label: "Delete",
      onClick: (agent) => {
        setSelectedAgent(agent);
        setShowDeleteModal(true);
      },
      variant: "destructive",
    },
  ];

  const handleBulkActivate = async () => {
    try {
      const agentIds = selectedAgents.map(a => a.id);
      await bulkUpdateAgentStatus(agentIds, true);
      setSelectedAgents([]);
      toast.success(`${agentIds.length} agents activated successfully`);
    } catch (error) {
      toast.error("Failed to activate agents");
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      const agentIds = selectedAgents.map(a => a.id);
      await bulkUpdateAgentStatus(agentIds, false);
      setSelectedAgents([]);
      toast.success(`${agentIds.length} agents deactivated successfully`);
    } catch (error) {
      toast.error("Failed to deactivate agents");
    }
  };

  const handleEditAgent = async (agentId: string, data: any) => {
    try {
      await updateAgent(agentId, data);
      setShowEditModal(false);
      setSelectedAgent(null);
      toast.success("Agent updated successfully");
    } catch (error) {
      toast.error("Failed to update agent");
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchAgents}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Agents</h1>
            <p className="text-muted-foreground">
              Manage your support agents and their assignments
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <FilterBar
            searchValue={filters.search}
            onSearchChange={(value) => setFilters({ search: value })}
            searchPlaceholder="Search agents by name, email, or tags..."
            filterGroups={filterGroups}
            selectedFilters={selectedFilters}
            onFiltersChange={handleFiltersChange}
            compact
          />
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedAgents.length > 0 && (
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                {selectedAgents.length} agent{selectedAgents.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkActivate}
                  className="flex-1 sm:flex-none"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeactivate}
                  className="flex-1 sm:flex-none"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agents Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={paginatedAgents}
            columns={columns}
            loading={loading}
            responsive={true}
            selectable
            selectedRows={selectedAgents}
            onSelectionChange={setSelectedAgents}
            sortBy={sort.field}
            sortDirection={sort.direction}
            onSort={(field, direction) => {
              if (direction) {
                setSort({ field: field as keyof Agent, direction });
              }
            }}
            pagination={{
              page: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onPageChange: (page) => setPagination({ page }),
              onPageSizeChange: (pageSize) => setPagination({ pageSize, page: 1 }),
            }}
            rowActions={rowActions}
            emptyMessage="No agents found"
            onRowClick={(agent) => navigate(`/agents/${agent.id}`)}
            getRowId={(agent) => agent.id}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateAgentModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      
      <EditAgentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAgent(null);
        }}
        onConfirm={handleEditAgent}
        agent={selectedAgent}
      />
      
      <DeleteAgentModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAgent(null);
        }}
        onConfirm={async (agentId: string) => {
          await deleteAgent(agentId);
          setShowDeleteModal(false);
          setSelectedAgent(null);
          toast.success("Agent deleted successfully");
        }}
        agent={selectedAgent}
      />
    </div>
  );
}