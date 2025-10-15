import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      rememberMe: false,
      login: async (email: string, password: string, remember: boolean) => {
        // Mock validation
        if (password.length < 8) {
          throw new Error('Invalid credentials');
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockUser: User = {
          id: '1',
          name: 'Admin User',
          email,
        };
        
        set({ user: mockUser, isAuthenticated: true, rememberMe: remember });
      },
      register: async (name: string, email: string, phone: string, _password: string) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          email,
          phone,
        };
        
        set({ user: mockUser, isAuthenticated: false, rememberMe: false });
      },
      logout: () => {
        // Clear localStorage and sessionStorage
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('lastRoute');
        
        set({ user: null, isAuthenticated: false, rememberMe: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) =>
        state.rememberMe
          ? { user: state.user, isAuthenticated: state.isAuthenticated, rememberMe: state.rememberMe }
          : { rememberMe: false },
    }
  )
);