import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AuthGuard } from "./components/auth/AuthGuard";
import { useAuthStore } from "./stores/authStore";
import Dashboard from "./pages/Dashboard";
import ManageUserApp from "./pages/ManageUserApp";
import ManageAgentApp from "./pages/ManageAgentApp";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ForgotPasswordVerify from "./pages/ForgotPasswordVerify";
import ForgotPasswordReset from "./pages/ForgotPasswordReset";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to handle login redirect logic
const LoginRedirect = () => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <Login />;
};

// Component to handle successful login redirect
const LoginSuccessHandler = () => {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Initialize Clerk authentication on app start
    initializeAuth();
  }, [initializeAuth]);
  
  useEffect(() => {
    if (isAuthenticated) {
      const lastRoute = sessionStorage.getItem('lastRoute');
      const justLoggedIn = sessionStorage.getItem('justLoggedIn');
      
      // Only show toast and redirect if user just logged in
      if (justLoggedIn === 'true') {
        sessionStorage.removeItem('justLoggedIn');
        
        if (lastRoute && lastRoute !== '/login') {
          sessionStorage.removeItem('lastRoute');
          navigate(lastRoute, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
        toast.success('Login successful!');
      }
    }
  }, [isAuthenticated, navigate, location.pathname]);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LoginSuccessHandler />
        <Routes>
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/register" element={<Register />} />
          <Route path="/email-verification" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password/verify" element={<ForgotPasswordVerify />} />
          <Route path="/forgot-password/reset" element={<ForgotPasswordReset />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/manage-user-app"
            element={
              <AuthGuard>
                <AdminLayout>
                  <ManageUserApp />
                </AdminLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/manage-agent-app"
            element={
              <AuthGuard>
                <AdminLayout>
                  <ManageAgentApp />
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
