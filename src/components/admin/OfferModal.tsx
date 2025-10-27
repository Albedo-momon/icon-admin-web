import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { Offer } from "@/store/adminStore";
import { uploadImage, UploadError } from "@/services/uploadService";
import { createSpecialOffer, updateSpecialOffer, SpecialOfferError } from "@/services/specialOffersService";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB as per spec
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// State machine states
type SaveState = 'idle' | 'validating' | 'presigning' | 'uploading' | 'submitting' | 'success' | 'error';

const offerSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title must be 120 characters or less"),
  image: z
    .instanceof(FileList)
    .optional()
    .refine((files) => {
      if (!files || files.length === 0) return true; // Optional for edit
      const file = files[0];
      return ACCEPTED_IMAGE_TYPES.includes(file.type);
    }, "Only JPG, PNG, and WebP images are allowed")
    .refine((files) => {
      if (!files || files.length === 0) return true;
      return files[0]?.size <= MAX_FILE_SIZE;
    }, "Max file size is 10MB"),
  mrp: z.coerce.number().min(0.01, "Price must be greater than 0"),
  sale: z.coerce.number().min(0, "Discounted price must be 0 or greater"),
  isActive: z.boolean(),
}).refine((data) => data.sale <= data.mrp, {
  message: "Discounted price must be less than or equal to price",
  path: ["sale"],
}) as z.ZodType<{
  title: string;
  image?: FileList;
  mrp: number;
  sale: number;
  isActive: boolean;
}>;

type OfferFormData = z.infer<typeof offerSchema>;

interface OfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { id?: string; title: string; imageUrl: string; mrp: number; sale: number; isActive: boolean }) => void;
  offer?: Offer;
}

