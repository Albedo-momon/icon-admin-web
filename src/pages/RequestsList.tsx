import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal,
  Eye,
  UserCheck,
  X,
  Calendar,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRequestsStore, type JobType, type PrimaryStatus, type RequestRow } from "@/stores/requestsStore";
import ReassignModal from "@/components/requests/ReassignModal";
import CancelModal from "@/components/requests/CancelModal";
import { FilterBar } from "@/components/ui/FilterBar";
import { Chip, StatusChip, ChipGroup } from "@/components/ui/Chips";
import { DataTable } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";

// Type switch component using new Chips
const TypeSwitch = () => {
  const { filters, setFilters } = useRequestsStore();
  
  const options = [
    { value: "ALL", label: "All" },
    { value: "IN_HOUSE", label: "In-House" },
    { value: "IN_SHOP", label: "In-Shop" },
    { value: "PC_BUILD", label: "PC Build" },
  ];
  
  return (
    <ChipGroup
      value={filters.type}
      onValueChange={(value) => setFilters({ type: value as JobType | "ALL" })}
      className="flex-wrap"
      aria-label="Filter by request type"
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          value={option.value}
          variant={filters.type === option.value ? "default" : "outline"}
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
    { value: "ALL", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "ACCEPTED", label: "Accepted" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ] as const;
  
  return (
    <ChipGroup
      value={filters.status}
      onValueChange={(value) => setFilters({ status: value as PrimaryStatus | "ALL" })}
      className="flex-wrap"
      aria-label="Filter by request status"
    >
      {statuses.map((status) => (
        <StatusChip
          key={status.value}
          value={status.value}
          status={status.value === "ALL" ? "PENDING" : status.value as PrimaryStatus}
          variant={filters.status === status.value ? "default" : "outline"}
        >
          {status.label}
        </StatusChip>
      ))}
    </ChipGroup>
  );
};

// Job type badge component
const JobTypeBadge = ({ type }: { type: JobType }) => {
  const variants = {
    IN_HOUSE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    IN_SHOP: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    PC_BUILD: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
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

// Table row actions component with improved accessibility
const RowActions = ({ 
  request, 
  onReassign, 
  onCancel 
}: { 
  request: RequestRow;
  onReassign: (request: RequestRow) => void;
  onCancel: (request: RequestRow) => void;
}) => {
  const navigate = useNavigate();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          aria-label={`Actions for request ${request.id}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(`/requests/${request.id}`)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onReassign(request)}
          className="flex items-center gap-2"
        >
          <UserCheck className="h-4 w-4" />
          Reassign
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onCancel(request)}
          className="flex items-center gap-2 text-destructive"
        >
          <X className="h-4 w-4" />
          Cancel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Sortable table header component
const SortableHeader = ({ 
  field, 
  children, 
  className 
}: { 
  field: keyof RequestRow; 
  children: React.ReactNode;
  className?: string;
}) => {
  const { sort, setSort } = useRequestsStore();
  
  const handleSort = () => {
    if (sort.field === field) {
      setSort({ field, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      setSort({ field, direction: "asc" });
    }
  };
  
  return (
    <TableHead 
      className={cn("cursor-pointer select-none hover:bg-muted/50", className)}
      onClick={handleSort}
    >
      <div className="flex items-center gap-2">
        {children}
        {sort.field === field && (
          sort.direction === "asc" ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  );
};

// Pagination component
const Pagination = () => {
  const { pagination, setPagination } = useRequestsStore();
  
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.total);
  
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {pagination.total} requests
      </div>
      
      <div className="flex items-center gap-2">
        <Select
          value={pagination.pageSize.toString()}
          onValueChange={(value) => setPagination({ pageSize: parseInt(value), page: 1 })}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={pagination.page === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPagination({ page })}
                  className="w-8"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ page: pagination.page + 1 })}
            disabled={pagination.page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
      <Search className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">No requests found</h3>
    <p className="text-muted-foreground mb-4">
      Try adjusting your filters or search terms
    </p>
    <Button variant="outline" onClick={() => useRequestsStore.getState().setFilters({ type: "ALL", status: "ALL", search: "" })}>
      Clear Filters
    </Button>
  </div>
);

// Main component
export default function RequestsList() {
  const navigate = useNavigate();
  const { 
    requests, 
    filters, 
    setFilters, 
    isLoading, 
    error, 
    loadRequests,
    pagination 
  } = useRequestsStore();
  
  const [searchInput, setSearchInput] = useState(filters.search);
  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchInput });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchInput, setFilters]);
  
  // Action handlers
  const { reassignRequest, cancelRequest } = useRequestsStore();
  
  const handleReassign = (request: RequestRow) => {
    setSelectedRequest(request);
    setShowReassignModal(true);
  };

  const handleCancel = (request: RequestRow) => {
    setSelectedRequest(request);
    setShowCancelModal(true);
  };

  const handleReassignConfirm = async (agentId: string) => {
    if (selectedRequest) {
      await reassignRequest(selectedRequest.id, agentId);
      setShowReassignModal(false);
      setSelectedRequest(null);
    }
  };

  const handleCancelConfirm = async (reason: string, comment?: string) => {
    if (selectedRequest) {
      await cancelRequest(selectedRequest.id, reason, comment);
      setShowCancelModal(false);
      setSelectedRequest(null);
    }
  };

  // Load requests on mount
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);
  
  const handleRowClick = (request: RequestRow) => {
    navigate(`/requests/${request.id}`);
  };
  
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
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
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
          
          {/* Search and Date Range */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by Booking ID, user, or agent..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Select dates
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Loading requests..." />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-center">
              <div>
                <p className="text-red-600 font-medium mb-2">Error loading requests</p>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => loadRequests()}>Try Again</Button>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader field="id">Booking ID</SortableHeader>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <SortableHeader field="user">User</SortableHeader>
                    <TableHead>Agent</TableHead>
                    <SortableHeader field="createdAt">Created At</SortableHeader>
                    <SortableHeader field="updatedAt">Last Update</SortableHeader>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(request)}
                    >
                      <TableCell className="font-medium">
                        <button className="text-primary hover:underline">
                          {request.id}
                        </button>
                      </TableCell>
                      <TableCell>
                        <JobTypeBadge type={request.jobType} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={request.primaryStatus} />
                      </TableCell>
                      <TableCell>{request.user.name}</TableCell>
                      <TableCell>
                        {request.agent ? (
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
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(request.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <RowActions 
                          request={request} 
                          onReassign={handleReassign}
                          onCancel={handleCancel}
                        />
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="border-t p-4">
                <Pagination />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Modals */}
      {selectedRequest && (
        <>
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
        </>
      )}
    </div>
  );
}