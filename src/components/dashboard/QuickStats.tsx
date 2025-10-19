import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDashboardStore } from "@/stores/dashboardStore";

export function QuickStats() {
  const { counts } = useDashboardStore();

  const utilizationData = [
    {
      name: "Free",
      value: counts.agents.utilization.free,
      color: "#10b981"
    },
    {
      name: "Busy", 
      value: counts.agents.utilization.busy,
      color: "#f59e0b"
    }
  ];

  // Mock top 3 busiest agents for tooltip
  const topAgents = [
    { name: "Agent Smith", requests: 12 },
    { name: "Agent Johnson", requests: 9 },
    { name: "Agent Williams", requests: 7 }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label}: ${data.value} agents`}</p>
          {label === "Busy" && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-sm font-medium mb-1">Top 3 Busiest:</p>
              {topAgents.map((agent, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  {agent.name}: {agent.requests} requests
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="w-[800px] p-6">
        <h3 className="text-xl font-semibold mb-6">Agent Utilization</h3>
        <div className="flex justify-center">
          <div className="w-full max-w-lg">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={utilizationData}
                margin={{
                  top: 20,
                  right: 50,
                  left: 50,
                  bottom: 20,
                }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  className="text-sm"
                  tick={{ fontSize: 13 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-sm"
                  tick={{ fontSize: 13 }}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={100}
                >
                  {utilizationData.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {counts.agents.utilization.free}
              </div>
              <div className="text-sm text-muted-foreground">Free Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {counts.agents.utilization.busy}
              </div>
              <div className="text-sm text-muted-foreground">Busy Agents</div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
