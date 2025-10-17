import { api } from '../api/client';
import type { UserProfile } from '../api/client';

// In-memory cache to track handshake status per user
const handshakeCache = new Map<string, boolean>();

/**
 * Performs the authentication handshake flow:
 * 1. Try GET /me first
 * 2. If 404 or 401, call POST /auth/handshake
 * 3. Then retry GET /me
 * 4. Cache the result to avoid repeated handshakes
 */
export const performHandshake = async (userId?: string): Promise<UserProfile> => {
  // Use a default cache key if userId is not provided
  const cacheKey = userId || 'current-user';
  
  // Check if we've already done handshake for this user in this session
  if (handshakeCache.has(cacheKey)) {
    console.log('Handshake already completed for user:', cacheKey);
    return await api.me();
  }

  try {
    console.log('Attempting to get user profile...');
    // First, try to get the user profile
    const userProfile = await api.me();
    console.log('User profile found:', userProfile);
    
    // Mark handshake as completed since user exists in DB
    handshakeCache.set(cacheKey, true);
    return userProfile;
  } catch (error: any) {
    console.log('User profile request failed, attempting handshake...', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // If user doesn't exist in DB (404) or JWT is invalid/expired (401), perform handshake
    if (error.response?.status === 404 || error.response?.status === 401) {
      try {
        console.log('🤝 Calling handshake endpoint...');
        const handshakeResult = await api.handshake();
        console.log('✅ Handshake successful:', handshakeResult);
        
        // Mark handshake as completed
        handshakeCache.set(cacheKey, true);
        
        // Now get the user profile
        console.log('🔄 Retrying /me after handshake...');
        const userProfile = await api.me();
        console.log('✅ User profile after handshake:', userProfile);
        
        return userProfile;
      } catch (handshakeError: any) {
        console.error('❌ Handshake failed:', {
          status: handshakeError.response?.status,
          statusText: handshakeError.response?.statusText,
          data: handshakeError.response?.data,
          message: handshakeError.message
        });
        throw new Error('Failed to create user profile in database');
      }
    } else {
      // Some other error occurred
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }
};

/**
 * Get user profile (assumes handshake has been completed)
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    return await api.me();
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw error;
  }
};

/**
 * Clear handshake cache (useful for logout)
 */
export const clearHandshakeCache = (): void => {
  handshakeCache.clear();
};

/**
 * Check if user has admin role
 */
export const isAdmin = (userProfile: UserProfile): boolean => {
  return userProfile.role === 'ADMIN';
};

/**
 * Check if user has agent role
 */
export const isAgent = (userProfile: UserProfile): boolean => {
  return userProfile.role === 'AGENT';
};

/**
 * Check if user has user role
 */
export const isUser = (userProfile: UserProfile): boolean => {
  return userProfile.role === 'USER';
};