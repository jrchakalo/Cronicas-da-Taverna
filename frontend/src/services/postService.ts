import api from './api';
import { 
  Post, 
  PostsResponse, 
  CreatePostRequest, 
  UpdatePostRequest,
  ReportedPostsResponse
} from '../types';

export interface PostQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  tags?: string | string[];
  authorId?: number;
  published?: boolean;
}

export const postService = {
  async getPosts(query: PostQuery = {}): Promise<PostsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get<PostsResponse>(`/posts?${params.toString()}`);
    return response.data;
  },

  async getPostById(id: number): Promise<{ post: Post }> {
    const response = await api.get<{ post: Post }>(`/posts/${id}`);
    return response.data;
  },

  async createPost(postData: CreatePostRequest): Promise<{ message: string; post: Post }> {
    const response = await api.post<{ message: string; post: Post }>('/posts', postData);
    return response.data;
  },

  async updatePost(id: number, postData: UpdatePostRequest): Promise<{ message: string; post: Post }> {
    const response = await api.put<{ message: string; post: Post }>(`/posts/${id}`, postData);
    return response.data;
  },

  async deletePost(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/posts/${id}`);
    return response.data;
  },

  async likePost(id: number): Promise<{ message: string; liked: boolean }> {
    const response = await api.post<{ message: string; liked: boolean }>(`/posts/${id}/like`);
    return response.data;
  },

  async reportPost(id: number, reason?: string | null): Promise<{ message: string; reportCount: number }> {
    const response = await api.post<{ message: string; reportCount: number }>(
      `/posts/${id}/report`,
      { reason: reason ?? null }
    );
    return response.data;
  },

  async getReportedPosts(): Promise<ReportedPostsResponse> {
    const response = await api.get<ReportedPostsResponse>('/posts/moderation/reports');
    return response.data;
  },

  async getFollowingPosts(query: PostQuery = {}): Promise<PostsResponse> {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const response = await api.get<PostsResponse>(`/posts/following${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  async hidePost(id: number): Promise<{ message: string; post: Post }> {
    const response = await api.post<{ message: string; post: Post }>(`/posts/${id}/hide`);
    return response.data;
  },
};