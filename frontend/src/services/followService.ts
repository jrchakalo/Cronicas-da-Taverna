import api from './api';
import { User } from '../types';

export const followService = {
  async getStatus(userId: number): Promise<{ following: boolean }> {
    const response = await api.get<{ following: boolean }>(`/follows/${userId}/status`);
    return response.data;
  },

  async follow(userId: number): Promise<{ following: boolean }> {
    const response = await api.post<{ following: boolean }>(`/follows/${userId}`);
    return response.data;
  },

  async unfollow(userId: number): Promise<{ following: boolean }> {
    const response = await api.delete<{ following: boolean }>(`/follows/${userId}`);
    return response.data;
  },

  async listFollowing(): Promise<{ following: Array<{ following: Pick<User, 'id' | 'username' | 'avatar' | 'bio'> }> }> {
    const response = await api.get<{
      following: Array<{ following: Pick<User, 'id' | 'username' | 'avatar' | 'bio'> }>;
    }>('/follows');
    return response.data;
  },
};
