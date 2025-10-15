import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Debug logging
  console.log('AuthGuard - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  useEffect(() => {
    // Store the current route in sessionStorage if user is not authenticated
    if (!isAuthenticated && !isLoading && location.pathname !== '/login') {
      sessionStorage.setItem('lastRoute', location.pathname);
    }
  }, [isAuthenticated, isLoading, location.pathname]);

  // Show loading state while authentication is being checked
  if (isLoading) {
    console.log('AuthGuard - Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
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