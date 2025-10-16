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
import { Progress } from "@/components/ui/progress";
import type { Banner } from "@/store/adminStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";
import { env } from "@/env";
import { getJWTToken } from "@/services/jwtService";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const bannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title must be 120 characters or less"),
  image: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "Image is required")
    .refine((files) => files[0]?.size <= MAX_FILE_SIZE, "Max file size is 10MB")
    .refine((files) => ALLOWED_TYPES.includes(files[0]?.type), "Only JPEG, PNG, and WebP images are allowed"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  sort: z.number().min(0, "Sort order must be 0 or greater"),
});

type BannerFormData = z.infer<typeof bannerSchema>;

// Upload state machine
type UploadState = 'idle' | 'validating' | 'presigning' | 'uploading' | 'creating' | 'success' | 'error';

interface BannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; imageUrl: string; status: string; sort: number }) => void;
  banner?: Banner;
}

// Generate S3 key for the image
const generateS3Key = (title: string, file: File): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Generate UUID-like string
  const uuid = crypto.randomUUID();
  
  // Create slug from title
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Get file extension
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  
  return `hero/${year}/${month}/${day}/${uuid}-${slug}.${ext}`;
};

export function BannerModal({ open, onOpenChange, onSave, banner }: BannerModalProps) {
  const [preview, setPreview] = useState<string>(banner?.imageUrl || "");
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cachedPublicUrl, setCachedPublicUrl] = useState<string>('');
  const { user } = useAuthStore();

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
      status: banner?.isActive ? "ACTIVE" : "INACTIVE",
      sort: banner?.sortOrder || 0,
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
          status: banner.isActive ? "ACTIVE" : "INACTIVE",
          sort: banner.sortOrder,
        });
        setPreview(banner.imageUrl);
      } else {
        reset({
          title: "",
          status: "ACTIVE",
          sort: 0,
        });
        setPreview("");
      }
      setUploadState('idle');
      setUploadProgress(0);
      setCachedPublicUrl('');
    }
  }, [open, banner, reset]);

  // API call to get presigned URL
  const getPresignedUrl = async (key: string, contentType: string) => {
    try {
      const token = await getJWTToken();
      const response = await fetch(`${env.apiUrl}/uploads/presign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          section: "hero",
          filename: key.split('/').pop() || 'banner.jpg',
          contentType 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get presigned URL');
      }

      return response.json();
    } catch (error) {
      console.error('Error getting presigned URL:', error);
      throw error;
    }
  };

  // Upload file to S3
  const uploadToS3 = async (uploadUrl: string, file: File) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  // Create banner record
  const createBannerRecord = async (data: { title: string; imageUrl: string; status: string; sort: number }) => {
    try {
      const token = await getJWTToken();
      const response = await fetch(`${env.apiUrl}/admin/hero-banners`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          imageUrl: data.imageUrl,
          isActive: data.status === 'ACTIVE',
          sortOrder: data.sort
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create banner record');
      }

      return response.json();
    } catch (error) {
      console.error('Error creating banner record:', error);
      throw error;
    }
  };

  const onSubmit = async (data: BannerFormData) => {
    // If editing and no new image, use existing flow
    if (banner && (!data.image || data.image.length === 0)) {
      onSave({
        title: data.title,
        imageUrl: banner.imageUrl,
        status: data.status,
        sort: data.sort,
      });
      onOpenChange(false);
      return;
    }

    // If we have a cached public URL from a previous failed attempt, retry with it
    if (cachedPublicUrl) {
      try {
        setUploadState('creating');
        await createBannerRecord({
          title: data.title,
          imageUrl: cachedPublicUrl,
          status: data.status,
          sort: data.sort,
        });
        
        onSave({
          title: data.title,
          imageUrl: cachedPublicUrl,
          status: data.status,
          sort: data.sort,
        });
        
        toast({
          title: "Success",
          description: "Banner saved successfully!",
        });
        
        setUploadState('success');
        onOpenChange(false);
        return;
      } catch (error) {
        console.error('Failed to create banner record:', error);
        toast({
          title: "Error",
          description: "Saved image, but record creation failed. Click Save again to retry.",
          variant: "destructive",
        });
        setUploadState('error');
        return;
      }
    }

    if (!data.image || data.image.length === 0) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    const file = data.image[0];
    
    try {
      // Step 1: Validation
      setUploadState('validating');
      
      // Step 2: Get presigned URL
      setUploadState('presigning');
      const key = generateS3Key(data.title, file);
      const { uploadUrl, publicUrl } = await getPresignedUrl(key, file.type);
      
      // Step 3: Upload to S3
      setUploadState('uploading');
      setUploadProgress(0);
      await uploadToS3(uploadUrl, file);
      
      // Cache the public URL in case DB creation fails
      setCachedPublicUrl(publicUrl);
      
      // Step 4: Create banner record
      setUploadState('creating');
      await createBannerRecord({
        title: data.title,
        imageUrl: publicUrl,
        status: data.status,
        sort: data.sort,
      });
      
      // Success!
      onSave({
        title: data.title,
        imageUrl: publicUrl,
        status: data.status,
        sort: data.sort,
      });
      
      toast({
        title: "Success",
        description: "Banner created successfully!",
      });
      
      setUploadState('success');
      onOpenChange(false);
      
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = "An unexpected error occurred.";
      
      if (uploadState === 'presigning') {
        errorMessage = "Couldn't get upload permission. Check network or login.";
      } else if (uploadState === 'uploading') {
        errorMessage = "Upload failed. Please try again. If it keeps failing, refresh and retry.";
      } else if (uploadState === 'creating') {
        errorMessage = "Saved image, but record creation failed. Click Save again to retry.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      setUploadState('error');
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
              accept="image/jpeg,image/png,image/webp"
              {...register("image")}
              aria-invalid={!!errors.image}
              aria-describedby={errors.image ? "image-error" : undefined}
              disabled={uploadState !== 'idle' && uploadState !== 'error'}
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
              disabled={uploadState !== 'idle' && uploadState !== 'error'}
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register("status")}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              disabled={uploadState !== 'idle' && uploadState !== 'error'}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            {errors.status && (
              <p className="text-sm text-destructive">
                {errors.status.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort">Sort Order</Label>
            <Input
              id="sort"
              type="number"
              min="0"
              {...register("sort", { valueAsNumber: true })}
              aria-invalid={!!errors.sort}
              aria-describedby={errors.sort ? "sort-error" : undefined}
              disabled={uploadState !== 'idle' && uploadState !== 'error'}
            />
            {errors.sort && (
              <p id="sort-error" className="text-sm text-destructive">
                {errors.sort.message}
              </p>
            )}
          </div>

          {/* Progress indicator */}
          {uploadState === 'uploading' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Status indicator */}
          {uploadState !== 'idle' && uploadState !== 'error' && uploadState !== 'uploading' && (
            <div className="text-sm text-muted-foreground">
              {uploadState === 'validating' && 'Validating...'}
              {uploadState === 'presigning' && 'Getting upload permission...'}
              {uploadState === 'creating' && 'Creating banner record...'}
              {uploadState === 'success' && 'Success!'}
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={uploadState === 'uploading' || uploadState === 'creating'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={uploadState !== 'idle' && uploadState !== 'error'}
            >
              {(uploadState === 'uploading' || uploadState === 'creating' || uploadState === 'presigning' || uploadState === 'validating') && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {cachedPublicUrl ? 'Retry Save' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
