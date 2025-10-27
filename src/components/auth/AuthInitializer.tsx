import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AuthLoadingShimmer, LoginLoadingShimmer } from '@/components/ui/shimmer';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { hasInitialized, isLoading, initializeAuth } = useAuthStore();
  const justLoggedOut = typeof window !== 'undefined' && sessionStorage.getItem('justLoggedOut') === 'true';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const adminPrefixes = ['/dashboard', '/manage-user-app', '/requests', '/agents', '/notifications'];
  const isAdminRoute = adminPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const publicPrefixes = ['/login', '/register', '/email-verification', '/forgot-password'];
  const isPublicRoute = publicPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

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

  // One-time bypass: if user just logged out, skip shimmer and clear the flag
  useEffect(() => {
    if (justLoggedOut) {
      sessionStorage.removeItem('justLoggedOut');
    }
  }, [justLoggedOut]);

  // If just logged out, render children immediately without shimmer
  if (justLoggedOut) {
    return <>{children}</>;
  }

  // Show shimmer only on admin routes during hydration/init
  if ((!isHydrated || isLoading || !hasInitialized) && isAdminRoute) {
    return <AuthLoadingShimmer />;
  }

  // For login route, show a login-specific shimmer on reload/hydration only
  const isLoginRoute = pathname === '/login' || pathname.startsWith('/login');
  if ((!isHydrated || isLoading || !hasInitialized) && isLoginRoute && !justLoggedOut) {
    return <LoginLoadingShimmer />;
  }

  // For other public routes, render immediately without shimmer
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <>{children}</>;
}