import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getPresignedUrl, uploadToS3 } from "@/services/laptopOffersService";
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
import { Badge } from "@/components/ui/badge";
import type { LaptopOffer } from "@/store/adminStore";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

const laptopOfferSchema = z.object({
  model: z.string().min(1, "Model is required"),
  image: z
    .instanceof(FileList)
    .optional()
    .refine((files) => !files || files.length === 0 || files[0]?.size <= MAX_FILE_SIZE, "Max file size is 3MB"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  discounted: z.coerce.number().min(0, "Discounted price must be non-negative"),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  specs: z.object({
    cpu: z.string().optional(),
    ram: z.string().optional(),
    storage: z.string().optional(),
    display: z.string().optional(),
  }).optional(),
}).refine((data) => data.discounted <= data.price, {
  message: "Discounted price must be less than or equal to price",
  path: ["discounted"],
}) as z.ZodType<{
  model: string;
  image?: FileList;
  price: number;
  discounted: number;
  status: 'ACTIVE' | 'INACTIVE';
  specs?: {
    cpu?: string;
    ram?: string;
    storage?: string;
    display?: string;
  };
}>;

type LaptopOfferFormData = z.infer<typeof laptopOfferSchema>;

interface LaptopOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { 
    model: string; 
    imageUrl: string; 
    price: number; 
    discounted: number; 
    status: 'ACTIVE' | 'INACTIVE';
    specs?: {
      cpu?: string;
      ram?: string;
      storage?: string;
      display?: string;
    };
  }) => void;
  offer?: LaptopOffer;
}

