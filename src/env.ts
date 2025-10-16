export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  useMock: (import.meta.env.VITE_USE_MOCK ?? '1') === '1',
  authMode: import.meta.env.VITE_AUTH_MODE || 'clerk',
}