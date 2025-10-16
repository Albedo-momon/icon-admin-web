import { Clerk } from '@clerk/clerk-js';

// Initialize Clerk
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const jwtTemplateName = import.meta.env.VITE_CLERK_JWT_TEMPLATE_NAME || 'icon-admin-api';

if (!publishableKey) {
  throw new Error('Missing Clerk Publishable Key');
}

let clerkInstance: Clerk | null = null;

/**
 * Initialize Clerk instance
 */
const initializeClerk = async (): Promise<Clerk> => {
  if (!clerkInstance) {
    clerkInstance = new Clerk(publishableKey);
    await clerkInstance.load();
  }
  return clerkInstance;
};

/**
 * Get a fresh JWT token from Clerk for API authentication
 * @param templateName - The JWT template name configured in Clerk Dashboard
 * @returns Promise<string> - The JWT token
 */
export const getJWTToken = async (templateName?: string): Promise<string> => {
  try {
    console.log('🔄 Fetching JWT token from Clerk...');
    const clerk = await initializeClerk();
    
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

    console.log('✅ JWT token fetched successfully:', {
      template,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...',
      fullToken: token
    });

    return token;
  } catch (error) {
    console.error('❌ Error getting JWT token:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated with Clerk
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const clerk = await initializeClerk();
    return !!clerk.user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Get current Clerk user
 */
export const getCurrentUser = async () => {
  try {
    const clerk = await initializeClerk();
    return clerk.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};