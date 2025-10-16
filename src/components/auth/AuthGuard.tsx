import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, hasInitialized } = useAuthStore();
  const location = useLocation();

  // Debug logging
  console.log('AuthGuard - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

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