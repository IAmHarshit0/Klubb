import { api } from './client';
import type { Comment } from '../types/api';

export interface CreatePostData {
  text: string;
  audienceType?: 'public' | 'campus' | 'group';
  audienceId?: string;
  institutionId?: string;
  topicLabels?: string[];
  media?: string[];
}

export async function createPost(data: CreatePostData) {
  const response = await api.post('/posts', data);
  return response.data;
}

export async function getPost(postId: string) {
  const response = await api.get(`/posts/${postId}`);
  return response.data;
}

export async function interactWithPost(postId: string, type: 'like' | 'save' | 'hide') {
  const response = await api.post(`/posts/${postId}/interactions`, { type });
  return response.data;
}

export async function addComment(postId: string, text: string): Promise<{ comment: Comment }> {
  const response = await api.post<{ comment: Comment }>(`/posts/${postId}/comments`, { text });
  return response.data;
}

export async function getComments(postId: string): Promise<{ comments: Comment[] }> {
  const response = await api.get<{ comments: Comment[] }>(`/posts/${postId}/comments`);
  return response.data;
}
