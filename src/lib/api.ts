import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://admin.chosen-international.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
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
  profile_picture?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  profile_picture?: File;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  role_id?: number;
  profile_picture?: File;
}

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: CreateUserData): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('first_name', userData.first_name);
    formData.append('last_name', userData.last_name);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    
    if (userData.profile_picture) {
      formData.append('profile_picture', userData.profile_picture);
    }

    const response = await api.post('/user/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

  getAll: async (): Promise<UserData[]> => {
    const response = await api.get('/user/');
    return response.data;
  },

  updateUser: async (data: UpdateUserData, userId: number): Promise<UserData> => {
    const formData = new FormData();
    
    if (data.first_name) formData.append('first_name', data.first_name);
    if (data.last_name) formData.append('last_name', data.last_name);
    if (data.email) formData.append('email', data.email);
    if (data.password) formData.append('password', data.password);
    if (data.role_id) formData.append('role_id', data.role_id.toString());
    if (data.profile_picture) formData.append('profile_picture', data.profile_picture);

    const response = await api.put(`/user/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteUser: async (userId: number): Promise<any> => {
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