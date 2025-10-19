import { useState, useEffect } from "react";
import { Settings, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { type PrimaryStatus, type JobType } from "@/stores/requestsStore";
import { cn } from "@/lib/utils";

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStatus: PrimaryStatus, comment?: string) => Promise<void>;
  request: { id: string; primaryStatus: PrimaryStatus; jobType: JobType };
}

// Status flow definitions for each job type
const statusFlows: Record<JobType, { status: PrimaryStatus; label: string; description: string }[]> = {
  IN_HOUSE: [
    { status: "PENDING", label: "Pending", description: "Request raised, waiting for agent assignment" },
    { status: "ACCEPTED", label: "Accepted", description: "Agent assigned and en route" },
    { status: "IN_PROGRESS", label: "In Progress", description: "Agent on-site, diagnosis or repair in progress" },
    { status: "COMPLETED", label: "Completed", description: "Service completed successfully" },
    { status: "CANCELLED", label: "Cancelled", description: "Request cancelled" },
  ],
  IN_SHOP: [
    { status: "PENDING", label: "Pending", description: "Request raised, waiting for acceptance" },
    { status: "ACCEPTED", label: "Accepted", description: "Device received at shop" },
    { status: "IN_PROGRESS", label: "In Progress", description: "Diagnosis or repair in progress" },
    { status: "COMPLETED", label: "Completed", description: "Service completed, ready for pickup" },
    { status: "CANCELLED", label: "Cancelled", description: "Request cancelled" },
  ],
  PC_BUILD: [
    { status: "PENDING", label: "Pending", description: "Build request raised" },
    { status: "ACCEPTED", label: "Accepted", description: "Build specifications confirmed" },
    { status: "IN_PROGRESS", label: "In Progress", description: "PC build and testing in progress" },
    { status: "COMPLETED", label: "Completed", description: "PC build completed and delivered" },
    { status: "CANCELLED", label: "Cancelled", description: "Build request cancelled" },
  ],
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

export default function ChangeStatusModal({
  isOpen,
  onClose,
  onConfirm,
  request,
}: ChangeStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<PrimaryStatus>(request.primaryStatus);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const availableStatuses = statusFlows[request.jobType];
  const selectedStatusInfo = availableStatuses.find(s => s.status === selectedStatus);
  const currentStatusInfo = availableStatuses.find(s => s.status === request.primaryStatus);
  
  const handleStatusChange = async () => {
    if (selectedStatus === request.primaryStatus) return;

    setIsLoading(true);
    try {
      await onConfirm(selectedStatus, comment || undefined);
      toast({
        title: "Status Updated",
        description: `Request ${request.id} status changed to ${selectedStatusInfo?.label}`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(request.primaryStatus);
      setComment("");
    }
  }, [isOpen, request.primaryStatus]);
  
  const isStatusChange = selectedStatus !== request.primaryStatus;
  const isDestructive = selectedStatus === "CANCELLED";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Change Request Status
          </DialogTitle>
          <DialogDescription>
            Update the status of request {request.id}. Choose the appropriate status based on the current progress.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Status */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Status</span>
              <StatusBadge status={request.primaryStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {currentStatusInfo?.description}
            </p>
          </div>
          
          {/* New Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as PrimaryStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem 
                    key={status.status} 
                    value={status.status}
                    disabled={status.status === request.primaryStatus}
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge status={status.status} />
                      <span>{status.label}</span>
                      {status.status === request.primaryStatus && (
                        <span className="text-xs text-muted-foreground">(current)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedStatusInfo && selectedStatus !== request.primaryStatus && (
              <p className="text-sm text-muted-foreground">
                {selectedStatusInfo.description}
              </p>
            )}
          </div>
          
          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              Status Change Comment {isStatusChange && "(Recommended)"}
            </Label>
            <Textarea
              id="comment"
              placeholder="Provide details about this status change..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          
          {/* Warning for destructive changes */}
          {isDestructive && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Warning: Destructive Action</p>
                <p className="text-muted-foreground">
                  Cancelling this request cannot be undone. Please ensure this is the correct action.
                </p>
              </div>
            </div>
          )}
          
          {/* Change Summary */}
          {isStatusChange && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Status Change Summary:
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <StatusBadge status={request.primaryStatus} />
                <span>→</span>
                <StatusBadge status={selectedStatus} />
              </div>
              {comment && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  Comment: {comment}
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleStatusChange}
            disabled={!isStatusChange || isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}