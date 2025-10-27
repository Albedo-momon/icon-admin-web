import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type Agent } from "@/types/agent";

interface DeleteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (agentId: string) => Promise<void>;
  agent: Agent | null;
}

export default function DeleteAgentModal({ isOpen, onClose, onConfirm, agent }: DeleteAgentModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!agent) return;

    setIsDeleting(true);
    try {
      await onConfirm(agent.id);
      toast({
        title: "Success",
        description: `Agent ${agent.name} has been deleted successfully`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete agent",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!agent) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Agent
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              Are you sure you want to delete <strong>{agent.name}</strong>? This action cannot be undone.
            </p>
            
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    Warning: This will permanently remove:
                  </p>
                  <ul className="text-sm text-destructive/80 space-y-1 ml-2">
                    <li>• Agent profile and contact information</li>
                    <li>• Job history and performance data</li>
                    <li>• Customer feedback and ratings</li>
                    <li>• All associated records</li>
                  </ul>
                </div>
              </div>
            </div>

            {agent.active && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Active Agent Notice
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      This agent is currently active. Consider deactivating them first if they have ongoing assignments.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Agent ID: <code className="bg-muted px-1 py-0.5 rounded text-xs">{agent.id}</code>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Agent
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}