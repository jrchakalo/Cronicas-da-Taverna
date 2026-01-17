import api from './api';
import { PublicProfileResponse } from '../types';

export const userService = {
  async getPublicProfile(id: number): Promise<PublicProfileResponse> {
    const response = await api.get<PublicProfileResponse>(`/users/${id}`);
    return response.data;
  },
};
