import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDashboardStore, type RequestStatus } from "@/stores/dashboardStore";

const statusOptions: { value: RequestStatus; label: string; variant: "default" | "secondary" | "destructive" | "outline" }[] = [
  { value: "PENDING", label: "Pending", variant: "outline" },
  { value: "ACCEPTED", label: "Accepted", variant: "default" },
  { value: "IN_PROGRESS", label: "In Progress", variant: "secondary" },
  { value: "COMPLETED", label: "Completed", variant: "secondary" },
  { value: "CANCELLED", label: "Cancelled", variant: "destructive" }
];

// Mock counts for each status (would come from store in real implementation)
const getStatusCount = (status: RequestStatus, selectedType: string): number => {
  const baseCounts = {
    PENDING: 24,
    ACCEPTED: 18,
    IN_PROGRESS: 45,
    COMPLETED: 89,
    CANCELLED: 12
  };
  
  // Adjust counts based on selected type
  const multiplier = selectedType === "ALL" ? 1 : 
                    selectedType === "IN_HOUSE" ? 0.43 :
                    selectedType === "IN_SHOP" ? 0.29 : 0.28;
  
  return Math.round(baseCounts[status] * multiplier);
};

export function StatusMicroChips() {
  const { selectedStatuses, selectedType, toggleStatus } = useDashboardStore();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {statusOptions.map((status) => {
        const isSelected = selectedStatuses.includes(status.value);
        const count = getStatusCount(status.value, selectedType);
        
        return (
          <button
            key={status.value}
            onClick={() => toggleStatus(status.value)}
            className={cn(
              "transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full",
              isSelected && "ring-2 ring-primary ring-offset-2"
            )}
            aria-pressed={isSelected}
            aria-label={`Filter by ${status.label} status. Current count: ${count}`}
          >
            <Badge
              variant={isSelected ? "default" : status.variant}
              className={cn(
                "cursor-pointer text-xs px-2 py-1 font-medium",
                isSelected && "bg-primary text-primary-foreground shadow-md",
                !isSelected && "hover:bg-muted-foreground/10"
              )}
            >
              {status.label}
              <span className="ml-1 text-xs opacity-75">
                {count}
              </span>
            </Badge>
          </button>
        );
      })}
    </div>
  );
}