import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ForgotPasswordState {
  email: string;
  otpSentAt: number | null;
  setEmail: (email: string) => void;
  sendOtp: () => void;
  resend: () => void;
  reset: () => void;
}

export const useForgotPasswordStore = create<ForgotPasswordState>()(
  persist(
    (set) => ({
      email: '',
      otpSentAt: null,
      setEmail: (email: string) => set({ email }),
      sendOtp: () => set({ otpSentAt: Date.now() }),
      resend: () => set({ otpSentAt: Date.now() }),
      reset: () => set({ email: '', otpSentAt: null }),
    }),
    {
      name: 'forgot-password-storage',
    }
  )
);