import { Users, Headphones, Clock, CheckCircle } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { SLAComplianceChart } from "@/components/dashboard/SLAComplianceChart";
import { QuickStats } from "@/components/dashboard/QuickStats";

const kpiData = [
  {
    title: "Total Users",
    value: 2847,
    change: "12% vs last month",
    isPositive: true,
    icon: Users,
    iconBgColor: "bg-primary",
    delay: 0,
  },
  {
    title: "Active Agents",
    value: 156,
    change: "8% vs last month",
    isPositive: true,
    icon: Headphones,
    iconBgColor: "bg-success",
    delay: 0.1,
  },
  {
    title: "Pending Requests",
    value: 24,
    change: "5% vs last month",
    isPositive: false,
    icon: Clock,
    iconBgColor: "bg-warning",
    delay: 0.2,
  },
  {
    title: "Resolved Today",
    value: 89,
    change: "18% vs last month",
    isPositive: true,
    icon: CheckCircle,
    iconBgColor: "bg-chart-5",
    delay: 0.3,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SLAComplianceChart />
        <QuickStats />
      </div>
    </div>
  );
}
