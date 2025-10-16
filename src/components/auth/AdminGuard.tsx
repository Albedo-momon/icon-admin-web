import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { isAdmin } from '@/services/authService';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isLoading, hasInitialized, userProfile } = useAuthStore();

  // Show loading state while authentication is being checked
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

  // Redirect to dashboard if user doesn't have admin role
  if (!userProfile || !isAdmin(userProfile)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}