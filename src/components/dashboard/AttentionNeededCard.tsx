import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Clock, Wrench } from "lucide-react";
import { useDashboardStore, type AttentionItem } from "@/stores/dashboardStore";
import { cn } from "@/lib/utils";

const reasonIcons = {
  PC_BUILD_STALLED: Wrench,
  ETA_OVERDUE: Clock,
  DIAGNOSIS_DELAY: AlertTriangle
};

const reasonLabels = {
  PC_BUILD_STALLED: "Stalled PC Builds",
  ETA_OVERDUE: "Overdue ETA",
  DIAGNOSIS_DELAY: "Diagnosis taking too long"
};

const getTypeColor = (type: AttentionItem["type"]) => {
  switch (type) {
    case "IN_HOUSE": return "bg-blue-100 text-blue-800 border-blue-200";
    case "IN_SHOP": return "bg-green-100 text-green-800 border-green-200";
    case "PC_BUILD": return "bg-purple-100 text-purple-800 border-purple-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatAge = (ageMinutes: number): string => {
  if (ageMinutes < 60) return `${ageMinutes}m`;
  const hours = Math.floor(ageMinutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

export function AttentionNeededCard() {
  const { attentionItems } = useDashboardStore();

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Attention Needed
          {attentionItems.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {attentionItems.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {attentionItems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-sm font-medium">All good</p>
          </div>
        ) : (
          <ScrollArea className="h-[225px] pr-4">
            <div className="space-y-3">
              {attentionItems.map((item) => {
                const IconComponent = reasonIcons[item.reason];
                return (
                  <div
                    key={item.bookingId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {item.bookingId}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs px-2 py-0", getTypeColor(item.type))}
                          >
                            {item.type.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatAge(item.ageMinutes)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {reasonLabels[item.reason]}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2 text-xs px-3 py-1 h-7"
                      onClick={() => window.open(item.href, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}