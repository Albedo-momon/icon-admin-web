import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePreviewPage from '../pages/HomePreview'
import HealthPage from '../pages/Health'
import Dashboard from '../pages/Dashboard'
import Login from '../pages/Login'
import Register from '../pages/Register'
import EmailVerification from '../pages/EmailVerification'
import ForgotPassword from '../pages/ForgotPassword'
import ForgotPasswordVerify from '../pages/ForgotPasswordVerify'
import ForgotPasswordReset from '../pages/ForgotPasswordReset'
import ManageAgentApp from '../pages/ManageAgentApp'
import ManageUserApp from '../pages/ManageUserApp'
import NotFound from '../pages/NotFound'

const router = createBrowserRouter([
  { path: '/', element: <HomePreviewPage /> },
  { path: '/health', element: <HealthPage /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/email-verification', element: <EmailVerification /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/forgot-password-verify', element: <ForgotPasswordVerify /> },
  { path: '/forgot-password-reset', element: <ForgotPasswordReset /> },
  { path: '/manage-agent', element: <ManageAgentApp /> },
  { path: '/manage-user', element: <ManageUserApp /> },
  { path: '*', element: <NotFound /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}