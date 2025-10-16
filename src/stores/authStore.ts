import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Clerk } from '@clerk/clerk-js';
import { performHandshake, getUserProfile, clearHandshakeCache } from '../services/authService';
import type { UserProfile } from '../api/client';
import { getJWTToken } from '../services/jwtService';
import { env } from '../env';
import { http as apiClient } from '../api/client';

// Initialize Clerk only if in clerk mode
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
let clerkInstance: Clerk | null = null;

// Initialize Clerk asynchronously (only for clerk mode)
const initializeClerk = async () => {
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

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasInitialized: boolean;
  rememberMe: boolean;
  userProfile: UserProfile | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

// Helper function to convert Clerk user to our User interface
const convertClerkUser = (clerkUser: any): User => ({
  id: clerkUser.id,
  name: clerkUser.fullName || clerkUser.firstName || 'User',
  email: clerkUser.primaryEmailAddress?.emailAddress || '',
  phone: clerkUser.primaryPhoneNumber?.phoneNumber,
});

// Helper function to convert UserProfile to User with role
const convertUserProfileToUser = (userProfile: UserProfile, clerkUser: any): User => ({
  id: clerkUser.id,
  name: clerkUser.fullName || clerkUser.firstName || 'User',
  email: clerkUser.primaryEmailAddress?.emailAddress || '',
  phone: clerkUser.primaryPhoneNumber?.phoneNumber,
  role: userProfile.role,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Create a stable reference to initializeAuth to prevent infinite re-renders
      const initializeAuth = async () => {
        const currentState = get();
        
        // Prevent multiple simultaneous initializations
        if (currentState.hasInitialized) {
          console.log('AuthStore - Already initialized, skipping');
          return;
        }
        
        console.log('AuthStore - Starting auth initialization with mode:', env.authMode);
        console.log('AuthStore - isLoading:', currentState.isLoading);
        console.log('AuthStore - hasInitialized:', currentState.hasInitialized);
        
        // Set loading to true at the start to prevent flash
        set({ isLoading: true });
        
        try {
          if (env.authMode === 'clerk') {
            // Clerk authentication initialization
            console.log('AuthStore - Initializing Clerk...');
            const clerkInstance = await initializeClerk();
            if (!clerkInstance) {
              throw new Error('Clerk not initialized');
            }
            
            console.log('AuthStore - Clerk initialized, checking user...');
            
            // Check if user is signed in with Clerk
            const isSignedIn = clerkInstance.user !== null && clerkInstance.user !== undefined;
            console.log('AuthStore - Clerk user signed in:', isSignedIn);
            
            if (isSignedIn && clerkInstance.user) {
              console.log('AuthStore - Valid Clerk user found, attempting backend sync');
              const user = convertClerkUser(clerkInstance.user);
              
              // Try to perform handshake to sync with backend
              try {
                console.log('AuthStore - Attempting handshake during initialization');
                const userProfile = await performHandshake();
                console.log('AuthStore - Handshake successful during initialization:', userProfile);
                
                // Enrich user with role from backend
                const enrichedUser = convertUserProfileToUser(userProfile, clerkInstance.user);
                set({ user: enrichedUser, userProfile, isAuthenticated: true, isLoading: false, hasInitialized: true });
              } catch (handshakeError) {
                console.warn('AuthStore - Handshake failed during initialization:', handshakeError);
                // If handshake fails, the user might not be properly synced with backend
                // Clear the Clerk session and force re-authentication
                console.log('AuthStore - Clearing Clerk session due to handshake failure');
                await clerkInstance.signOut();
                set({ user: null, userProfile: null, isAuthenticated: false, isLoading: false, hasInitialized: true });
                localStorage.removeItem('auth-storage');
              }
            } else {
              console.log('AuthStore - No valid Clerk user found, setting unauthenticated');
              set({ user: null, userProfile: null, isAuthenticated: false, isLoading: false, hasInitialized: true });
              localStorage.removeItem('auth-storage');
            }
          } else {
            // Native authentication initialization
            console.log('AuthStore - Initializing native authentication...');
            
            // Check if we have a stored token
            const token = localStorage.getItem('auth_token');
            
            if (token) {
              console.log('AuthStore - Found stored auth token, attempting to validate...');
              
              try {
                // Try to perform handshake to validate token and get user info
                console.log('AuthStore - Attempting handshake during native initialization');
                const userProfile = await performHandshake();
                console.log('AuthStore - Handshake successful during native initialization:', userProfile);
                
                // Create user object from profile
                const user: User = {
                  id: userProfile.id,
                  name: userProfile.name || userProfile.email,
                  email: userProfile.email,
                  role: userProfile.role,
                };
                
                set({ user, userProfile, isAuthenticated: true, isLoading: false, hasInitialized: true });
              } catch (handshakeError) {
                console.warn('AuthStore - Handshake failed during native initialization, clearing token:', handshakeError);
                // Token is invalid, clear it
                localStorage.removeItem('auth_token');
                set({ user: null, userProfile: null, isAuthenticated: false, isLoading: false, hasInitialized: true });
              }
            } else {
              console.log('AuthStore - No stored auth token, setting unauthenticated');
              set({ user: null, userProfile: null, isAuthenticated: false, isLoading: false, hasInitialized: true });
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ user: null, userProfile: null, isAuthenticated: false, isLoading: false, hasInitialized: true });
          // Clear localStorage on error to prevent stale data
          localStorage.removeItem('auth-storage');
          if (env.authMode === 'native') {
            localStorage.removeItem('auth_token');
          }
          if (env.authMode === 'clerk' && clerkInstance) {
            try {
              await clerkInstance.signOut();
            } catch (signOutError) {
              console.warn('Failed to sign out from Clerk:', signOutError);
            }
          }
        }
      };

      return {
        user: null,
        isAuthenticated: false,
        isLoading: true,
        hasInitialized: false,
        rememberMe: false,
        userProfile: null,
        
        initializeAuth,
        
        login: async (email: string, password: string, rememberMe?: boolean) => {
        try {
          console.log('Attempting login for:', email, 'with auth mode:', env.authMode);
          
          if (env.authMode === 'clerk') {
            // Clerk authentication flow
            const clerkInstance = await initializeClerk();
            if (!clerkInstance) throw new Error('Clerk not initialized');
            
            // Use Clerk's signIn method with proper structure
            if (!clerkInstance.client) throw new Error('Clerk client unavailable');
            const signInAttempt = await clerkInstance.client.signIn.create({
              identifier: email,
              password: password,
            });

            console.log('Sign-in attempt status:', signInAttempt.status);
            console.log('Sign-in attempt:', signInAttempt);

            if (signInAttempt.status === 'complete') {
              // After successful sign-in, set the active session
              await clerkInstance.setActive({ session: signInAttempt.createdSessionId });
              
              // Wait a moment for the session to be fully established
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Now try to get the user data
              let userData = clerkInstance.user;
              
              // If still not available, try reloading
              if (!userData) {
                await clerkInstance.load();
                userData = clerkInstance.user;
              }
              
              if (!userData) {
                throw new Error('User data not available after authentication');
              }
              
              console.log('Clerk user after login:', userData);
              const user = convertClerkUser(userData);
              console.log('Converted user:', user);
              
              // Log JWT token for debugging
              try {
                const jwtToken = await getJWTToken();
                console.log('🔑 JWT Bearer Token:', `Bearer ${jwtToken}`);
                console.log('🔑 JWT Token Details:', {
                  template: 'icon-admin-api',
                  length: jwtToken.length,
                  preview: jwtToken.substring(0, 50) + '...'
                });
              } catch (jwtError) {
                console.warn('Failed to get JWT token:', jwtError);
              }
              
              // Set flag to indicate user just logged in
              sessionStorage.setItem('justLoggedIn', 'true');
              
              // Try to perform handshake to sync with backend
              try {
                console.log('AuthStore - Attempting handshake after login');
                const userProfile = await performHandshake();
                console.log('AuthStore - Handshake successful after login:', userProfile);
                
                // Enrich user with role from backend
                const enrichedUser = convertUserProfileToUser(userProfile, userData);
                set({ user: enrichedUser, userProfile, isAuthenticated: true, rememberMe: rememberMe || false });
              } catch (handshakeError) {
                console.warn('AuthStore - Handshake failed after login:', handshakeError);
                // Still set user as authenticated even if handshake fails
                set({ user, userProfile: null, isAuthenticated: true, rememberMe: rememberMe || false });
              }
            } else {
              // Handle cases where additional verification is needed
              throw new Error('Sign in requires additional verification');
            }
          } else {
            // Native authentication flow
            console.log('Using native authentication');
            
            const response = await apiClient.post('/auth/login', {
              email,
              password,
            });
            
            if (response.data.success) {
              const { token, user: userData } = response.data;
              
              // Store the token for future requests
              localStorage.setItem('auth_token', token);
              
              console.log('Native login successful:', userData);
              
              const user: User = {
                id: userData.id,
                name: userData.name || userData.email,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
              };
              
              // Set flag to indicate user just logged in
              sessionStorage.setItem('justLoggedIn', 'true');
              
              // Try to perform handshake to sync with backend
              try {
                console.log('AuthStore - Attempting handshake after native login');
                const userProfile = await performHandshake();
                console.log('AuthStore - Handshake successful after native login:', userProfile);
                
                set({ user, userProfile, isAuthenticated: true, rememberMe: rememberMe || false });
              } catch (handshakeError) {
                console.warn('AuthStore - Handshake failed after native login:', handshakeError);
                // Still set user as authenticated even if handshake fails
                set({ user, userProfile: null, isAuthenticated: true, rememberMe: rememberMe || false });
              }
            } else {
              throw new Error(response.data.message || 'Login failed');
            }
          }
        } catch (error: any) {
          console.error('Login error:', error);
          
          if (env.authMode === 'clerk') {
            // Handle specific Clerk error codes
            if (error.errors && error.errors.length > 0) {
              const firstError = error.errors[0];
              
              // Handle rate limiting errors
              if (firstError.code === 'rate_limit_exceeded' || 
                  firstError.message?.includes('Too many requests') ||
                  firstError.message?.includes('rate limit')) {
                throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
              }
              
              throw new Error(firstError.longMessage || firstError.message || 'Invalid credentials');
            }
          } else {
            // Handle native authentication errors
            if (error.response?.data?.message) {
              throw new Error(error.response.data.message);
            }
          }
          
          throw new Error(error.message || 'Login failed');
        }
        },

        register: async (name: string, email: string, password: string) => {
          try {
            // Initialize Clerk first
            const clerkInstance = await initializeClerk();
            
            // Use Clerk's signUp method with proper validation
            const signUpData: any = {
              emailAddress: email,
              password: password,
              firstName: name.split(' ')[0],
              lastName: name.split(' ').slice(1).join(' ') || '',
            };
            
            if (!clerkInstance || !clerkInstance.client) throw new Error('Clerk client unavailable');
            const signUpAttempt = await clerkInstance.client.signUp.create(signUpData);

            console.log('SignUp attempt status:', signUpAttempt.status);
            console.log('SignUp attempt:', signUpAttempt);

            if (signUpAttempt.status === 'complete') {
              console.log('✅ Registration complete, user authenticated');
            const clerkInstance = await initializeClerk();
            if (!clerkInstance) throw new Error('Clerk not initialized');
            
            const user = convertClerkUser(signUpAttempt.createdUserId ? signUpAttempt : clerkInstance.user);
              set({ user, isAuthenticated: true, rememberMe: false });
            } else if (signUpAttempt.status === 'missing_requirements') {
              console.log('📧 Email verification required, redirecting to verification page');
              
              // Check if email verification is needed
              const missingFields = signUpAttempt.missingFields || [];
              const unverifiedFields = signUpAttempt.unverifiedFields || [];
              console.log('Missing fields:', missingFields);
              console.log('Unverified fields:', unverifiedFields);
              
              // Check for email verification requirement in either missing or unverified fields
              if (missingFields.includes('email_address') || unverifiedFields.includes('email_address')) {
                // Prepare email verification
                await signUpAttempt.prepareEmailAddressVerification({
                  strategy: 'email_code',
                });
                console.log('📤 Email verification code sent');
                
                // Store the sign-up attempt for later use in verification
                sessionStorage.setItem('signUpAttemptId', signUpAttempt.id || '');
                
                // Redirect to email verification page
                throw new Error('EMAIL_VERIFICATION_REQUIRED');
              } else {
                console.log('❌ Unexpected missing requirements:', { missingFields, unverifiedFields });
                throw new Error(`Registration incomplete: missing requirements - ${missingFields.join(', ')}`);
              }
            } else {
              console.log('❌ Registration incomplete, status:', signUpAttempt.status);
              throw new Error('Registration incomplete');
            }
          } catch (error: any) {
            console.error('Registration error:', error);
            
            // Handle specific Clerk error codes
            if (error.errors && error.errors.length > 0) {
              const firstError = error.errors[0];
              console.log('Clerk error:', firstError);
              
              if (firstError.code === 'form_identifier_exists') {
                throw new Error('An account with this email already exists.');
              }
              throw new Error(firstError.longMessage || firstError.message || 'Registration failed');
            }
            
            throw new Error(error.message || 'Registration failed');
          }
        },
        
        verifyEmail: async (code: string) => {
          try {
          const clerkInstance = await initializeClerk();
          if (!clerkInstance) throw new Error('Clerk not initialized');
          
          const signUpAttemptId = sessionStorage.getItem('signUpAttemptId');
          
          if (!signUpAttemptId) {
            throw new Error('No sign-up attempt found. Please register again.');
          }
          
          // Get the sign-up attempt
          const signUpAttempt = clerkInstance.client?.signUp;
          if (!signUpAttempt) {
            throw new Error('Sign-up session expired. Please register again.');
          }
          
          console.log('🔍 Attempting email verification with code:', code);
          
          // Attempt email verification
          const result = await signUpAttempt.attemptEmailAddressVerification({
            code,
          });
          
          console.log('📧 Email verification result:', result);
          
          if (result.status === 'complete') {
            console.log('✅ Email verification successful, user authenticated');
            const user = convertClerkUser(result.createdUserId ? result : clerkInstance.user);
            
            // Set flag to indicate user just logged in (after email verification)
            sessionStorage.setItem('justLoggedIn', 'true');
            
            set({ user, isAuthenticated: true, rememberMe: false });
            
            // Clear the stored sign-up attempt ID
            sessionStorage.removeItem('signUpAttemptId');
          } else {
            console.log('❌ Email verification incomplete, status:', result.status);
            throw new Error('Email verification incomplete. Please try again.');
          }
        } catch (error: any) {
          console.error('Email verification error:', error);
          
          if (error.errors && error.errors.length > 0) {
            const firstError = error.errors[0];
            console.log('Clerk verification error:', firstError);
            
            if (firstError.code === 'form_code_incorrect') {
              throw new Error('Invalid verification code. Please check your email and try again.');
            }
            throw new Error(firstError.longMessage || firstError.message || 'Email verification failed');
          }
          
          throw new Error(error.message || 'Email verification failed');
        }
        },

        resendVerificationEmail: async () => {
        try {
          const clerkInstance = await initializeClerk();
          if (!clerkInstance) throw new Error('Clerk not initialized');
          
          const signUpAttempt = clerkInstance.client?.signUp;
          
          if (!signUpAttempt) {
            throw new Error('Sign-up session expired. Please register again.');
          }
          
          console.log('📤 Resending verification email');
          
          await signUpAttempt.prepareEmailAddressVerification({
            strategy: 'email_code',
          });
          
          console.log('✅ Verification email resent successfully');
        } catch (error: any) {
          console.error('Resend verification email error:', error);
          
          if (error.errors && error.errors.length > 0) {
            const firstError = error.errors[0];
            console.log('Clerk resend error:', firstError);
            throw new Error(firstError.longMessage || firstError.message || 'Failed to resend verification email');
          }
          
          throw new Error(error.message || 'Failed to resend verification email');
        }
        },

        logout: async () => {
        try {
          const clerkInstance = await initializeClerk();
          if (clerkInstance) {
            await clerkInstance.signOut();
          }
          
          // Clear handshake cache
          clearHandshakeCache();
          
          // Clear localStorage and sessionStorage
          localStorage.removeItem('auth-storage');
          sessionStorage.removeItem('lastRoute');
          
          set({ user: null, userProfile: null, isAuthenticated: false, rememberMe: false, hasInitialized: true });
        } catch (error) {
          console.error('Logout error:', error);
        }
        },

        refreshUserProfile: async () => {
        try {
          const userProfile = await getUserProfile();
          const currentUser = get().user;
          
          if (currentUser && userProfile) {
            // Update user with new role information
            const clerkInstance = await initializeClerk();
            if (clerkInstance) {
              const userData = clerkInstance.user;
              
              if (userData) {
                const enrichedUser = convertUserProfileToUser(userProfile, userData);
                set({ user: enrichedUser, userProfile });
              }
            }
          }
        } catch (error) {
          console.error('Failed to refresh user profile:', error);
        }
        },
      };
    },
    {
      name: 'auth-storage',
      partialize: (state) =>
        state.rememberMe
          ? { user: state.user, isAuthenticated: state.isAuthenticated, rememberMe: state.rememberMe }
          : { rememberMe: false },
      onRehydrateStorage: () => (state) => {
        console.log('AuthStore - Rehydrating storage, state:', state);
        // Always keep loading true during rehydration to prevent flash
        // The initializeAuth function will handle setting the correct state
        if (state) {
          state.isLoading = true;
          // Don't trust the persisted authentication state until verified
          state.isAuthenticated = false;
          state.hasInitialized = false;
        }
      },
    }
  )
);