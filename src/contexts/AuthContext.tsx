'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi, AuthValidation, UserData } from '@/lib/api';

interface AuthContextType {
  user: UserData | null;
  authData: AuthValidation | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [authData, setAuthData] = useState<AuthValidation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Validate token
      const validation = await authApi.validate();
      
      // Check if user is admin (role_id = 1)
      if (validation.role_id !== 1) {
        localStorage.removeItem('admin_token');
        setUser(null);
        setAuthData(null);
        setIsLoading(false);
        return;
      }

      // Get user data
      const userData = await userApi.getMe();
      
      setAuthData(validation);
      setUser(userData);
    } catch (error) {
      console.error('Auth validation failed:', error);
      localStorage.removeItem('admin_token');
      setUser(null);
      setAuthData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Attempt login
      const response = await authApi.login({ email, password });
      
      // Store token
      localStorage.setItem('admin_token', response.access_token);
      
      // Validate the token and get user data
      const validation = await authApi.validate();
      
      // Check if user is admin
      if (validation.role_id !== 1) {
        localStorage.removeItem('admin_token');
        return { success: false, error: 'Access denied. Admin privileges required.' };
      }

      // Get user data
      const userData = await userApi.getMe();
      
      setAuthData(validation);
      setUser(userData);
      
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      localStorage.removeItem('admin_token');
      
      if (error.response?.status === 401) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    setAuthData(null);
  };

  const value: AuthContextType = {
    user,
    authData,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user && !!authData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};