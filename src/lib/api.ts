import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const UPLOADS_URL = process.env.NEXT_PUBLIC_UPLOADS_PATH;

/**
 * Get timezone offset in minutes
 * Returns negative value for timezones ahead of UTC (e.g., -120 for UTC+2)
 */
const getTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

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
  // Add timezone offset header
  config.headers['X-Timezone-Offset'] = getTimezoneOffset().toString();
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
  birthday?: string;
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

export interface WaterStatsWeekly {
  week_start: string;
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

export interface AvailableClientData {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface EventData {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  repeat_type: RepeatType;
  repeat_until?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_repeat_instance?: boolean;  // Add this
  original_start?: string;  // Add this
}

export interface EventWithUser extends EventData {
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
  creator_first_name?: string;
  creator_last_name?: string;
}

export interface EventCreate {
  user_id: number;
  title: string;
  description?: string;
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
  all_day?: boolean;
  repeat_type?: RepeatType;
  repeat_until?: string; // ISO datetime string
}

export interface EventUpdate {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  repeat_type?: RepeatType;
  repeat_until?: string;
}

export interface EventCopyData {
  target_user_id: number;
  target_date: string; // ISO datetime string
}

export interface EventBulkCopyData {
  target_user_ids: number[];
  target_dates: string[]; // Array of ISO datetime strings
}

export interface EventCopyResponse {
  id: number;
  event_id: number;
  user_id: number;
  date: string;
  created_at: string;
}

export interface EventListParams {
  user_id?: number;
  start_date?: string; // ISO datetime string
  end_date?: string; // ISO datetime string
  include_repeating?: boolean;
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
    const params: { user_id?: number; angle?: string } = {};
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

 export const eventApi = {
  // Create a new event
  create: async (data: EventCreate): Promise<EventData> => {
    const response = await api.post('/events/', data);
    return response.data;
  },

  // List events with optional filters
  getAll: async (params?: EventListParams): Promise<EventData[]> => {
    const response = await api.get('/events/', { params });
    return response.data;
  },

  // Get a specific event by ID
  getById: async (eventId: number): Promise<EventWithUser> => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  // Update an event (PATCH - partial update)
  update: async (eventId: number, data: EventUpdate): Promise<EventData> => {
    const response = await api.patch(`/events/${eventId}`, data);
    return response.data;
  },

  // Delete an event
  delete: async (eventId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },

  // Copy an event to another user/date
  copy: async (eventId: number, data: EventCopyData): Promise<EventCopyResponse> => {
    const response = await api.post(`/events/${eventId}/copy`, data);
    return response.data;
  },

  // Bulk copy an event to multiple users/dates
  bulkCopy: async (eventId: number, data: EventBulkCopyData): Promise<EventCopyResponse[]> => {
    const response = await api.post(`/events/${eventId}/bulk-copy`, data);
    return response.data;
  },

  // Get all copies of an event (admin only)
  getCopies: async (eventId: number): Promise<EventCopyResponse[]> => {
    const response = await api.get(`/events/${eventId}/copies`);
    return response.data;
  },

  // Get events for current user
  getMyEvents: async (params?: {
    start_date?: string;
    end_date?: string;
    include_repeating?: boolean;
  }): Promise<EventData[]> => {
    return eventApi.getAll(params);
  },

  // Get events for a specific user (admin only)
  getUserEvents: async (userId: number, params?: {
    start_date?: string;
    end_date?: string;
    include_repeating?: boolean;
  }): Promise<EventData[]> => {
    return eventApi.getAll({ ...params, user_id: userId });
  },

  // Get events for a specific date range (helper function)
  getEventsByDateRange: async (
    startDate: Date,
    endDate: Date,
    userId?: number,
    includeRepeating: boolean = true
  ): Promise<EventData[]> => {
    const params: EventListParams = {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      include_repeating: includeRepeating,
    };
    
    if (userId) {
      params.user_id = userId;
    }
    
    return eventApi.getAll(params);
  },

  // Get events for today (helper function)
  getTodayEvents: async (userId?: number): Promise<EventData[]> => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    return eventApi.getEventsByDateRange(startOfDay, endOfDay, userId);
  },

  // Get events for this week (helper function)
  getWeekEvents: async (userId?: number): Promise<EventData[]> => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);
    
    return eventApi.getEventsByDateRange(startOfWeek, endOfWeek, userId);
  },

  // Get events for this month (helper function)
  getMonthEvents: async (userId?: number, year?: number, month?: number): Promise<EventData[]> => {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth();
    
    const startOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    
    return eventApi.getEventsByDateRange(startOfMonth, endOfMonth, userId);
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

  getWeeklyStats: async (weekStart?: string): Promise<WaterStatsWeekly[]> => {
    const params = weekStart ? { week_start: weekStart } : {};
    const response = await api.get('/water/stats/weekly', { params });
    return response.data;
  },

  getMonthlyStats: async (year?: number, month?: number): Promise<WaterStatsDaily[]> => {
    const params: { year?: number; month?: number } = {};
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

  sendMessage: async (threadId: number, body: string, imageUrl?: string): Promise<ChatMessageData> => {
    const response = await api.post('/chat/message', { 
      thread_id: threadId, 
      body,
      image_url: imageUrl 
    });
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

  uploadFile: async (file: File, threadId: number): Promise<{
    file_name: string;
    file_url: string;
    original_name: string;
    file_size: number;
    content_type: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('thread_id', threadId.toString());  // Add thread_id to form data
    
    const response = await api.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAvailableClients: async (search?: string): Promise<AvailableClientData[]> => {
    const params = search ? { search } : {};
    const response = await api.get('/chat/available-clients', { params });
    return response.data;
  },

  createThread: async (clientId: number): Promise<ChatThreadData> => {
    const response = await api.post('/chat/threads', { client_id: clientId });
    return response.data;
  },

  getTotalUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await api.get('/chat/unread-count');
    return response.data;
  },

  getFileUrl: (filename: string): string => {
    if (filename.startsWith('/uploads/')) {
      return `${UPLOADS_URL}${filename}`;
    }
    return `${UPLOADS_URL}/uploads/chat/${filename}`;
  },

 

};



export default api;