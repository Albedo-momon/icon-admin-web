import { Clerk } from '@clerk/clerk-js';
import { env } from '../env';

// Initialize Clerk only if in clerk mode
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const jwtTemplateName = import.meta.env.VITE_CLERK_JWT_TEMPLATE_NAME || 'icon-admin-api';

let clerkInstance: Clerk | null = null;

/**
 * Initialize Clerk instance (only for clerk mode)
 */
const initializeClerk = async (): Promise<Clerk | null> => {
  if (env.authMode !== 'clerk') return null;
  
  if (!publishableKey) {
    throw new Error('Missing Clerk Publishable Key');
  }
  
  if (!clerkInstance) {
    clerkInstance = new Clerk(publishableKey);
    await clerkInstance.load();
  }
  return clerkInstance;
};

/**
 * Get a fresh JWT token for API authentication
 * @param templateName - The JWT template name configured in Clerk Dashboard (only for Clerk mode)
 * @returns Promise<string> - The JWT token
 */
export const getJWTToken = async (templateName?: string): Promise<string> => {
  try {
    console.log('🔄 Fetching JWT token with auth mode:', env.authMode);
    
    if (env.authMode === 'clerk') {
      // Clerk authentication flow
      const clerk = await initializeClerk();
      if (!clerk) throw new Error('Clerk not initialized');
      
      if (!clerk.user) {
        throw new Error('User not authenticated');
      }

      console.log('👤 Clerk user authenticated:', {
        id: clerk.user.id,
        email: clerk.user.primaryEmailAddress?.emailAddress,
        hasSession: !!clerk.session
      });

      // Use provided template name or default
      const template = templateName || jwtTemplateName;
      console.log('🎫 Using JWT template:', template);
      
      // Get session token for the specified template
      const token = await clerk.session?.getToken({ template });
      
      if (!token) {
        throw new Error('Failed to get JWT token from Clerk');
      }

      console.log('✅ JWT token retrieved successfully');
      return token;
    } else {
      // Native authentication flow - get token from localStorage
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('✅ Native auth token retrieved successfully');
      return token;
    }
  } catch (error) {
    console.error('❌ Failed to get JWT token:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 * @returns Promise<boolean> - True if authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    if (env.authMode === 'clerk') {
      const clerk = await initializeClerk();
      return !!(clerk?.user && clerk?.session);
    } else {
      // For native auth, check if token exists
      const token = localStorage.getItem('auth_token');
      return !!token;
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Get current user information
 * @returns Current user data or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    if (env.authMode === 'clerk') {
      const clerk = await initializeClerk();
      return clerk?.user || null;
    } else {
      // For native auth, we don't have direct user info from token
      // This would typically come from the auth store or API call
      return null;
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};