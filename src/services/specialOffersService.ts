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
  code: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'NOT_FOUND';
  originalError?: any;

  constructor(
    message: string,
    code: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'NOT_FOUND',
    originalError?: any
  ) {
    super(message);
    this.name = 'SpecialOfferError';
    this.code = code;
    this.originalError = originalError;
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
    console.debug('[specialOffersService.update] request', { id, data });
    const response = await http.patch(`/admin/special-offers/${id}`, data);
    console.debug('[specialOffersService.update] response', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Update special offer failed:', { id, data, error, status: error?.response?.status, server: error?.response?.data });
    
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
 * Gets all special offers with optional filtering
 */
export async function getSpecialOffers(params?: { 
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL'; 
  activeNow?: boolean; 
  limit?: number; 
  offset?: number 
}): Promise<{ items: SpecialOfferResponse[]; total: number; limit: number; offset: number }> {
  try {
    const queryParams: any = {};
    if (params?.status && params.status !== 'ALL') queryParams.status = params.status;
    if (params?.activeNow !== undefined) queryParams.activeNow = params.activeNow;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;

    console.log('[specialOffersService.getSpecialOffers] Making API call with params:', queryParams);
    const response = await http.get('/admin/special-offers', { params: queryParams });
    console.log('[specialOffersService.getSpecialOffers] API response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Get special offers failed:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new SpecialOfferError('Session expired. Please log in again.', 'AUTH_ERROR', error);
    }
    
    throw new SpecialOfferError('Failed to get special offers', 'SERVER_ERROR', error);
  }
}

/**
 * Deletes a special offer by ID
 */
export async function deleteSpecialOffer(id: string): Promise<{ ok: boolean; id: string }> {
  try {
    console.log('[specialOffersService.deleteSpecialOffer] Deleting offer with id:', id);
    const response = await http.delete(`/admin/special-offers/${id}`);
    console.log('[specialOffersService.deleteSpecialOffer] Delete response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Delete special offer failed:', { id, error, status: error?.response?.status, server: error?.response?.data });
    
    if (error.response?.status === 404) {
      throw new SpecialOfferError('Special offer not found', 'NOT_FOUND', error);
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new SpecialOfferError('Session expired. Please log in again.', 'AUTH_ERROR', error);
    }
    
    if (error.response?.status >= 500) {
      throw new SpecialOfferError("Can't reach server. Please try again.", 'SERVER_ERROR', error);
    }
    
    if (!error.response) {
      throw new SpecialOfferError("Can't reach server. Please check your connection.", 'NETWORK_ERROR', error);
    }
    
    throw new SpecialOfferError('Failed to delete special offer', 'SERVER_ERROR', error);
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