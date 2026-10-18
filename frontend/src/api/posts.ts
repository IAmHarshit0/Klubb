import { api } from './client';
import type { Comment, Post } from '../types/api';

export interface CreatePostData {
  text: string;
  audienceType?: 'public' | 'campus' | 'group';
  audienceId?: string;
  institutionId?: string;
  topicLabels?: string[];
  media?: string[];
}

export interface MyPostItem extends Post {
  commentCount?: number;
  likeCount?: number;
}

export async function createPost(data: CreatePostData) {
  const response = await api.post('/posts', data);
  return response.data;
}

export async function getPost(postId: string) {
  const response = await api.get(`/posts/${postId}`);
  return response.data;
}

export async function getMyPosts(): Promise<{ posts: MyPostItem[] }> {
  const response = await api.get<{ posts: MyPostItem[] }>('/posts/me');
  return response.data;
}

export async function deletePost(postId: string): Promise<{ message: string; postId: string }> {
  const response = await api.delete<{ message: string; postId: string }>(`/posts/${postId}`);
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
