import { KPICard } from "@/components/dashboard/KPICard";
import { SLAComplianceChart } from "@/components/dashboard/SLAComplianceChart";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { RequestsOverTimeChart } from "@/components/dashboard/RequestsOverTimeChart";
import { TypeSwitch } from "@/components/dashboard/TypeSwitch";
import { StatusMicroChips } from "@/components/dashboard/StatusMicroChips";
import { AttentionNeededCard } from "@/components/dashboard/AttentionNeededCard";
import { useDashboardStore } from "@/stores/dashboardStore";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  UserCheck,
  Star,
  Gift
} from "lucide-react";

export default function Dashboard() {
  const { counts, selectedType } = useDashboardStore();

  const kpiData = [
    {
      title: "Open Requests",
      value: counts.open.total,
      change: "+12% from last month",
      isPositive: true,
      icon: Users,
      iconBgColor: "bg-blue-500",
      tooltip: {
        title: "Breakdown by Type",
        items: [
          { label: "In-House", value: counts.open.byType.IN_HOUSE, color: "#3b82f6" },
          { label: "In-Shop", value: counts.open.byType.IN_SHOP, color: "#10b981" },
          { label: "PC Build", value: counts.open.byType.PC_BUILD, color: "#8b5cf6" }
        ]
      }
    },
    {
      title: "Completed Today",
      value: counts.completedToday,
      change: "+8% from yesterday",
      isPositive: true,
      icon: CheckCircle,
      iconBgColor: "bg-green-500"
    },
    {
      title: "Cancelled",
      value: counts.cancelled.total,
      change: "-3% from last month",
      isPositive: true,
      icon: XCircle,
      iconBgColor: "bg-red-500",
      tooltip: {
        title: "Cancelled by Actor",
        items: [
          { label: "User", value: counts.cancelled.byActor.user, color: "#ef4444" },
          { label: "Agent", value: counts.cancelled.byActor.agent, color: "#f97316" },
          { label: "Admin", value: counts.cancelled.byActor.admin, color: "#dc2626" }
        ]
      }
    },
    {
      title: "Agents Active",
      value: `${counts.agents.active}/${counts.agents.total}`,
      change: "+2 from yesterday",
      isPositive: true,
      icon: UserCheck,
      iconBgColor: "bg-purple-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Type Switch */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your requests.
          </p>
        </div>
        
        {/* Type Switch and Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          <TypeSwitch />
          <div className="text-sm text-muted-foreground">|</div>
          <div className="text-sm font-medium text-muted-foreground">Quick Filters:</div>
          {/* Existing date range and search filters would go here */}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpiData.map((kpi, index) => (
              <KPICard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                isPositive={kpi.isPositive}
                icon={kpi.icon}
                iconBgColor={kpi.iconBgColor}
                tooltip={kpi.tooltip}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
        
        {/* Attention Needed Card */}
        <div className="lg:col-span-1">
          <AttentionNeededCard />
        </div>
      </div>



      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RequestsOverTimeChart />
        <SLAComplianceChart />
      </div>
      
      {/* Bottom Chart */}
      <div className="grid grid-cols-1 gap-6">
        <QuickStats />
      </div>
    </div>
  );
}
