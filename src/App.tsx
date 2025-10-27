import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AuthGuard } from "./components/auth/AuthGuard";
import { AdminGuard } from "./components/auth/AdminGuard";
import { AuthInitializer } from "./components/auth/AuthInitializer";
import { useAuthStore } from "./stores/authStore";
import { LoadingSpinner } from "./components/ui/loading-spinner";
import { isAdmin } from "./services/authService";
import { useEffect, Suspense, lazy } from "react";

// Lazy load page components for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ManageUserApp = lazy(() => import("./pages/ManageUserApp"));
const RequestsList = lazy(() => import("./pages/RequestsList"));
const RequestDetail = lazy(() => import("./pages/RequestDetail"));
const AgentsList = lazy(() => import("./pages/AgentsList"));
const AgentDetail = lazy(() => import("./pages/AgentDetail"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ForgotPasswordVerify = lazy(() => import("./pages/ForgotPasswordVerify"));
const ForgotPasswordReset = lazy(() => import("./pages/ForgotPasswordReset"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));


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
  // This prevents the flash of login page during initial authentication check
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
  // This prevents showing the login form before authentication state is determined
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
      <AuthInitializer>
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <LoadingSpinner size="lg" text="Loading..." />
            </div>
          }>
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
                path="/requests"
                element={
                  <AdminGuard>
                    <AdminLayout>
                      <RequestsList />
                    </AdminLayout>
                  </AdminGuard>
                }
              />
              <Route
                path="/requests/:id"
                element={
                  <AdminGuard>
                    <AdminLayout>
                      <RequestDetail />
                    </AdminLayout>
                  </AdminGuard>
                }
              />
              <Route
                path="/agents"
                element={
                  <AdminGuard>
                    <AdminLayout>
                      <AgentsList />
                    </AdminLayout>
                  </AdminGuard>
                }
              />
              <Route
                path="/agents/:id"
                element={
                  <AdminGuard>
                    <AdminLayout>
                      <AgentDetail />
                    </AdminLayout>
                  </AdminGuard>
                }
              />
              <Route
                path="/notifications"
                element={
                  <AdminGuard>
                    <AdminLayout>
                      <NotificationsPage />
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
          </Suspense>
        </BrowserRouter>
      </AuthInitializer>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
