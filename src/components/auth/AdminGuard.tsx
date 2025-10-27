import { type ReactNode, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { isAdmin } from '@/services/authService';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isLoading, hasInitialized, userProfile, initializeAuth, logout } = useAuthStore();

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

  // Show loading state while authentication is being checked or not initialized yet
  // This prevents the flash of login page during initial load
  if (isLoading || !hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to login if user doesn't have admin role
  if (!userProfile || !isAdmin(userProfile)) {
    // Clear all cached data and redirect to login to prevent infinite re-renders
    logout();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}