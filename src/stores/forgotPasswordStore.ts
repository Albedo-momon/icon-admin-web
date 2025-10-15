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

interface ForgotPasswordState {
  email: string;
  otpSentAt: number | null;
  isLoading: boolean;
  setEmail: (email: string) => void;
  sendOtp: () => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  resend: () => Promise<void>;
  reset: () => void;
}

export const useForgotPasswordStore = create<ForgotPasswordState>()(
  persist(
    (set, get) => ({
      email: '',
      otpSentAt: null,
      isLoading: false,
      
      setEmail: (email: string) => set({ email }),
      
      sendOtp: async () => {
        const { email } = get();
        if (!email) throw new Error('Email is required');
        
        set({ isLoading: true });
        try {
          const clerkInstance = await initializeClerk();
          
          // Create a password reset request
          await clerkInstance.client?.signIn.create({
            identifier: email,
            strategy: 'reset_password_email_code',
          });
          
          set({ otpSentAt: Date.now() });
        } catch (error: any) {
          console.error('Send OTP error:', error);
          
          if (error.errors && error.errors.length > 0) {
            const firstError = error.errors[0];
            if (firstError.code === 'form_identifier_not_found') {
              throw new Error('No account found with this email address.');
            }
            throw new Error(firstError.longMessage || firstError.message || 'Failed to send reset code');
          }
          
          throw new Error(error.message || 'Failed to send reset code');
        } finally {
          set({ isLoading: false });
        }
      },
      
      verifyOtp: async (code: string) => {
        set({ isLoading: true });
        try {
          const clerkInstance = await initializeClerk();
          const signInAttempt = clerkInstance.client?.signIn;
          
          if (!signInAttempt) {
            throw new Error('Password reset session expired. Please try again.');
          }
          
          // Attempt to verify the reset code
          const result = await signInAttempt.attemptFirstFactor({
            strategy: 'reset_password_email_code',
            code,
          });
          
          if (result.status !== 'needs_new_password') {
            throw new Error('Invalid verification code');
          }
          
          // Code is valid, ready for password reset
        } catch (error: any) {
          console.error('Verify OTP error:', error);
          
          if (error.errors && error.errors.length > 0) {
            const firstError = error.errors[0];
            if (firstError.code === 'form_code_incorrect') {
              throw new Error('Invalid verification code. Please try again.');
            }
            throw new Error(firstError.longMessage || firstError.message || 'Code verification failed');
          }
          
          throw new Error(error.message || 'Code verification failed');
        } finally {
          set({ isLoading: false });
        }
      },
      
      resetPassword: async (password: string) => {
        set({ isLoading: true });
        try {
          const clerkInstance = await initializeClerk();
          const signInAttempt = clerkInstance.client?.signIn;
          
          if (!signInAttempt) {
            throw new Error('Password reset session expired. Please try again.');
          }
          
          // Reset the password
          const result = await signInAttempt.resetPassword({
            password,
          });
          
          if (result.status === 'complete') {
            // Password reset successful, set active session
            await clerkInstance.setActive({ session: result.createdSessionId });
          } else {
            throw new Error('Password reset failed');
          }
        } catch (error: any) {
          console.error('Reset password error:', error);
          
          if (error.errors && error.errors.length > 0) {
            const firstError = error.errors[0];
            throw new Error(firstError.longMessage || firstError.message || 'Password reset failed');
          }
          
          throw new Error(error.message || 'Password reset failed');
        } finally {
          set({ isLoading: false });
        }
      },
      
      resend: async () => {
        const { sendOtp } = get();
        await sendOtp();
      },
      
      reset: () => set({ email: '', otpSentAt: null, isLoading: false }),
    }),
    {
      name: 'forgot-password-storage',
      partialize: (state) => ({
        email: state.email,
        otpSentAt: state.otpSentAt,
      }),
    }
  )
);