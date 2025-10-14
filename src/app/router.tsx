import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePreviewPage from '../pages/HomePreview'
import HealthPage from '../pages/Health'

const router = createBrowserRouter([
  { path: '/', element: <HomePreviewPage /> },
  { path: '/health', element: <HealthPage /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}