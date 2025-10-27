import { Suspense, lazy } from "react";
import { KPICard } from "@/components/dashboard/KPICard";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { TypeSwitch } from "@/components/dashboard/TypeSwitch";
import { AttentionNeededCard } from "@/components/dashboard/AttentionNeededCard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useDashboardStore } from "@/stores/dashboardStore";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  UserCheck
} from "lucide-react";

// Lazy load chart components for better performance
const SLAComplianceChart = lazy(() => import("@/components/dashboard/SLAComplianceChart").then(module => ({ default: module.SLAComplianceChart })));
const RequestsOverTimeChart = lazy(() => import("@/components/dashboard/RequestsOverTimeChart").then(module => ({ default: module.RequestsOverTimeChart })));

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
      tooltip: selectedType === "ALL" ? {
        title: "Breakdown by Type",
        items: [
          { label: "In-House", value: counts.open.byType.IN_HOUSE, color: "#3b82f6" },
          { label: "In-Shop", value: counts.open.byType.IN_SHOP, color: "#10b981" },
          { label: "PC Build", value: counts.open.byType.PC_BUILD, color: "#8b5cf6" }
        ]
      } : undefined
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
      tooltip: selectedType === "ALL" ? {
        title: "Cancelled by Actor",
        items: [
          { label: "User", value: counts.cancelled.byActor.user, color: "#ef4444" },
          { label: "Agent", value: counts.cancelled.byActor.agent, color: "#f97316" },
          { label: "Admin", value: counts.cancelled.byActor.admin, color: "#dc2626" }
        ]
      } : undefined
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
          <h1 className="text-3xl lg:text-3xl md:text-2xl sm:text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-base md:text-sm">
            Welcome back! Here's what's happening with your requests.
          </p>
        </div>
        
        {/* Type Switch and Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          <TypeSwitch />
          <div className="text-sm text-muted-foreground hidden sm:block">|</div>
          <div className="text-sm font-medium text-muted-foreground hidden sm:block">Quick Filters:</div>
          {/* Existing date range and search filters would go here */}
        </div>
      </div>

      {/* KPI Cards Grid - Responsive 12-column grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* KPI Cards Section */}
        <div className="col-span-12 xl:col-span-9 lg:col-span-8">
          <div className="grid grid-cols-12 gap-4">
            {kpiData.map((kpi, index) => (
              <div 
                key={kpi.title}
                className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-4"
              >
                <KPICard
                  title={kpi.title}
                  value={kpi.value}
                  change={kpi.change}
                  isPositive={kpi.isPositive}
                  icon={kpi.icon}
                  iconBgColor={kpi.iconBgColor}
                  tooltip={kpi.tooltip}
                  delay={index * 0.1}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Attention Needed Card */}
        <div className="col-span-12 xl:col-span-3 lg:col-span-4">
          <AttentionNeededCard />
        </div>
      </div>

      {/* Charts Section - Responsive grid */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <Suspense fallback={<div className="h-96 flex items-center justify-center"><LoadingSpinner /></div>}>
            <RequestsOverTimeChart />
          </Suspense>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <Suspense fallback={<div className="h-96 flex items-center justify-center"><LoadingSpinner /></div>}>
            <SLAComplianceChart />
          </Suspense>
        </div>
      </div>
      
      {/* Bottom Chart - Full width */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <QuickStats />
        </div>
      </div>
    </div>
  );
}
