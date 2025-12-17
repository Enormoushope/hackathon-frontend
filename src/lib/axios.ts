import axios from 'axios';
import { auth } from '@/firebase/firebase';

const baseURLRaw = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081';
// Ensure we always hit the /api prefix even if the env var omits it
const baseURL = baseURLRaw.endsWith('/api') ? baseURLRaw : `${baseURLRaw.replace(/\/$/, '')}/api`;

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to get ID token:', error);
    }
  }
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      console.error('API response error:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
    }
    return Promise.reject(error);
  }
);
