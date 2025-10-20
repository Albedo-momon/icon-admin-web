import { http } from '../api/client';

export interface LaptopOfferData {
  model: string;
  price: number;
  discounted: number;
  status: 'ACTIVE' | 'INACTIVE';
  imageUrl: string; // Required by backend
  specs?: Record<string, any>;
}

export interface LaptopOfferResponse {
  id: string;
  model: string;
  price: number;
  discounted: number;
  discountPercent: number;
  status: 'ACTIVE' | 'INACTIVE';
  imageUrl?: string;
  specs?: Record<string, any>;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

export class LaptopOfferError extends Error {
  code: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'NOT_FOUND' | 'UPLOAD_ERROR';
  originalError?: any;

  constructor(
    message: string,
    code: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'NOT_FOUND' | 'UPLOAD_ERROR',
    originalError?: any
  ) {
    super(message);
    this.name = 'LaptopOfferError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Gets all laptop offers with optional filtering
 */
export async function getLaptopOffers(params?: { 
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL'; 
  limit?: number; 
  offset?: number 
}): Promise<{ items: LaptopOfferResponse[]; total: number; limit: number; offset: number }> {
  try {
    const queryParams: any = {};
    if (params?.status && params.status !== 'ALL') queryParams.status = params.status;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;

    console.log('[laptopOffersService.getLaptopOffers] Making API call with params:', queryParams);
    const response = await http.get('/admin/laptop-offers', { params: queryParams });
    console.log('[laptopOffersService.getLaptopOffers] API response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Get laptop offers failed:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new LaptopOfferError('Session expired. Please log in again.', 'AUTH_ERROR', error);
    }
    
    throw new LaptopOfferError('Failed to get laptop offers', 'SERVER_ERROR', error);
  }
}

/**
 * Creates a new laptop offer
 */
export async function createLaptopOffer(data: LaptopOfferData): Promise<LaptopOfferResponse> {
  try {
    console.log('[laptopOffersService.createLaptopOffer] Creating offer with data:', data);
    console.log('[laptopOffersService.createLaptopOffer] Data validation:', {
      model: typeof data.model, modelLength: data.model?.length,
      price: typeof data.price, priceValue: data.price,
      discounted: typeof data.discounted, discountedValue: data.discounted,
      status: data.status,
      imageUrl: typeof data.imageUrl, imageUrlValue: data.imageUrl,
      specs: data.specs
    });
    const response = await http.post('/admin/laptop-offers', data);
    console.log('[laptopOffersService.createLaptopOffer] Create response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Create laptop offer failed:', error);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config,
      message: error.message
    });
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new LaptopOfferError('Session expired. Please log in again.', 'AUTH_ERROR', error);
    }
    
    if (error.response?.status === 400) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Invalid laptop offer data';
      console.error('Backend validation error:', error.response?.data);
      console.error('Full backend error response:', JSON.stringify(error.response?.data, null, 2));
      console.error('Request payload that was sent:', JSON.stringify(data, null, 2));
      throw new LaptopOfferError(message, 'VALIDATION_ERROR', error);
    }
    
    if (error.response?.status >= 500) {
      throw new LaptopOfferError("Can't reach server. Please try again.", 'SERVER_ERROR', error);
    }
    
    if (!error.response) {
      throw new LaptopOfferError("Can't reach server. Please check your connection.", 'NETWORK_ERROR', error);
    }
    
    throw new LaptopOfferError('Failed to create laptop offer', 'SERVER_ERROR', error);
  }
}

/**
 * Updates an existing laptop offer
 */
