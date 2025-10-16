import { type ReactNode, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, hasInitialized, userProfile, initializeAuth } = useAuthStore();
  const location = useLocation();

  // Debug logging
  console.log('AuthGuard - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'userProfile:', userProfile);

  // Memoize the initialization function to prevent infinite re-renders
  const handleInitialization = useCallback(() => {
    if (!hasInitialized) {
      initializeAuth();
    }
  }, [hasInitialized, initializeAuth]);

  // Initialize authentication only when this guard is accessed (protected routes)
  useEffect(() => {
    handleInitialization();
  }, [handleInitialization]);

  useEffect(() => {
    // Store the current route in sessionStorage if user is not authenticated
    if (!isAuthenticated && !isLoading && location.pathname !== '/login') {
      sessionStorage.setItem('lastRoute', location.pathname);
    }
  }, [isAuthenticated, isLoading, location.pathname]);

  // Show loading state while authentication is being checked or not initialized yet
  if (isLoading || !hasInitialized) {
    console.log('AuthGuard - Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('AuthGuard - Redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('AuthGuard - Rendering protected content');
  return <>{children}</>;
}