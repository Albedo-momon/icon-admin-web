import { useEffect, useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DataTable, type Column, type RowAction } from "@/components/ui/DataTable";
import { useRequestsStore, type JobType, type PrimaryStatus, type RequestRow } from "@/stores/requestsStore";
import { Chip, ChipGroup } from "@/components/ui/Chips";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "../components/ui/DateRangePicker";
import type { DateRange } from "react-day-picker";

// Lazy load modal components for better performance
const ReassignModal = lazy(() => import("@/components/requests/ReassignModal"));
const CancelModal = lazy(() => import("@/components/requests/CancelModal"));

// Type switch component using new Chips
const TypeSwitch = () => {
  const { filters, setFilters } = useRequestsStore();
  
  const options = [
    { value: "ALL", label: "All", variant: "outline" as const },
    { value: "IN_HOUSE", label: "In-House", variant: "secondary" as const },
    { value: "IN_SHOP", label: "In-Shop", variant: "success" as const },
    { value: "PC_BUILD", label: "PC Build", variant: "warning" as const },
  ];
  
  return (
    <ChipGroup
      className="flex-wrap"
      aria-label="Filter by request type"
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          variant={filters.type === option.value ? "default" : option.variant}
          onClick={() => setFilters({ type: option.value as JobType | "ALL" })}
        >
          {option.label}
        </Chip>
      ))}
    </ChipGroup>
  );
};

// Status chips component using new StatusChip
const StatusChips = () => {
  const { filters, setFilters } = useRequestsStore();
  
  const statuses = [
    { value: "ALL", label: "All", variant: "outline" as const },
    { value: "PENDING", label: "Pending", variant: "warning" as const },
    { value: "ACCEPTED", label: "Accepted", variant: "secondary" as const },
    { value: "IN_PROGRESS", label: "In Progress", variant: "secondary" as const },
    { value: "COMPLETED", label: "Completed", variant: "success" as const },
    { value: "CANCELLED", label: "Cancelled", variant: "destructive" as const },
  ] as const;
  
  return (
    <ChipGroup
      className="flex-wrap"
      aria-label="Filter by request status"
    >
      {statuses.map((status) => (
        <Chip
          key={status.value}
          variant={filters.status === status.value ? "default" : status.variant}
          onClick={() => setFilters({ status: status.value as PrimaryStatus | "ALL" })}
        >
          {status.label}
        </Chip>
      ))}
    </ChipGroup>
  );
};

