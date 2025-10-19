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
import { Badge } from "@/components/ui/badge";
import type { LaptopOffer } from "@/store/adminStore";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

const laptopOfferSchema = z.object({
  title: z.string().min(1, "Title is required"),
  image: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "Image is required")
    .refine((files) => files[0]?.size <= MAX_FILE_SIZE, "Max file size is 3MB"),
  mrp: z.coerce.number().min(1, "MRP must be greater than 0"),
  sale: z.coerce.number().min(1, "Sale price must be greater than 0"),
  isActive: z.boolean(),
  brand: z.string().optional(),
  processor: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
}).refine((data) => data.sale < data.mrp, {
  message: "Sale price must be less than MRP",
  path: ["sale"],
}) as z.ZodType<{
  title: string;
  image: FileList;
  mrp: number;
  sale: number;
  isActive: boolean;
  brand?: string;
  processor?: string;
  ram?: string;
  storage?: string;
}>;

type LaptopOfferFormData = z.infer<typeof laptopOfferSchema>;

interface LaptopOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { 
    title: string; 
    imageUrl: string; 
    mrp: number; 
    sale: number; 
    isActive: boolean;
    brand?: string;
    processor?: string;
    ram?: string;
    storage?: string;
  }) => void;
  offer?: LaptopOffer;
}

export function LaptopOfferModal({ open, onOpenChange, onSave, offer }: LaptopOfferModalProps) {
  const [preview, setPreview] = useState<string>(offer?.imageUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<LaptopOfferFormData>({
    resolver: zodResolver(laptopOfferSchema as any),
    defaultValues: {
      title: offer?.title || "",
      mrp: offer?.mrp || 0,
      sale: offer?.sale || 0,
      isActive: offer?.isActive ?? true,
      brand: offer?.brand || "",
      processor: offer?.processor || "",
      ram: offer?.ram || "",
      storage: offer?.storage || "",
    },
  });

  const imageFiles = watch("image");
  const mrp = watch("mrp");
  const sale = watch("sale");

  const calculateDiscount = () => {
    if (mrp > 0 && sale > 0 && sale < mrp) {
      return Math.round(((mrp - sale) / mrp) * 100);
    }
    return 0;
  };

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
      if (offer) {
        reset({
          title: offer.title,
          mrp: offer.mrp,
          sale: offer.sale,
          isActive: offer.isActive,
          brand: offer.brand || "",
          processor: offer.processor || "",
          ram: offer.ram || "",
          storage: offer.storage || "",
        });
        setPreview(offer.imageUrl);
      } else {
        reset({
          title: "",
          mrp: 0,
          sale: 0,
          isActive: true,
          brand: "",
          processor: "",
          ram: "",
          storage: "",
        });
        setPreview("");
      }
    }
  }, [open, offer, reset]);

  const onSubmit = async (data: LaptopOfferFormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = offer?.imageUrl || "";
      
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
        mrp: data.mrp,
        sale: data.sale,
        isActive: data.isActive,
        brand: data.brand,
        processor: data.processor,
        ram: data.ram,
        storage: data.storage,
      });
      
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const discount = calculateDiscount();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{offer ? "Edit Laptop Offer" : "New Laptop Offer"}</DialogTitle>
          <DialogDescription>
            {offer ? "Update laptop offer details" : "Add a new laptop offer"}
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
                {errors.image.message as string}
              </p>
            )}
          </div>

          {preview && (
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video relative">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                {discount > 0 && (
                  <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
                    {discount}% OFF
                  </Badge>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-lg line-clamp-2">
                  {watch("title") || "Laptop Title"}
                </h3>
                <div className="flex items-center gap-2">
                  {mrp > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{mrp.toLocaleString()}
                    </span>
                  )}
                  {sale > 0 && (
                    <span className="text-xl font-bold text-primary">
                      ₹{sale.toLocaleString()}
                    </span>
                  )}
                </div>
                {(watch("brand") || watch("processor") || watch("ram") || watch("storage")) && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {watch("brand") && <div>Brand: {watch("brand")}</div>}
                    {watch("processor") && <div>Processor: {watch("processor")}</div>}
                    {watch("ram") && <div>RAM: {watch("ram")}</div>}
                    {watch("storage") && <div>Storage: {watch("storage")}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

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
                {errors.title.message as string}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP *</Label>
              <Input
                id="mrp"
                type="number"
                {...register("mrp")}
                aria-invalid={!!errors.mrp}
                aria-describedby={errors.mrp ? "mrp-error" : undefined}
              />
              {errors.mrp && (
              <p id="mrp-error" className="text-sm text-destructive">
                {errors.mrp.message as string}
              </p>
            )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale">Sale Price *</Label>
              <Input
                id="sale"
                type="number"
                {...register("sale")}
                aria-invalid={!!errors.sale}
                aria-describedby={errors.sale ? "sale-error" : undefined}
              />
              {errors.sale && (
              <p id="sale-error" className="text-sm text-destructive">
                {errors.sale.message as string}
              </p>
            )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                {...register("brand")}
                placeholder="e.g., Dell, Apple, HP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processor">Processor</Label>
              <Input
                id="processor"
                {...register("processor")}
                placeholder="e.g., Intel i7, M2, AMD Ryzen"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ram">RAM</Label>
              <Input
                id="ram"
                {...register("ram")}
                placeholder="e.g., 8GB, 16GB, 32GB"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storage">Storage</Label>
              <Input
                id="storage"
                {...register("storage")}
                placeholder="e.g., 256GB SSD, 1TB HDD"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Active</Label>
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