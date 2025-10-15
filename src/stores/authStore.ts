import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Clerk } from '@clerk/clerk-js';

// Initialize Clerk
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error('Missing Clerk Publishable Key');
}

let clerkInstance: Clerk | null = null;

// Initialize Clerk asynchronously
const initializeClerk = async () => {
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
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  rememberMe: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

// Helper function to convert Clerk user to our User interface
const convertClerkUser = (clerkUser: any): User => ({
  id: clerkUser.id,
  name: clerkUser.fullName || clerkUser.firstName || 'User',
  email: clerkUser.primaryEmailAddress?.emailAddress || '',
  phone: clerkUser.primaryPhoneNumber?.phoneNumber,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      rememberMe: false,
      
      initializeAuth: async () => {
        console.log('AuthStore - Starting auth initialization, isLoading:', get().isLoading);
        
        // Set loading to true at the start to prevent flash
        set({ isLoading: true });
        
        try {
          // Initialize Clerk first
          const clerkInstance = await initializeClerk();
          
          // Check if user is already signed in with Clerk
          if (clerkInstance.user) {
            console.log('AuthStore - User found in Clerk, setting authenticated');
            const user = convertClerkUser(clerkInstance.user);
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            console.log('AuthStore - No user found in Clerk, setting unauthenticated');
            // Clear any persisted authentication state when no active session
            set({ user: null, isAuthenticated: false, isLoading: false });
            
            // Clear localStorage if no active session to prevent stale data
            localStorage.removeItem('auth-storage');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ user: null, isAuthenticated: false, isLoading: false });
          // Clear localStorage on error to prevent stale data
          localStorage.removeItem('auth-storage');
        }
      },
      
      login: async (email: string, password: string, rememberMe?: boolean) => {
        try {
          // Initialize Clerk first
          const clerkInstance = await initializeClerk();
          
          console.log('Attempting login for:', email);
          
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
            
            // Set flag to indicate user just logged in
            sessionStorage.setItem('justLoggedIn', 'true');
            
            set({ user, isAuthenticated: true, rememberMe: rememberMe || false });
          } else {
            // Handle cases where additional verification is needed
            throw new Error('Sign in requires additional verification');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          
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
          
          throw new Error(error.message || 'Invalid credentials');
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
          
          if (!clerkInstance.client) throw new Error('Clerk client unavailable');
          const signUpAttempt = await clerkInstance.client.signUp.create(signUpData);

          console.log('SignUp attempt status:', signUpAttempt.status);
          console.log('SignUp attempt:', signUpAttempt);

          if (signUpAttempt.status === 'complete') {
            console.log('✅ Registration complete, user authenticated');
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
          await clerkInstance.signOut();
          // Clear localStorage and sessionStorage
          localStorage.removeItem('auth-storage');
          sessionStorage.removeItem('lastRoute');
          
          set({ user: null, isAuthenticated: false, rememberMe: false });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },
    }),
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
        }
      },
    }
  )
);