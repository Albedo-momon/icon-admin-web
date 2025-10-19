import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { useDashboardStore } from "@/stores/dashboardStore";

export function SLAComplianceChart() {
  const { typeSplit, selectedType } = useDashboardStore();

  // Convert type split data to chart format
  const data = [
    { 
      name: "In-House", 
      value: typeSplit.inHouse, 
      color: "#3b82f6" 
    },
    { 
      name: "In-Shop", 
      value: typeSplit.inShop, 
      color: "#10b981" 
    },
    { 
      name: "PC Build", 
      value: typeSplit.pcBuild, 
      color: "#8b5cf6" 
    },
  ].filter(item => selectedType === "ALL" || item.name.replace("-", "_").toUpperCase() === selectedType);

  const hasData = data.some(item => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Request Type Split</h3>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="square"
                formatter={(value) => (
                  <span className="text-sm font-medium">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium">No data for current filters</p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
