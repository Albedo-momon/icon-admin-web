import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useDashboardStore } from "@/stores/dashboardStore";

export function RequestsOverTimeChart() {
  const { timeSeries, selectedType } = useDashboardStore();

  // Filter and format data based on selected type
  const chartData = timeSeries.map(point => {
    const formattedDate = new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return {
      date: formattedDate,
      "In-House": point.inHouse,
      "In-Shop": point.inShop,
      "PC Build": point.pcBuild
    };
  });

  // Determine which lines to show based on selected type
  const getVisibleSeries = () => {
    if (selectedType === "ALL") {
      return ["In-House", "In-Shop", "PC Build"];
    } else {
      const typeMap = {
        "IN_HOUSE": "In-House",
        "IN_SHOP": "In-Shop", 
        "PC_BUILD": "PC Build"
      };
      return [typeMap[selectedType as keyof typeof typeMap]];
    }
  };

  const visibleSeries = getVisibleSeries();
  const hasData = chartData.some(point => 
    visibleSeries.some(series => (point[series as keyof typeof point] as number) > 0)
  );

  const seriesColors = {
    "In-House": "#3b82f6",
    "In-Shop": "#10b981", 
    "PC Build": "#8b5cf6"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Requests Over Time</h3>
        {hasData ? (
          <div className="w-full aspect-[16/9] md:aspect-[4/3]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  className="text-sm md:text-xs"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-sm md:text-xs"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: window.innerWidth < 768 ? '12px' : '14px'
                  }}
                />
              {visibleSeries.length > 1 && (
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  iconType="line"
                />
              )}
              {visibleSeries.map((series) => (
                <Line
                  key={series}
                  type="monotone"
                  dataKey={series}
                  stroke={seriesColors[series as keyof typeof seriesColors]}
                  strokeWidth={2}
                  dot={{ fill: seriesColors[series as keyof typeof seriesColors], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: seriesColors[series as keyof typeof seriesColors], strokeWidth: 2 }}
                />
              ))}
            </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center aspect-[16/9] md:aspect-[4/3] text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm">No data for current filters</p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}