export async function updateLaptopOffer(id: string, data: Partial<LaptopOfferData>): Promise<LaptopOfferResponse> {
  try {
    console.log('[laptopOffersService.updateLaptopOffer] Updating offer:', { id, data });
    const response = await http.patch(`/admin/laptop-offers/${id}`, data);
    console.log('[laptopOffersService.updateLaptopOffer] Update response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Update laptop offer failed:', { id, data, error, status: error?.response?.status, server: error?.response?.data });
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new LaptopOfferError('Session expired. Please log in again.', 'AUTH_ERROR', error);
    }
    
    if (error.response?.status === 404) {
      throw new LaptopOfferError('Laptop offer not found', 'NOT_FOUND', error);
    }
    
    if (error.response?.status === 400) {
      const message = error.response?.data?.error?.message || 'Invalid laptop offer data';
      throw new LaptopOfferError(message, 'VALIDATION_ERROR', error);
    }
    
    if (error.response?.status >= 500) {
      throw new LaptopOfferError("Can't reach server. Please try again.", 'SERVER_ERROR', error);
    }
    
    if (!error.response) {
      throw new LaptopOfferError("Can't reach server. Please check your connection.", 'NETWORK_ERROR', error);
    }
    
    throw new LaptopOfferError('Failed to update laptop offer', 'SERVER_ERROR', error);
  }
}

/**
 * Deletes a laptop offer by ID
 */
export async function deleteLaptopOffer(id: string): Promise<{ ok: boolean; id: string }> {
  try {
    console.log('[laptopOffersService.deleteLaptopOffer] Deleting offer with id:', id);
    const response = await http.delete(`/admin/laptop-offers/${id}`);
    console.log('[laptopOffersService.deleteLaptopOffer] Delete response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Delete laptop offer failed:', { id, error, status: error?.response?.status, server: error?.response?.data });
    
    if (error.response?.status === 404) {
      throw new LaptopOfferError('Laptop offer not found', 'NOT_FOUND', error);
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new LaptopOfferError('Session expired. Please log in again.', 'AUTH_ERROR', error);
    }
    
    if (error.response?.status >= 500) {
      throw new LaptopOfferError("Can't reach server. Please try again.", 'SERVER_ERROR', error);
    }
    
    if (!error.response) {
      throw new LaptopOfferError("Can't reach server. Please check your connection.", 'NETWORK_ERROR', error);
    }
    
    throw new LaptopOfferError('Failed to delete laptop offer', 'SERVER_ERROR', error);
  }
}

/**
 * Gets presigned URL for image upload
 */
export async function getPresignedUrl(key: string, contentType: string): Promise<PresignResponse> {
  try {
    console.log('[laptopOffersService.getPresignedUrl] Getting presigned URL for:', { key, contentType });
    const response = await http.post('/uploads/presign', { key, contentType });
    console.log('[laptopOffersService.getPresignedUrl] Presigned URL response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Get presigned URL failed:', { key, contentType, error });
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new LaptopOfferError('Session expired. Please log in again.', 'AUTH_ERROR', error);
    }
    
    throw new LaptopOfferError('Failed to get upload permission', 'UPLOAD_ERROR', error);
  }
}

/**
 * Uploads file to S3 using presigned URL
 */
export async function uploadToS3(uploadUrl: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
  try {
    console.log('[laptopOffersService.uploadToS3] Uploading file to S3:', { uploadUrl, fileName: file.name, fileSize: file.size });
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          console.log('[laptopOffersService.uploadToS3] Upload successful');
          resolve();
        } else {
          console.error('[laptopOffersService.uploadToS3] Upload failed:', xhr.status, xhr.statusText);
          reject(new LaptopOfferError('Upload failed. Please try again.', 'UPLOAD_ERROR'));
        }
      });
      
      xhr.addEventListener('error', () => {
        console.error('[laptopOffersService.uploadToS3] Upload error');
        reject(new LaptopOfferError('Upload failed. Please try again.', 'UPLOAD_ERROR'));
      });
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  } catch (error) {
    console.error('[laptopOffersService.uploadToS3] Upload error:', error);
    throw new LaptopOfferError('Upload failed. Please try again.', 'UPLOAD_ERROR', error);
  }
}
