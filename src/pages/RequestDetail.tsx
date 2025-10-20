import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  MoreHorizontal,
  UserCheck,
  X,
  Settings,
  User,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusChip } from "@/components/ui/Chips";
import { StatusTimeline } from "@/components/ui/Timeline";
import { NotesList } from "@/components/ui/NotesList";
import { FeedbackCard } from "@/components/ui/FeedbackCard";
import { useRequestsStore, type RequestDetail, type JobType, type PrimaryStatus } from "@/stores/requestsStore";
import ReassignModal from "@/components/requests/ReassignModal";
import CancelModal from "@/components/requests/CancelModal";
import ChangeStatusModal from "@/components/requests/ChangeStatusModal";
import { cn } from "@/lib/utils";

// Job type badge component
const JobTypeBadge = ({ type }: { type: JobType }) => {
  const variants = {
    IN_HOUSE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    IN_SHOP: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    PC_BUILD: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };
  
  const labels = {
    IN_HOUSE: "In-House",
    IN_SHOP: "In-Shop", 
    PC_BUILD: "PC Build",
  };
  
  return (
    <Badge className={cn("font-medium", variants[type])}>
      {labels[type]}
    </Badge>
  );
};

// Main component
export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const focusedEventId = searchParams.get("focus") || undefined;
  const { 
    loadRequestDetail, 
    reassignRequest, 
    cancelRequest, 
    changeStatus
  } = useRequestsStore();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  
  // Action handlers
  const handleReassign = () => {
    setShowReassignModal(true);
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleChangeStatus = () => {
    setShowChangeStatusModal(true);
  };

  const handleReassignConfirm = async (agentId: string) => {
    if (request) {
      await reassignRequest(request.id, agentId);
      setShowReassignModal(false);
      // Refresh request data
      const updatedRequest = await loadRequestDetail(request.id);
      setRequest(updatedRequest);
    }
  };

  const handleCancelConfirm = async (reason: string) => {
    if (request) {
      await cancelRequest(request.id, reason);
      setShowCancelModal(false);
      // Refresh request data
      const updatedRequest = await loadRequestDetail(request.id);
      setRequest(updatedRequest);
    }
  };

  const handleChangeStatusConfirm = async (newStatus: PrimaryStatus) => {
      if (request) {
        await changeStatus(request.id, newStatus);
        setShowChangeStatusModal(false);
        // Refresh request data
        const updatedRequest = await loadRequestDetail(request.id);
        if (updatedRequest) setRequest(updatedRequest);
      }
    };

  useEffect(() => {
    const loadRequest = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await loadRequestDetail(id);
        setRequest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load request");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRequest();
  }, [id, loadRequestDetail]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading request details..." />
      </div>
    );
  }
  
  if (error || !request) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <div>
          <p className="text-red-600 font-medium mb-2">Error loading request</p>
          <p className="text-muted-foreground mb-4">{error || "Request not found"}</p>
          <Button onClick={() => navigate("/requests")}>Back to Requests</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/requests")}
            className="shrink-0"
            aria-label="Go back to requests list"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
          
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight truncate">{request.id}</h1>
              <JobTypeBadge type={request.jobType} />
              <StatusChip status={request.primaryStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              Created {new Date(request.createdAt).toLocaleDateString()} • 
              Last updated {new Date(request.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                aria-label="More actions for this request"
                aria-expanded="false"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReassign}>
                <UserCheck className="mr-2 h-4 w-4" />
                Reassign
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleChangeStatus}>
                <Settings className="mr-2 h-4 w-4" />
                Change Status
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleCancel}
                className="text-red-600 focus:text-red-700"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Customer Card */}
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <User className="h-5 w-5 text-primary" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                      {request.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xl truncate mb-1">{request.user.name}</h3>
                    <p className="text-sm text-muted-foreground truncate mb-1">ID: {request.user.id}</p>
                    {request.user.email && (
                      <p className="text-sm text-muted-foreground truncate">{request.user.email}</p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Customer Profile
                </Button>
              </CardContent>
            </Card>
            
            {/* Agent Card */}
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Assigned Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {request.agent ? (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                          {request.agent.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-xl truncate mb-1">{request.agent.name}</h3>
                        <p className="text-sm text-muted-foreground truncate mb-2">ID: {request.agent.id}</p>
                        <Badge 
                          variant={request.agent.status === "FREE" ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          {request.agent.status}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Agent Profile
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <UserCheck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4 font-medium">No agent assigned</p>
                    <Button size="sm" className="w-full">
                      <UserCheck className="mr-2 h-4 w-4" />
                      Assign Agent
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Request Summary Card */}
            <Card className="h-fit md:col-span-2 xl:col-span-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Request Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Request ID</p>
                    <p className="font-semibold text-sm">{request.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Type</p>
                    <JobTypeBadge type={request.jobType} />
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Current Status</p>
                  <StatusChip status={request.primaryStatus} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Created</p>
                    <p className="text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Duration</p>
                    <p className="text-muted-foreground">
                      {Math.ceil((new Date(request.updatedAt).getTime() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
                
                {request.address && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Service Address</p>
                    <p className="text-sm text-muted-foreground break-words">{request.address}</p>
                  </div>
                )}
                
                {request.scheduledFor && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Scheduled For</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.scheduledFor).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Request Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline 
                items={request.timeline.map(event => ({
                  id: event.ts.toString(),
                  toStatus: event.label,
                  timestamp: new Date(event.ts),
                  user: {
                    name: event.actor,
                    avatar: undefined
                  },
                  comment: event.description
                }))}
                focusedEventId={focusedEventId}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes">
          <NotesList 
            notes={request.notes.map(note => ({
              id: note.id || Math.random().toString(),
              content: note.content,
              author: {
                name: note.author || 'Admin'
              },
              createdAt: new Date(note.createdAt)
            }))}
            onAddNote={async (content) => {
              // Add note logic here
              console.log('Adding note:', content);
            }}
            onUpdateNote={async (id, content) => {
              // Edit note logic here
              console.log('Editing note:', id, content);
            }}
            onDeleteNote={async (id) => {
              // Delete note logic here
              console.log('Deleting note:', id);
            }}
          />
        </TabsContent>
        
        <TabsContent value="feedback">
          {request.feedback ? (
            <FeedbackCard 
              feedback={{
                id: '1',
                rating: request.feedback.rating,
                comment: request.feedback.comment || '',
                customer: {
                  name: request.user.name,
                  id: request.user.id,
                  email: request.user.email
                },
                createdAt: new Date(request.updatedAt),
                tags: []
              }}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No feedback yet</h3>
                <p className="text-muted-foreground">
                  Customer feedback will appear here once the request is completed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Modals */}
      {request && (
        <>
          <ReassignModal
            isOpen={showReassignModal}
            onClose={() => setShowReassignModal(false)}
            onConfirm={handleReassignConfirm}
            request={request}
          />
          
          <CancelModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            onConfirm={handleCancelConfirm}
            request={request}
          />
          
          <ChangeStatusModal
            isOpen={showChangeStatusModal}
            onClose={() => setShowChangeStatusModal(false)}
            onConfirm={handleChangeStatusConfirm}
            request={request}
          />
        </>
      )}
    </div>
  );
}