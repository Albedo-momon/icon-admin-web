import { http } from '../api/client';

export interface SpecialOfferData {
  productName: string;
  imageUrl: string;
  price: number;
  discounted: number;
  status: 'ACTIVE' | 'INACTIVE';
  validFrom?: string;
  validTo?: string;
  sortOrder?: number;
}

export interface SpecialOfferResponse {
  id: string;
  productName: string;
  imageUrl: string;
  price: number;
  discounted: number;
  discountPercent: number;
  status: 'ACTIVE' | 'INACTIVE';
  validFrom?: string;
  validTo?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export class SpecialOfferError extends Error {
  constructor(
    message: string,
    public code: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'NOT_FOUND',
    public originalError?: any
  ) {
    super(message);
    this.name = 'SpecialOfferError';
  }
}

/**
 * Creates a new special offer
 */
export async function createSpecialOffer(data: SpecialOfferData): Promise<SpecialOfferResponse> {
  try {
    const response = await http.post('/admin/special-offers', data);
    return response.data;
  } catch (error: any) {
    console.error('Create special offer failed:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new SpecialOfferError('Session expired. Please log in again.', 'AUTH_ERROR', error);
    }
    
    if (error.response?.status === 400) {
      const message = error.response?.data?.error?.message || 'Invalid offer data';
      throw new SpecialOfferError(message, 'VALIDATION_ERROR', error);
    }
    
    if (error.response?.status >= 500) {
      throw new SpecialOfferError("Can't reach server. Please try again.", 'SERVER_ERROR', error);
    }
    
    if (!error.response) {
      throw new SpecialOfferError("Can't reach server. Please check your connection.", 'NETWORK_ERROR', error);
    }
    
    throw new SpecialOfferError('Failed to create special offer', 'SERVER_ERROR', error);
  }
}

/**
 * Updates an existing special offer
 */
export async function updateSpecialOffer(id: string, data: Partial<SpecialOfferData>): Promise<SpecialOfferResponse> {
  try {
    const response = await http.patch(`/admin/special-offers/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Update special offer failed:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new SpecialOfferError('Session expired. Please log in again.', 'AUTH_ERROR', error);
    }
    
    if (error.response?.status === 404) {
      throw new SpecialOfferError('Special offer not found', 'NOT_FOUND', error);
    }
    
    if (error.response?.status === 400) {
      const message = error.response?.data?.error?.message || 'Invalid offer data';
      throw new SpecialOfferError(message, 'VALIDATION_ERROR', error);
    }
    
    if (error.response?.status >= 500) {
      throw new SpecialOfferError("Can't reach server. Please try again.", 'SERVER_ERROR', error);
    }
    
    if (!error.response) {
      throw new SpecialOfferError("Can't reach server. Please check your connection.", 'NETWORK_ERROR', error);
    }
    
    throw new SpecialOfferError('Failed to update special offer', 'SERVER_ERROR', error);
  }
}

/**
 * Gets a special offer by ID
 */
export async function getSpecialOffer(id: string): Promise<SpecialOfferResponse> {
  try {
    const response = await http.get(`/admin/special-offers/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Get special offer failed:', error);
    
    if (error.response?.status === 404) {
      throw new SpecialOfferError('Special offer not found', 'NOT_FOUND', error);
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new SpecialOfferError('Session expired. Please log in again.', 'AUTH_ERROR', error);
    }
    
    throw new SpecialOfferError('Failed to get special offer', 'SERVER_ERROR', error);
  }
}