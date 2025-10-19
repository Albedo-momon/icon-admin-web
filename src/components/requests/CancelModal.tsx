import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, comment?: string) => Promise<void>;
  request: { id: string };
}

const cancelReasons = [
  { value: "customer_request", label: "Customer Request" },
  { value: "duplicate_request", label: "Duplicate Request" },
  { value: "invalid_request", label: "Invalid Request" },
  { value: "no_agent_available", label: "No Agent Available" },
  { value: "technical_issue", label: "Technical Issue" },
  { value: "outside_service_area", label: "Outside Service Area" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "other", label: "Other" },
];

export default function CancelModal({
  isOpen,
  onClose,
  onConfirm,
  request,
}: CancelModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleCancel = async () => {
    if (!selectedReason) return;

    setIsLoading(true);
    try {
      await onConfirm(selectedReason, comment || undefined);
      toast({
        title: "Request Cancelled",
        description: `Request ${request.id} has been cancelled successfully.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason("");
      setComment("");
    }
  }, [isOpen]);
  
  const selectedReasonLabel = cancelReasons.find(r => r.value === selectedReason)?.label;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Request
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel request {request.id}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason for cancellation" />
              </SelectTrigger>
              <SelectContent>
                {cancelReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Additional Comments */}
          <div className="space-y-2">
            <Label htmlFor="comment">Additional Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Provide additional details about the cancellation..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          
          {/* Confirmation Summary */}
          {selectedReason && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Cancellation Summary:
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Request {requestId} will be cancelled due to: <strong>{selectedReasonLabel}</strong>
              </p>
              {comment && (
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Comment: {comment}
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel} 
            disabled={!selectedReason || isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Cancelling...
              </>
            ) : (
              "Cancel Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}