export function LaptopOfferModal({ open, onOpenChange, onSave, offer }: LaptopOfferModalProps) {
  const [preview, setPreview] = useState<string>(offer?.imageUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<LaptopOfferFormData>({
    resolver: zodResolver(laptopOfferSchema as any),
    defaultValues: {
      model: offer?.model || "",
      price: offer?.price || 0,
      discounted: offer?.discounted || 0,
      status: offer?.status || 'ACTIVE',
      specs: {
        cpu: offer?.specs?.cpu || "",
        ram: offer?.specs?.ram || "",
        storage: offer?.specs?.storage || "",
        display: offer?.specs?.display || "",
      },
    },
  });

  const imageFiles = watch("image");
  const price = watch("price");
  const discounted = watch("discounted");

  const calculateDiscount = () => {
    if (price > 0 && discounted > 0 && discounted < price) {
      return Math.round(((price - discounted) / price) * 100);
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
          model: offer.model,
          price: offer.price,
          discounted: offer.discounted,
          status: offer.status,
          specs: {
            cpu: offer.specs?.cpu || "",
            ram: offer.specs?.ram || "",
            storage: offer.specs?.storage || "",
            display: offer.specs?.display || "",
          },
        });
        setPreview(offer.imageUrl || "");
      } else {
        reset({
          model: "",
          price: 0,
          discounted: 0,
          status: 'ACTIVE',
          specs: {
            cpu: "",
            ram: "",
            storage: "",
            display: "",
          },
        });
        setPreview("");
      }
      setUploadState('idle');
      setUploadProgress(0);
      setUploadError(null);
    }
  }, [open, offer, reset]);

  const onSubmit = async (data: LaptopOfferFormData) => {
    setIsSubmitting(true);
    setUploadState('idle');
    setUploadError(null);
    
    try {
      let imageUrl = offer?.imageUrl || "";
      
      // Handle image upload if a new image is provided
      if (data.image && data.image.length > 0) {
        const file = data.image[0];
        setUploadState('uploading');
        setUploadProgress(0);
        
        try {
          // Generate filename (same pattern as BannerModal)
          
          // Generate UUID-like string
          const uuid = crypto.randomUUID();
          
          // Create slug from model name
          const slug = data.model.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
          
          const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
          const filename = `${uuid}-${slug}.${fileExtension}`;
          
          console.log('[LaptopOfferModal] Starting presign flow for:', { filename, contentType: file.type });
          
          // Step 1: Get presigned URL
          const presignResponse = await getPresignedUrl(filename, file.type);
          console.log('[LaptopOfferModal] Presign response:', presignResponse);
          
          // Step 2: Upload to S3
          await uploadToS3(presignResponse.uploadUrl, file, (progress) => {
            setUploadProgress(progress);
          });
          
          // Step 3: Use the public URL
          imageUrl = presignResponse.publicUrl;
          setUploadState('success');
          console.log('[LaptopOfferModal] Upload successful, public URL:', imageUrl);
          
        } catch (uploadError) {
          console.error('[LaptopOfferModal] Upload failed:', uploadError);
          setUploadState('error');
          setUploadError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
          toast({
            title: "Upload failed",
            description: "Could not upload image. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      // Create the laptop offer data
      const laptopOfferData = {
        model: data.model,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
        price: data.price,
        discounted: data.discounted,
        status: data.status,
        specs: data.specs,
      };

      console.log('[LaptopOfferModal] Saving laptop offer:', laptopOfferData);
      onSave(laptopOfferData);
      
      onOpenChange(false);
    } catch (error) {
      console.error('[LaptopOfferModal] Submit error:', error);
      toast({
        title: "Save failed",
        description: "Could not save laptop offer. Please try again.",
        variant: "destructive"
      });
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
                  {watch("model") || "Laptop Model"}
                </h3>
                <div className="flex items-center gap-2">
                  {price > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{price.toLocaleString()}
                    </span>
                  )}
                  {discounted > 0 && (
                    <span className="text-xl font-bold text-primary">
                      ₹{discounted.toLocaleString()}
                    </span>
                  )}
                </div>
                {(watch("specs.cpu") || watch("specs.ram") || watch("specs.storage") || watch("specs.display")) && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {watch("specs.cpu") && <div>CPU: {watch("specs.cpu")}</div>}
                    {watch("specs.ram") && <div>RAM: {watch("specs.ram")}</div>}
                    {watch("specs.storage") && <div>Storage: {watch("specs.storage")}</div>}
                    {watch("specs.display") && <div>Display: {watch("specs.display")}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              {...register("model")}
              aria-invalid={!!errors.model}
              aria-describedby={errors.model ? "model-error" : undefined}
            />
            {errors.model && (
              <p id="model-error" className="text-sm text-destructive">
                {errors.model.message as string}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                {...register("price")}
                aria-invalid={!!errors.price}
                aria-describedby={errors.price ? "price-error" : undefined}
              />
              {errors.price && (
              <p id="price-error" className="text-sm text-destructive">
                {errors.price.message as string}
              </p>
            )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="discounted">Discounted Price *</Label>
              <Input
                id="discounted"
                type="number"
                {...register("discounted")}
                aria-invalid={!!errors.discounted}
                aria-describedby={errors.discounted ? "discounted-error" : undefined}
              />
              {errors.discounted && (
              <p id="discounted-error" className="text-sm text-destructive">
                {errors.discounted.message as string}
              </p>
            )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpu">CPU</Label>
              <Input
                id="cpu"
                {...register("specs.cpu")}
                placeholder="e.g., Intel i7, M2, AMD Ryzen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ram">RAM</Label>
              <Input
                id="ram"
                {...register("specs.ram")}
                placeholder="e.g., 8GB, 16GB, 32GB"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storage">Storage</Label>
              <Input
                id="storage"
                {...register("specs.storage")}
                placeholder="e.g., 256GB SSD, 1TB HDD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display">Display</Label>
              <Input
                id="display"
                {...register("specs.display")}
                placeholder="e.g., 13.4 inch FHD+, 15.6 inch 4K"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register("status")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Upload Progress */}
          {uploadState === 'uploading' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4 animate-pulse" />
                <span className="text-sm text-muted-foreground">Uploading image...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{uploadProgress}% complete</p>
            </div>
          )}

          {uploadState === 'success' && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Image uploaded successfully</span>
            </div>
          )}

          {uploadState === 'error' && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{uploadError || 'Upload failed'}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || uploadState === 'uploading'}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploadState === 'uploading' ? 'Uploading...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}