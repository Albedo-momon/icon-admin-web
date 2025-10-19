import { useState } from "react";
import { Search, Filter, Plus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminStore } from "@/store/adminStore";
import { AgentModal } from "@/components/admin/AgentModal";
import { toast } from "@/hooks/use-toast";

export default function ManageAgentApp() {
  const { agents, createAgent } = useAdminStore();
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSaveAgent = (data: any) => {
    createAgent(data);
    toast({ title: "Agent added", description: `${data.name} has been added successfully` });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Working: "bg-primary text-primary-foreground",
      Accepted: "bg-success text-success-foreground",
      Assigned: "bg-warning text-warning-foreground",
      Free: "bg-secondary text-secondary-foreground",
      Resolved: "bg-success text-success-foreground",
      Expired: "bg-destructive text-destructive-foreground",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Agent App</h1>
          <p className="text-muted-foreground mt-1">Monitor and assign service agents</p>
        </div>
        <Button onClick={() => setAgentModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Agent
        </Button>
      </div>

      {/* Filters Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Active
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Suspended
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Free
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Assigned
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Working
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted text-destructive border-destructive">
              SLA Risk
            </Badge>
          </div>

          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Agents Table */}
      {agents.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Users className="w-16 h-16 text-muted-foreground/50" />
            <div>
              <h3 className="font-semibold text-lg">No agents yet</h3>
              <p className="text-muted-foreground text-sm">Click 'Add Agent' to add one</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Agent</th>
                  <th className="text-left p-4 font-semibold text-sm">Shop</th>
                  <th className="text-left p-4 font-semibold text-sm">Active Jobs</th>
                  <th className="text-left p-4 font-semibold text-sm">Current Status</th>
                  <th className="text-left p-4 font-semibold text-sm">SLA</th>
                  <th className="text-left p-4 font-semibold text-sm">Last Assignment</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="border-b border-gray-200 last:border-0 cursor-pointer"
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground">{agent.phone}</div>
                      </div>
                    </td>
                    <td className="p-4">{agent.shop}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{agent.activeJobs}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(agent.currentStatus)}>
                        {agent.currentStatus}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={agent.sla === "On Track" ? "secondary" : "destructive"}>
                        {agent.sla}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">{agent.lastAssignment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AgentModal
        open={agentModalOpen}
        onOpenChange={setAgentModalOpen}
        onSave={handleSaveAgent}
      />
    </div>
  );
}
