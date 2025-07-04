import { ApiResponse } from '@/lib/types';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // If server-side, we can't use browser APIs
      if (typeof window !== 'undefined') {
        Cookies.remove('token');
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Function to check if token exists - without making an API call
 */
export function checkAuthToken(): boolean {
  const token = Cookies.get('token');
  return !!token;
}

/**
 * Generic request function with better typing
 */
export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    // Only check if token exists, don't make an API call
    if (config.url !== '/auth/login' && config.url !== '/auth/me') {
      // Simply verify token presence
      if (!checkAuthToken()) {
        // If no token, redirect to login
        if (typeof window !== 'undefined') {
          // window.location.href = '/login';
        }

        // Return error response
        return {
          success: false,
          message: 'Authentication required',
          data: {} as T,
        };
      }
    }

    const response: AxiosResponse<ApiResponse<T>> = await apiClient(config);
    return { ...response.data, success: true };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data.message || 'An error occurred',
        data: {} as T,
      };
    }

    return {
      success: false,
      message: 'Network error',
      data: {} as T,
    };
  }
}

/**
 * Form data request for file uploads
 */
export async function formDataRequest<T>(
  url: string,
  method: 'POST' | 'PUT',
  data: Record<string, any> = {},
  files?: Record<string, File | undefined>,
  existingFormData?: FormData
): Promise<ApiResponse<T>> {
  // Use existing FormData if provided, otherwise create new
  const formData = existingFormData || new FormData();

  // Add regular data to form if not using existing FormData
  if (!existingFormData) {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
  }

  // Add files to form
  if (files) {
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    });
  }

  return apiRequest<T>({
    url,
    method,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export default apiClient;