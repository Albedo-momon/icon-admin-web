import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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

const agentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().regex(/^\d{10,13}$/, "Phone must be 10-13 digits"),
  shop: z.string().min(1, "Shop is required"),
  status: z.enum(["Active", "Suspended"]),
  currentStatus: z.enum(["Free", "Assigned", "Accepted", "Working", "Resolved", "Expired"]),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface AgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AgentFormData & { activeJobs: number; sla: "On Track" | "At Risk"; lastAssignment: string }) => void;
}

export function AgentModal({ open, onOpenChange, onSave }: AgentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: "",
      phone: "",
      shop: "",
      status: "Active",
      currentStatus: "Free",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        phone: "",
        shop: "",
        status: "Active",
        currentStatus: "Free",
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: AgentFormData) => {
    setIsSubmitting(true);
    try {
      onSave({
        ...data,
        activeJobs: 0,
        sla: "On Track",
        lastAssignment: "Never",
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Agent</DialogTitle>
          <DialogDescription>Add a new service agent to the system</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register("name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="10-13 digits"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="text-sm text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop">Shop *</Label>
            <Input
              id="shop"
              {...register("shop")}
              aria-invalid={!!errors.shop}
              aria-describedby={errors.shop ? "shop-error" : undefined}
            />
            {errors.shop && (
              <p id="shop-error" className="text-sm text-destructive">
                {errors.shop.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(value: "Active" | "Suspended") => setValue("status", value)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentStatus">Current Status</Label>
            <Select
              value={watch("currentStatus")}
              onValueChange={(value: any) => setValue("currentStatus", value)}
            >
              <SelectTrigger id="currentStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Working">Working</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
