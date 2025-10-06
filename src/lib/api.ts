import axios, { AxiosError } from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://admin.chosen-international.com/api';
const API_BASE_URL = 'http://127.0.0.1:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
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
  (error: AxiosError) => {
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

// NEW: Questionnaire Types
export interface QuestionnaireData {
  id?: number;
  user_id?: number;
  weight?: number;
  height?: number;
  age?: number;
  health_issues?: string;
  bad_habits?: string;
  workout_environment?: 'gym' | 'home' | 'outdoor' | 'both';
  work_shift?: 'morning' | 'afternoon' | 'night' | 'split' | 'flexible';
  wake_up_time?: string;
  sleep_time?: string;
  morning_routine?: string;
  evening_routine?: string;
  created_at?: string;
  updated_at?: string;
}

// NEW: Weight Tracking Types
export interface WeightTrackingData {
  id: number;
  user_id: number;
  weight: number;
  date: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface WeightTrackingCreate {
  weight: number;
  date: string;
}

export interface WeightTrackingUpdate {
  weight: number;
}

// NEW: Day Rating Types
export interface DayRatingData {
  id: number;
  user_id: number;
  score?: number;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface DayRatingCreate {
  score?: number;
  note?: string;
}

export interface DayRatingUpdate {
  score?: number;
  note?: string;
}

// NEW: Progress Photo Types
export interface ProgressPhotoData {
  id: number;
  user_id: number;
  angle: 'front' | 'side' | 'back';
  image_url: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// NEW: Water Tracking Types
export interface WaterGoalData {
  id: number;
  user_id: number;
  daily_ml: number;
  created_at: string;
  updated_at: string;
}

export interface WaterTrackingData {
  id: number;
  user_id: number;
  water_intake: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface WaterStatsDaily {
  date: string;
  total_intake_ml: number;
  goal_ml: number;
  progress_percentage: number;
  goal_reached: boolean;
  entry_count: number;
  remaining_ml: number;
}

// NEW: Chat Types
export interface ChatThreadData {
  id: number;
  trainer_id: number;
  client_id: number;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  client_name?: string;
  trainer_name?: string;
  has_unread_messages: boolean;
  unread_count: number;
}

export interface ChatMessageData {
  id: number;
  thread_id: number;
  user_id: number;
  body: string;
  image_url?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
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

    const response = await api.post('/auth/register', formData, {
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

  create: async (data: CreateUserData): Promise<UserData> => {
    const formData = new FormData();
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    
    if (data.profile_picture) {
      formData.append('profile_picture', data.profile_picture);
    }

    const response = await api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

  deleteUser: async (userId: number): Promise<{ message: string }> => {
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

// NEW: Questionnaire API
export const questionnaireApi = {
  get: async (): Promise<QuestionnaireData | null> => {
    const response = await api.get('/questionnaire/');
    return response.data;
  },

  upsert: async (data: Partial<QuestionnaireData>): Promise<QuestionnaireData> => {
    const response = await api.post('/questionnaire/', data);
    return response.data;
  },

  update: async (data: Partial<QuestionnaireData>): Promise<QuestionnaireData> => {
    const response = await api.put('/questionnaire/', data);
    return response.data;
  },

  getByUserId: async (userId: number): Promise<QuestionnaireData | null> => {
    const response = await api.get(`/questionnaire/admin/user/${userId}`);
    return response.data;
  },
};

// NEW: Weight Tracking API
export const weightTrackingApi = {
  getAll: async (userId?: number): Promise<WeightTrackingData[]> => {
    const params = userId ? { user_id: userId } : {};
    const response = await api.get('/tracking/weight', { params });
    return response.data;
  },

  create: async (data: WeightTrackingCreate): Promise<WeightTrackingData> => {
    const response = await api.post('/tracking/weight', data);
    return response.data;
  },

  update: async (weightId: number, data: WeightTrackingUpdate): Promise<WeightTrackingData> => {
    const response = await api.put(`/tracking/weight/${weightId}`, data);
    return response.data;
  },
};

// NEW: Day Rating API
export const dayRatingApi = {
  getAll: async (userId?: number): Promise<DayRatingData[]> => {
    const params = userId ? { user_id: userId } : {};
    const response = await api.get('/tracking/day-rating', { params });
    return response.data;
  },

  create: async (data: DayRatingCreate): Promise<DayRatingData> => {
    const response = await api.post('/tracking/day-rating', data);
    return response.data;
  },

  update: async (ratingId: number, data: DayRatingUpdate): Promise<DayRatingData> => {
    const response = await api.put(`/tracking/day-rating/${ratingId}`, data);
    return response.data;
  },
};

// NEW: Progress Photos API
export const progressPhotoApi = {
  getAll: async (userId?: number, angle?: string): Promise<ProgressPhotoData[]> => {
    const params: any = {};
    if (userId) params.user_id = userId;
    if (angle) params.angle = angle;
    const response = await api.get('/tracking/progress-photos', { params });
    return response.data;
  },

  upload: async (angle: string, file: File): Promise<ProgressPhotoData> => {
    const formData = new FormData();
    formData.append('angle', angle);
    formData.append('file', file);

    const response = await api.post('/tracking/progress-photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (photoId: number, data: { angle?: string; image_url?: string }): Promise<ProgressPhotoData> => {
    const response = await api.put(`/tracking/progress-photos/${photoId}`, data);
    return response.data;
  },
};

// NEW: Water Tracking API
export const waterApi = {
  // Goals
  getGoal: async (): Promise<WaterGoalData | null> => {
    const response = await api.get('/water/goal');
    return response.data;
  },

  createGoal: async (daily_ml: number): Promise<WaterGoalData> => {
    const response = await api.post('/water/goal', { daily_ml });
    return response.data;
  },

  updateGoal: async (daily_ml: number): Promise<WaterGoalData> => {
    const response = await api.put('/water/goal', { daily_ml });
    return response.data;
  },

  deleteGoal: async (): Promise<{ message: string }> => {
    const response = await api.delete('/water/goal');
    return response.data;
  },

  // Intake Tracking
  addIntake: async (water_intake: number): Promise<WaterTrackingData> => {
    const response = await api.post('/water/intake', { water_intake });
    return response.data;
  },

  getIntakes: async (params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
    order?: 'asc' | 'desc';
  }): Promise<WaterTrackingData[]> => {
    const response = await api.get('/water/intake', { params });
    return response.data;
  },

  getIntakeById: async (entryId: number): Promise<WaterTrackingData> => {
    const response = await api.get(`/water/intake/${entryId}`);
    return response.data;
  },

  updateIntake: async (entryId: number, water_intake: number): Promise<WaterTrackingData> => {
    const response = await api.put(`/water/intake/${entryId}`, { water_intake });
    return response.data;
  },

  deleteIntake: async (entryId: number, hardDelete: boolean = false): Promise<{ message: string }> => {
    const response = await api.delete(`/water/intake/${entryId}`, {
      params: { hard_delete: hardDelete }
    });
    return response.data;
  },

  // Statistics
  getDailyStats: async (targetDate?: string): Promise<WaterStatsDaily> => {
    const params = targetDate ? { target_date: targetDate } : {};
    const response = await api.get('/water/stats/daily', { params });
    return response.data;
  },

  getWeeklyStats: async (weekStart?: string): Promise<any> => {
    const params = weekStart ? { week_start: weekStart } : {};
    const response = await api.get('/water/stats/weekly', { params });
    return response.data;
  },

  getMonthlyStats: async (year?: number, month?: number): Promise<any> => {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const response = await api.get('/water/stats/monthly', { params });
    return response.data;
  },

  // Admin routes
  getUserDailyStats: async (userId: number, targetDate?: string): Promise<WaterStatsDaily> => {
    const params = targetDate ? { target_date: targetDate } : {};
    const response = await api.get(`/water/admin/user/${userId}/stats/daily`, { params });
    return response.data;
  },
};

// NEW: Chat API
export const chatApi = {
  getThreads: async (): Promise<ChatThreadData[]> => {
    const response = await api.get('/chat/threads');
    return response.data;
  },

  getMessages: async (threadId: number, page: number = 1, limit: number = 50): Promise<{
    messages: ChatMessageData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const response = await api.get(`/chat/threads/${threadId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  },

  sendMessage: async (threadId: number, body: string): Promise<ChatMessageData> => {
    const response = await api.post('/chat/message', { thread_id: threadId, body });
    return response.data;
  },

  markMessagesRead: async (threadId: number, messageIds: number[]): Promise<{ messages_marked_read: number }> => {
    const response = await api.post(`/chat/threads/${threadId}/mark-read`, { message_ids: messageIds });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await api.get('/chat/unread-count');
    return response.data;
  },

  uploadFile: async (file: File): Promise<{
    file_url: string;
    file_name: string;
    file_size: number;
    content_type: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;