// Job type badge component
export const JobTypeBadge = ({ type }: { type: JobType }) => {
  const variants = {
    IN_HOUSE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    IN_SHOP: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    PC_BUILD: "bg-purple-700 text-white hover:bg-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };
  
  const labels = {
    IN_HOUSE: "In-House",
    IN_SHOP: "In-Shop", 
    PC_BUILD: "PC Build",
  };
  
  return (
    <Badge className={cn("font-medium", variants[type])}>
      {labels[type]}
    </Badge>
  );
};

// Status badge component
const StatusBadge = ({ status }: { status: PrimaryStatus }) => {
  const variants = {
    PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    ACCEPTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  
  return (
    <Badge className={cn("font-medium", variants[status])}>
      {status.toLowerCase().replace('_', ' ')}
    </Badge>
  );
};





// Main component
export default function RequestsList() {
  const navigate = useNavigate();
  const { 
    requests, 
    filters, 
    setFilters, 
    isLoading, 
    // error, // Commented out unused variable
    loadRequests,
    sort,
    setSort,
    pagination,
    setPagination
  } = useRequestsStore();
  
  const [searchInput, setSearchInput] = useState(filters.search);
  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Table columns
  const columns: Column<RequestRow>[] = [
    {
      key: "id",
      header: "BOOKING ID",
      sortable: true,
      render: (_, request) => (
        <button className="text-primary hover:underline font-medium">
          {request.id}
        </button>
      ),
    },
    {
      key: "jobType",
      header: "TYPE",
      render: (_, request) => <JobTypeBadge type={request.jobType} />,
    },
    {
      key: "primaryStatus",
      header: "STATUS",
      render: (_, request) => <StatusBadge status={request.primaryStatus} />,
    },
    {
      key: "user",
      header: "USER",
      sortable: true,
      render: (_, request) => request.user.name,
    },
    {
      key: "agent",
      header: "AGENT",
      hideOnMobile: true,
      mobileLabel: "Agent",
      render: (_, request) => (
        request.agent ? (
          <div className="flex items-center gap-2">
            <span>{request.agent.name}</span>
            <Badge 
              variant={request.agent.status === "FREE" ? "outline" : "secondary"}
              className="text-xs"
            >
              {request.agent.status}
            </Badge>
          </div>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )
      ),
    },
    {
      key: "createdAt",
      header: "CREATED AT",
      sortable: true,
      hideOnMobile: true,
      mobileLabel: "Created",
      render: (_, request) => new Date(request.createdAt).toLocaleDateString(),
    },
    {
      key: "updatedAt",
      header: "LAST UPDATE",
      sortable: true,
      hideOnMobile: true,
      mobileLabel: "Updated",
      render: (_, request) => new Date(request.updatedAt).toLocaleDateString(),
    },
  ];

  // Row actions
  const rowActions: RowAction<RequestRow>[] = [
    {
      label: "View Details",
      onClick: (request) => navigate(`/requests/${request.id}`),
    },
    {
      label: "Reassign",
      onClick: (request) => {
        setSelectedRequest(request);
        setShowReassignModal(true);
      },
    },
    {
      label: "Cancel",
      onClick: (request) => {
        setSelectedRequest(request);
        setShowCancelModal(true);
      },
      variant: "destructive",
    },
  ];
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchInput });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchInput, setFilters]);
  
  // Date range effect - update filters when date range changes
  useEffect(() => {
    if (dateRange?.from || dateRange?.to) {
      setFilters({ dateRange });
    } else if (dateRange !== undefined) {
      // Clear date range filter when dateRange is explicitly set to empty object or similar
      setFilters({ dateRange: undefined });
    } else {
      // Clear date range filter when dateRange is undefined
      setFilters({ dateRange: undefined });
    }
  }, [dateRange, setFilters]);
  
  // Action handlers
  const { reassignRequest, cancelRequest } = useRequestsStore();
  
  // Commented out unused functions
  // const handleReassign = (request: RequestRow) => {
  //   setSelectedRequest(request);
  //   setShowReassignModal(true);
  // };
  
  // const handleCancel = (request: RequestRow) => {
  //   setSelectedRequest(request);
  //   setShowCancelModal(true);
  // };

  const handleReassignConfirm = async (agentId: string) => {
    if (selectedRequest) {
      await reassignRequest(selectedRequest.id, agentId);
      setShowReassignModal(false);
      setSelectedRequest(null);
    }
  };

  const handleCancelConfirm = async (reason: string) => {
    if (selectedRequest) {
      await cancelRequest(selectedRequest.id, reason);
      setShowCancelModal(false);
      setSelectedRequest(null);
    }
  };

  // Load requests on mount
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);
  
  // Commented out unused function
  // const handleRowClick = (request: RequestRow) => {
  //   navigate(`/requests/${request.id}`);
  // };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            Manage and track customer service requests
          </p>
        </div>
        <Button onClick={() => loadRequests()} disabled={isLoading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type Switch */}
          <div>
            <label className="text-sm font-medium mb-2 block">Request Type</label>
            <TypeSwitch />
          </div>
          
          {/* Status Chips */}
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <StatusChips />
          </div>
          
          {/* Search and Date Range - Responsive Layout */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by Booking ID, user, or agent..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select date range"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={requests}
            columns={columns}
            loading={isLoading}
            responsive={true}
            sortBy={sort.field}
            sortDirection={sort.direction}
            onSort={(field, direction) => {
              if (direction) {
                setSort({ field: field as keyof RequestRow, direction });
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
            emptyMessage="No requests found"
            onRowClick={(request) => navigate(`/requests/${request.id}`)}
            getRowId={(request) => request.id}
          />
        </CardContent>
      </Card>

      {/* Action Modals */}
      {selectedRequest && (
        <Suspense fallback={<LoadingSpinner size="sm" />}>
          <ReassignModal
            isOpen={showReassignModal}
            onClose={() => {
              setShowReassignModal(false);
              setSelectedRequest(null);
            }}
            onConfirm={handleReassignConfirm}
            request={selectedRequest}
          />
          <CancelModal
            isOpen={showCancelModal}
            onClose={() => {
              setShowCancelModal(false);
              setSelectedRequest(null);
            }}
            onConfirm={handleCancelConfirm}
            request={selectedRequest}
          />
        </Suspense>
      )}
    </div>
  );
}