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
import { Switch } from "@/components/ui/switch";
import { Banner } from "@/store/adminStore";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

const bannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  image: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "Image is required")
    .refine((files) => files[0]?.size <= MAX_FILE_SIZE, "Max file size is 3MB"),
  isActive: z.boolean(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

interface BannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; imageUrl: string; isActive: boolean; validFrom?: string; validTo?: string }) => void;
  banner?: Banner;
}

export function BannerModal({ open, onOpenChange, onSave, banner }: BannerModalProps) {
  const [preview, setPreview] = useState<string>(banner?.imageUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title || "",
      isActive: banner?.isActive ?? true,
      validFrom: banner?.validFrom || "",
      validTo: banner?.validTo || "",
    },
  });

  const imageFiles = watch("image");

  useEffect(() => {
    if (imageFiles && imageFiles.length > 0) {
      const file = imageFiles[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [imageFiles]);

  useEffect(() => {
    if (open) {
      if (banner) {
        reset({
          title: banner.title,
          isActive: banner.isActive,
          validFrom: banner.validFrom || "",
          validTo: banner.validTo || "",
        });
        setPreview(banner.imageUrl);
      } else {
        reset({
          title: "",
          isActive: true,
          validFrom: "",
          validTo: "",
        });
        setPreview("");
      }
    }
  }, [open, banner, reset]);

  const onSubmit = async (data: BannerFormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = banner?.imageUrl || "";
      
      if (data.image && data.image.length > 0) {
        const file = data.image[0];
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      onSave({
        title: data.title,
        imageUrl,
        isActive: data.isActive,
        validFrom: data.validFrom || undefined,
        validTo: data.validTo || undefined,
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
          <DialogTitle>{banner ? "Edit Banner" : "New Banner"}</DialogTitle>
          <DialogDescription>
            {banner ? "Update banner details" : "Add a new hero banner for the home page"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Image *</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              {...register("image")}
              aria-invalid={!!errors.image}
              aria-describedby={errors.image ? "image-error" : undefined}
            />
            {errors.image && (
              <p id="image-error" className="text-sm text-destructive">
                {errors.image.message}
              </p>
            )}
            {preview && (
              <div className="mt-2">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From</Label>
              <Input id="validFrom" type="date" {...register("validFrom")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validTo">Valid To</Label>
              <Input id="validTo" type="date" {...register("validTo")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
