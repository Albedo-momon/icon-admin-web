import { useState, useEffect } from "react";
import { Search, UserCheck, Clock, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  email: string;
  status: "FREE" | "BUSY";
  currentTasks: number;
  avatar?: string;
}

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (agentId: string) => Promise<void>;
  request: { id: string; agent?: { id: string; name: string } };
}

// Mock agents data - IDs match the store's agent IDs
const mockAgents: Agent[] = [
  {
    id: "a1",
    name: "Alex Thompson",
    email: "alex.thompson@company.com",
    status: "FREE",
    currentTasks: 2,
  },
  {
    id: "a2", 
    name: "Lisa Chen",
    email: "lisa.chen@company.com",
    status: "BUSY",
    currentTasks: 5,
  },
  {
    id: "a3",
    name: "Mark Rodriguez",
    email: "mark.rodriguez@company.com", 
    status: "FREE",
    currentTasks: 1,
  },
  {
    id: "a4",
    name: "Anna Kim",
    email: "anna.kim@company.com",
    status: "BUSY",
    currentTasks: 4,
  },
  {
    id: "a5",
    name: "Chris Lee",
    email: "chris.lee@company.com",
    status: "FREE",
    currentTasks: 3,
  },
  {
    id: "a6",
    name: "Jessica Wang",
    email: "jessica.wang@company.com",
    status: "FREE",
    currentTasks: 2,
  },
];

const AgentCard = ({ 
  agent, 
  isSelected, 
  onSelect, 
  isCurrent 
}: { 
  agent: Agent; 
  isSelected: boolean; 
  onSelect: () => void;
  isCurrent: boolean;
}) => (
  <div
    className={cn(
      "p-4 border rounded-lg cursor-pointer",
      isSelected && "border-primary bg-primary/5",
      isCurrent && "border-muted bg-muted/50 cursor-not-allowed opacity-60"
    )}
    onClick={isCurrent ? undefined : onSelect}
  >
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={agent.avatar} />
        <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{agent.name}</span>
          {isCurrent && (
            <Badge variant="outline" className="text-xs">
              Current
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{agent.email}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge 
            variant={agent.status === "FREE" ? "outline" : "secondary"}
            className={cn(
              "text-xs",
              agent.status === "FREE" 
                ? "text-green-700 border-green-300 bg-green-50 dark:text-green-300 dark:border-green-700 dark:bg-green-950"
                : "text-yellow-700 border-yellow-300 bg-yellow-50 dark:text-yellow-300 dark:border-yellow-700 dark:bg-yellow-950"
            )}
          >
            {agent.status === "FREE" ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Available
              </>
            ) : (
              <>
                <Clock className="mr-1 h-3 w-3" />
                Busy
              </>
            )}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {agent.currentTasks} active tasks
          </span>
        </div>
      </div>
      
      {isSelected && (
        <UserCheck className="h-5 w-5 text-primary" />
      )}
    </div>
  </div>
);

export default function ReassignModal({
  isOpen,
  onClose,
  onConfirm,
  request,
}: ReassignModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Filter agents based on search query
  const filteredAgents = mockAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort agents: FREE first, then by current tasks
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    if (a.status === "FREE" && b.status === "BUSY") return -1;
    if (a.status === "BUSY" && b.status === "FREE") return 1;
    return a.currentTasks - b.currentTasks;
  });
  
  const handleReassign = async () => {
    if (!selectedAgent) return;
    
    setIsLoading(true);
    try {
      await onConfirm(selectedAgent.id);
      toast({
        title: "Request Reassigned",
        description: `Request ${request.id} has been reassigned to ${selectedAgent.name}`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reassign request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAgent(null);
      setSearchQuery("");
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Reassign Request</DialogTitle>
          <DialogDescription>
            Select an agent to reassign request {request.id}. Available agents are shown first.
          </DialogDescription>
        </DialogHeader>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search agents by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Agent List */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {sortedAgents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No agents found matching your search.
            </div>
          ) : (
            sortedAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgent?.id === agent.id}
                onSelect={() => setSelectedAgent(agent)}
                isCurrent={agent.id === request.agent?.id}
              />
            ))
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleReassign} 
            disabled={!selectedAgent || isLoading || selectedAgent.id === request.agent?.id}
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Reassigning...
              </>
            ) : (
              "Reassign"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}