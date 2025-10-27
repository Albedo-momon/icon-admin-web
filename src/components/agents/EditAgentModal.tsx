import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Edit } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Agent, type UpdateAgentData } from "@/types/agent";

const editAgentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional().refine((val) => !val || /^\+?[\d\s\-\(\)]{10,}$/.test(val), "Please enter a valid phone number"),
  active: z.boolean(),
  operationalStatus: z.enum(["FREE", "BUSY"]),
  onboardingStatus: z.enum(["PENDING", "APPROVED"]),
  tags: z.array(z.string()).min(1, "Please add at least one skill tag"),
});

type EditAgentFormData = z.infer<typeof editAgentSchema>;

interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (agentId: string, data: UpdateAgentData) => Promise<void>;
  agent: Agent | null;
}

export default function EditAgentModal({ isOpen, onClose, onConfirm, agent }: EditAgentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    clearErrors,
  } = useForm<EditAgentFormData>({
    resolver: zodResolver(editAgentSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      active: true,
      operationalStatus: "FREE",
      onboardingStatus: "PENDING",
      tags: [],
    },
  });

  const watchedTags = watch("tags");

  // Reset form when modal opens or agent changes
  useEffect(() => {
    if (isOpen && agent) {
      reset({
        name: agent.name,
        email: agent.email,
        phone: agent.phone || "",
        active: agent.active,
        operationalStatus: agent.operationalStatus,
        onboardingStatus: agent.onboardingStatus,
        tags: [...agent.tags],
      });
      setNewTag("");
    }
  }, [isOpen, agent, reset]);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !watchedTags.includes(trimmedTag)) {
      const updatedTags = [...watchedTags, trimmedTag];
      setValue("tags", updatedTags);
      setNewTag("");
      clearErrors("tags");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = watchedTags.filter(tag => tag !== tagToRemove);
    setValue("tags", updatedTags);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = async (data: EditAgentFormData) => {
    if (!agent) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(agent.id, data);
      toast({
        title: "Success",
        description: "Agent updated successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update agent",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Edit Agent
          </DialogTitle>
          <DialogDescription>
            Update agent information for {agent.name}. Modify the fields below as needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter agent's full name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="agent@example.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+1 (555) 123-4567"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Status Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Status Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operationalStatus">Operational Status</Label>
                <Select
                  value={watch("operationalStatus")}
                  onValueChange={(value: "FREE" | "BUSY") => setValue("operationalStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="BUSY">Busy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboardingStatus">Onboarding Status</Label>
                <Select
                  value={watch("onboardingStatus")}
                  onValueChange={(value: "PENDING" | "APPROVED") => setValue("onboardingStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="active" className="text-sm font-medium">
                  Active Status
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable this agent to receive new assignments
                </p>
              </div>
              <Switch
                id="active"
                checked={watch("active")}
                onCheckedChange={(checked) => setValue("active", checked)}
              />
            </div>
          </div>

          {/* Skills & Tags */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Skills & Expertise
            </h3>
            
            <div className="space-y-2">
              <Label>Skill Tags *</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a skill (e.g., Hardware Repair, Software Support)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || watchedTags.includes(newTag.trim())}
                >
                  Add
                </Button>
              </div>
              
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchedTags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/20 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:bg-primary/30 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {errors.tags && (
                <p className="text-sm text-red-600">{errors.tags.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}