export function OfferModal({ open, onOpenChange, onSave, offer }: OfferModalProps) {
  const [preview, setPreview] = useState<string>(offer?.imageUrl || "");
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cachedImageUrl, setCachedImageUrl] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema as any),
    defaultValues: {
      title: offer?.title || "",
      mrp: offer?.mrp || 0,
      sale: offer?.sale || 0,
      isActive: offer?.isActive ?? true,
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

  const isProcessing = saveState !== 'idle' && saveState !== 'error';

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
      setSaveState('idle');
      setUploadProgress(0);
      setCachedImageUrl('');
      
      if (offer) {
        reset({
          title: offer.title,
          mrp: offer.mrp,
          sale: offer.sale,
          isActive: offer.isActive,
        });
        setPreview(offer.imageUrl);
        setCachedImageUrl(offer.imageUrl);
      } else {
        reset({
          title: "",
          mrp: 0,
          sale: 0,
          isActive: true,
        });
        setPreview("");
      }
    }
  }, [open, offer, reset]);

  const onSubmit = async (data: OfferFormData) => {
    try {
      setSaveState('validating');
      
      // Use cached image URL if available (for retry scenarios)
      let finalImageUrl = cachedImageUrl || offer?.imageUrl || "";
      
      // Handle image upload if new image is provided
      if (data.image && data.image.length > 0) {
        const file = data.image[0];
        
        setSaveState('presigning');
        setUploadProgress(0);
        
        try {
          const uploadedUrl = await uploadImage(file, data.title, {
            onProgress: (progress: any) => {
              if (progress.stage === 'uploading') {
                setSaveState('uploading');
                setUploadProgress(progress.percent);
              }
            }
          });
          
          finalImageUrl = uploadedUrl;
          setCachedImageUrl(uploadedUrl); // Cache for potential retry
          
        } catch (uploadError) {
          setSaveState('error');
          
          if (uploadError instanceof UploadError) {
            switch (uploadError.code) {
              case 'PRESIGN_FAILED':
                toast.error("Couldn't get upload permission. Please try again.");
                break;
              case 'UPLOAD_FAILED':
                toast.error("Upload failed. Please try again.");
                break;
              case 'NETWORK_ERROR':
                toast.error("Can't reach server. Please check your connection.");
                break;
              default:
                toast.error("Upload failed. Please try again.");
            }
          } else {
            toast.error("Upload failed. Please try again.");
          }
          return;
        }
      }

      // Submit to database
      setSaveState('submitting');
      setUploadProgress(100);

      const offerData = {
        productName: data.title,
        imageUrl: finalImageUrl,
        price: data.mrp,
        discounted: data.sale,
        status: data.isActive ? 'ACTIVE' as const : 'INACTIVE' as const,
        sortOrder: 0, // Default sort order
      };

      const isNumericId = offer?.id ? /^\d+$/.test(String(offer.id)) : false;
      console.debug('[OfferModal.submit] prepared', { offerId: offer?.id, isNumericId, offerData });
      
      try {
        if (offer?.id) {
          console.debug('[OfferModal.submit] calling updateSpecialOffer', { id: offer.id });
          const updated = await updateSpecialOffer(offer.id, offerData);
          console.debug('[OfferModal.submit] updateSpecialOffer ok', updated);
          toast.success("Special offer updated successfully!");
          setSaveState('success');
          onSave({
            id: updated.id,
            title: data.title,
            imageUrl: finalImageUrl,
            mrp: data.mrp,
            sale: data.sale,
            isActive: data.isActive,
          });
        } else {
          console.debug('[OfferModal.submit] calling createSpecialOffer', { offerData });
          const created = await createSpecialOffer(offerData);
          console.debug('[OfferModal.submit] createSpecialOffer ok', created);
          toast.success("Special offer created successfully!");
          setSaveState('success');
          onSave({
            id: created.id,
            title: data.title,
            imageUrl: finalImageUrl,
            mrp: data.mrp,
            sale: data.sale,
            isActive: data.isActive,
          });
        }
        onOpenChange(false);
      } catch (dbError) {
        if (dbError instanceof SpecialOfferError && dbError.code === 'NOT_FOUND' && isNumericId) {
          console.warn('[OfferModal.submit] update failed with NOT_FOUND for numeric id; creating new record', { id: offer?.id });
          const created = await createSpecialOffer(offerData);
          console.debug('[OfferModal.submit] fallback create ok', created);
          toast.success("Special offer created successfully!");
          setSaveState('success');
          onSave({
            id: created.id,
            title: data.title,
            imageUrl: finalImageUrl,
            mrp: data.mrp,
            sale: data.sale,
            isActive: data.isActive,
          });
          onOpenChange(false);
        } else {
          throw dbError;
        }
      }
      
    } catch (error) {
      setSaveState('error');
      console.error('Unexpected error in onSubmit:', error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const discount = calculateDiscount();

  const getStateMessage = () => {
    switch (saveState) {
      case 'validating':
        return 'Validating...';
      case 'presigning':
        return 'Preparing upload...';
      case 'uploading':
        return `Uploading... ${uploadProgress}%`;
      case 'submitting':
        return 'Saving offer...';
      case 'success':
        return 'Saved successfully!';
      default:
        return '';
    }
  };

  const getStateIcon = () => {
    switch (saveState) {
      case 'validating':
      case 'presigning':
      case 'submitting':
        return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
      case 'uploading':
        return <Upload className="mr-2 h-4 w-4" />;
      case 'success':
        return <CheckCircle className="mr-2 h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="mr-2 h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{offer ? "Edit Offer" : "New Special Offer"}</DialogTitle>
          <DialogDescription>
            {offer ? "Update offer details" : "Add a new special offer"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Image {!offer && "*"}</Label>
            <Input
              id="image"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              {...register("image")}
              disabled={isProcessing}
              aria-invalid={!!errors.image}
              aria-describedby={errors.image ? "image-error" : undefined}
            />
            {errors.image && (
              <p id="image-error" className="text-sm text-destructive">
                {errors.image.message as string}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Accepted formats: JPG, PNG, WebP. Max size: 10MB
            </p>
          </div>

          {/* Progress indicator */}
          {(saveState === 'uploading' || saveState === 'submitting') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  {getStateIcon()}
                  {getStateMessage()}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

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
                  {watch("title") || "Offer Title"}
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
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              disabled={isProcessing}
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
              <Label htmlFor="mrp">Price *</Label>
              <Input
                id="mrp"
                type="number"
                step="0.01"
                {...register("mrp")}
                disabled={isProcessing}
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
              <Label htmlFor="sale">Discounted Price *</Label>
              <Input
                id="sale"
                type="number"
                step="0.01"
                {...register("sale")}
                disabled={isProcessing}
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

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
              disabled={isProcessing}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {getStateIcon()}
              {isProcessing ? getStateMessage() : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
