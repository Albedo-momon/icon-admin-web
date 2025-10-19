import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  iconBgColor: string;
  delay?: number;
  tooltip?: {
    title: string;
    items: Array<{ label: string; value: number; color?: string }>;
  };
}

export function KPICard({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  iconBgColor,
  delay = 0,
  tooltip,
}: KPICardProps) {
  const cardContent = (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <h3 className="text-4xl font-bold text-foreground">{value.toLocaleString()}</h3>
          <p
            className={cn(
              "text-sm font-medium",
              isPositive ? "text-success" : "text-destructive"
            )}
          >
            {isPositive ? "↑" : "↓"} {change}
          </p>
        </div>
        <div className={cn("p-3 rounded-xl", iconBgColor)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {tooltip ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {cardContent}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-3 max-w-xs">
              <div className="space-y-2">
                <p className="font-semibold text-sm">{tooltip.title}</p>
                <div className="space-y-1">
                  {tooltip.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {item.color && (
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                        <span>{item.label}</span>
                      </div>
                      <span className="font-medium">{(item.value || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        cardContent
      )}
    </motion.div>
  );
}
