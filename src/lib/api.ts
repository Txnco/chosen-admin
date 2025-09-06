import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://admin.chosen-international.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface AuthValidation {
  user_id: number;
  role_id: number;
  valid: boolean;
}

export interface UserData {
  user_id: number;
  role_id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: UserData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  validate: async (): Promise<AuthValidation> => {
    const response = await api.get('/auth/validate');
    return response.data;
  },
};

// User API
export const userApi = {
  getMe: async (): Promise<UserData> => {
    const response = await api.get('/user/me');
    return response.data;
  },
  
  getById: async (userId: number): Promise<UserData> => {
    const response = await api.get(`/user/${userId}`);
    return response.data;
  },

  getAll: async (): Promise<UserData> => {
    const response = await api.get(`/user/`);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<UserData> => {
    const response = await api.delete(`/user/${userId}`);
    return response.data;
  },
  
  getProfile: async (userId?: number): Promise<UserData> => {
    if (userId) {
      return userApi.getById(userId);
    } else {
      return userApi.getMe();
    }
  },
};

export default api;