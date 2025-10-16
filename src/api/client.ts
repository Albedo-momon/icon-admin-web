import axios, { AxiosRequestConfig } from 'axios'
import { env } from '../env'
import { getJWTToken } from '../services/jwtService'

// Create axios instance
const http = axios.create({ baseURL: env.apiUrl })

// Add request interceptor to attach JWT tokens
http.interceptors.request.use(
  async (config) => {
    console.log(`🌐 Making ${config.method?.toUpperCase()} request to:`, config.url);
    
    // Check if this endpoint needs authentication
    const protectedRoutes = ['/auth/handshake', '/me', '/uploads/presign'];
    const needsAuth = protectedRoutes.some(route => 
      config.url?.startsWith(route) || config.url?.includes('/admin/')
    );

    if (needsAuth) {
      console.log('🔐 Protected route detected, attaching JWT token...');
      try {
        const token = await getJWTToken();
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ JWT token attached to request:', {
          url: config.url,
          authHeader: `Bearer ${token.substring(0, 50)}...`,
          headers: config.headers
        });
      } catch (error) {
        console.error('❌ Failed to get JWT token for request:', error);
        // Let the request proceed without token - backend will handle 401
      }
    } else {
      console.log('🔓 Public route, no authentication needed');
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
http.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    
    console.error(`❌ ${method} ${url} - Status: ${status}`, {
      status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    if (status === 401) {
      console.error('🚫 Authentication failed - JWT token may be invalid or expired');
      // Could dispatch a logout action here if needed
    }
    return Promise.reject(error);
  }
);

export type HealthResponse = { status: string; db?: string }

// User profile type for /me endpoint
export interface UserProfile {
  id: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'USER';
  name?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth endpoints
async function handshakeHttp(): Promise<UserProfile> {
  const { data } = await http.post('/auth/handshake');
  return data;
}

async function getMeHttp(): Promise<UserProfile> {
  const { data } = await http.get('/me');
  return data;
}

// Health endpoint (public)
async function getHealthHttp(): Promise<HealthResponse> {
  const { data } = await http.get('/healthz')
  // Map backend shape { ok: boolean, db: boolean } to UI-friendly strings
  const status = data?.ok ? 'ok' : 'error'
  const db = typeof data?.db === 'boolean' ? (data.db ? 'connected' : 'disconnected') : undefined
  return { status, db }
}

// Mock implementations
async function handshakeMock(): Promise<UserProfile> {
  return Promise.resolve({
    id: 'mock-user-id',
    email: 'admin@example.com',
    role: 'ADMIN',
    name: 'Mock Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

async function getMeMock(): Promise<UserProfile> {
  return Promise.resolve({
    id: 'mock-user-id',
    email: 'admin@example.com',
    role: 'ADMIN',
    name: 'Mock Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

async function getHealthMock(): Promise<HealthResponse> {
  return Promise.resolve({ status: 'ok', db: 'connected (mock)' })
}

export const api = {
  // Auth endpoints
  handshake: env.useMock ? handshakeMock : handshakeHttp,
  me: env.useMock ? getMeMock : getMeHttp,
  
  // Public endpoints
  health: env.useMock ? getHealthMock : getHealthHttp,
}

// Export the configured axios instance for direct use if needed
export { http }