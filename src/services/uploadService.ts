import { http } from '../api/client';
import { v4 as uuidv4 } from 'uuid';

export interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export class UploadError extends Error {
  code: 'PRESIGN_FAILED' | 'UPLOAD_FAILED' | 'INVALID_FILE' | 'NETWORK_ERROR' | 'ABORTED';
  originalError?: any;

  constructor(
    message: string,
    code: 'PRESIGN_FAILED' | 'UPLOAD_FAILED' | 'INVALID_FILE' | 'NETWORK_ERROR' | 'ABORTED',
    originalError?: any
  ) {
    super(message);
    this.name = 'UploadError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Validates file type and size according to backend requirements
 */
export function validateFile(file: File): void {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new UploadError(
      `Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`,
      'INVALID_FILE'
    );
  }

  if (file.size > maxSize) {
    throw new UploadError(
      `File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
      'INVALID_FILE'
    );
  }
}

/**
 * Creates a slug from a string for use in file names
 */
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50); // Limit length
}

/**
 * Generates a unique filename for the upload
 */
function generateFilename(originalName: string, productName?: string): string {
  const uuid = uuidv4();
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const slug = productName ? createSlug(productName) : 'offer';
  return `${uuid}-${slug}.${extension}`;
}

/**
 * Gets presigned URL for S3 upload
 */
async function getPresignedUrl(filename: string, contentType: string): Promise<PresignResponse> {
  try {
    const response = await http.post('/uploads/presign', {
      section: 'special',
      filename,
      contentType,
    });
    return response.data;
  } catch (error: any) {
    console.error('Presign request failed:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new UploadError('Session expired. Please log in again.', 'PRESIGN_FAILED', error);
    }
    
    if (error.response?.status === 415) {
      throw new UploadError('File type not supported.', 'PRESIGN_FAILED', error);
    }
    
    if (error.response?.status >= 500) {
      throw new UploadError("Can't reach server. Please try again.", 'NETWORK_ERROR', error);
    }
    
    throw new UploadError("Couldn't get upload permission.", 'PRESIGN_FAILED', error);
  }
}

/**
 * Uploads file to S3 using presigned URL
 */
async function uploadToS3(
  file: File,
  uploadUrl: string,
  options: UploadOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Handle progress
    if (options.onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          };
          options.onProgress!(progress);
        }
      });
    }
    
    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new UploadError('Upload failed. Try again.', 'UPLOAD_FAILED'));
      }
    });
    
    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new UploadError('Upload failed. Try again.', 'UPLOAD_FAILED'));
    });
    
    // Handle abort
    xhr.addEventListener('abort', () => {
      reject(new UploadError('Upload was cancelled.', 'ABORTED'));
    });
    
    // Handle abort signal
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }
    
    // Start upload
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Complete upload flow: validate → presign → upload to S3
 */
export async function uploadImage(
  file: File,
  productName?: string,
  options: UploadOptions = {}
): Promise<string> {
  try {
    // Validate file
    validateFile(file);
    
    // Generate filename
    const filename = generateFilename(file.name, productName);
    
    // Get presigned URL
    const presignData = await getPresignedUrl(filename, file.type);
    
    // Upload to S3
    await uploadToS3(file, presignData.uploadUrl, options);
    
    // Return public URL
    return presignData.publicUrl;
  } catch (error) {
    if (error instanceof UploadError) {
      throw error;
    }
    
    // Handle unexpected errors
    console.error('Unexpected upload error:', error);
    throw new UploadError('Upload failed unexpectedly.', 'UPLOAD_FAILED', error);
  }
}

/**
 * Upload with retry logic for network failures
 */
export async function uploadImageWithRetry(
  file: File,
  productName?: string,
  options: UploadOptions = {},
  maxRetries: number = 2
): Promise<string> {
  let lastError: UploadError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await uploadImage(file, productName, options);
    } catch (error) {
      lastError = error instanceof UploadError ? error : new UploadError('Upload failed', 'UPLOAD_FAILED', error);
      
      // Don't retry for validation errors or user cancellation
      if (lastError.code === 'INVALID_FILE' || lastError.code === 'ABORTED') {
        throw lastError;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw lastError!;
}