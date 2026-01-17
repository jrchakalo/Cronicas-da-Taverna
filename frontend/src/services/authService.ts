import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User, ChangePasswordRequest } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  async getProfile(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>('/auth/profile');
    return response.data;
  },

  async updateProfile(userData: Partial<User>): Promise<{ message: string; user: User }> {
    const response = await api.put<{ message: string; user: User }>('/auth/profile', userData);
    return response.data;
  },

  async changePassword(payload: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/change-password', payload);
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },
};