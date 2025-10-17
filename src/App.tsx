import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AuthGuard } from "./components/auth/AuthGuard";
import { AdminGuard } from "./components/auth/AdminGuard";
import { useAuthStore } from "./stores/authStore";
import { LoadingSpinner } from "./components/ui/loading-spinner";
import { isAdmin } from "./services/authService";
import Dashboard from "./pages/Dashboard";
import ManageUserApp from "./pages/ManageUserApp";
import ManageAgentApp from "./pages/ManageAgentApp";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ForgotPasswordVerify from "./pages/ForgotPasswordVerify";
import ForgotPasswordReset from "./pages/ForgotPasswordReset";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to handle root route redirect
const RootRedirect = () => {
  const { isAuthenticated, isLoading, hasInitialized, userProfile, logout, initializeAuth } = useAuthStore();
  
  // Initialize auth if not already done
  useEffect(() => {
    if (!hasInitialized) {
      initializeAuth();
    }
  }, [hasInitialized, initializeAuth]);
  
  // Show loading while authentication state is being determined
  if (isLoading || !hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }
  
  // Check if user is authenticated and has cached data
  if (isAuthenticated && userProfile) {
    // Check if user has admin role
    if (isAdmin(userProfile)) {
      // User is authenticated and is admin, redirect to dashboard
      return <Navigate to="/dashboard" replace />;
    } else {
      // User is authenticated but not admin, clear cache and redirect to login
      logout();
      return <Navigate to="/login" replace />;
    }
  }
  
  // No user or not authenticated, clear cache and redirect to login
  if (isAuthenticated || userProfile) {
    logout();
  }
  return <Navigate to="/login" replace />;
};

// Component to handle login redirect logic
const LoginRedirect = () => {
  const { isAuthenticated, isLoading, hasInitialized, userProfile, initializeAuth } = useAuthStore();
  
  useEffect(() => {
    // Initialize auth to check if user is already authenticated (e.g., after password reset)
    if (!hasInitialized) {
      initializeAuth();
    }
  }, [hasInitialized, initializeAuth]);

  // Show loading screen while authentication is being verified or not initialized yet
  if (isLoading || !hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }
  
  // Only redirect if user is authenticated AND has admin role
  if (isAuthenticated && userProfile && isAdmin(userProfile)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Stay on login page for all other cases (not authenticated, no user profile, or not admin)
  return <Login />;
};



const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/register" element={<Register />} />
          <Route path="/email-verification" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password/verify" element={<ForgotPasswordVerify />} />
          <Route path="/forgot-password/reset" element={<ForgotPasswordReset />} />
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/dashboard"
            element={
              <AdminGuard>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/manage-user-app"
            element={
              <AdminGuard>
                <AdminLayout>
                  <ManageUserApp />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/manage-agent-app"
            element={
              <AdminGuard>
                <AdminLayout>
                  <ManageAgentApp />
                </AdminLayout>
              </AdminGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <AdminLayout>
                  <Profile />
                </AdminLayout>
              </AuthGuard>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
