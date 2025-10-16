export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  // Toggle semantics: 0 = use mock, 1 = use real API
  useMock: (import.meta.env.VITE_USE_MOCK ?? '0') === '0',
  authMode: import.meta.env.VITE_AUTH_MODE || 'clerk',
}