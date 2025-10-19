import { cn } from "@/lib/utils";
import { useDashboardStore, type RequestType } from "@/stores/dashboardStore";

const typeOptions = [
  { value: "ALL" as const, label: "All" },
  { value: "IN_HOUSE" as RequestType, label: "In-House" },
  { value: "IN_SHOP" as RequestType, label: "In-Shop" },
  { value: "PC_BUILD" as RequestType, label: "PC Build" }
];

export function TypeSwitch() {
  const { selectedType, setSelectedType } = useDashboardStore();

  return (
    <div 
      className="inline-flex items-center rounded-lg bg-muted p-1"
      role="tablist"
      aria-label="Request type filter"
    >
      {typeOptions.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={selectedType === option.value}
          aria-controls={`panel-${option.value}`}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            selectedType === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setSelectedType(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}