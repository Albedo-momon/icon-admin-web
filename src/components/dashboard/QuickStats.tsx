import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

const stats = [
  { label: "Average Response Time", value: "4.2 hrs", isLink: false },
  { label: "Customer Satisfaction", value: "4.8/5.0", isLink: false },
  { label: "Active Products", value: "142", isLink: true },
  { label: "Pending Offers", value: "8", isLink: true },
];

export function QuickStats() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Quick Stats</h3>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
            >
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span
                className={
                  stat.isLink
                    ? "text-lg font-semibold text-primary cursor-pointer hover:underline"
                    : "text-lg font-semibold text-foreground"
                }
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
