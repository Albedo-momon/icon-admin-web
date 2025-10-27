import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { hasInitialized, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If already hydrated, set immediately
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Only initialize auth after hydration is complete
    if (isHydrated && !hasInitialized) {
      initializeAuth();
    }
  }, [isHydrated, hasInitialized, initializeAuth]);

  // Show loading until both hydration and auth initialization are complete
  if (!isHydrated || isLoading || !hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
}