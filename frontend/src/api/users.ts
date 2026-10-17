import { api } from './client';
import type { User } from '../types/api';

export async function getMe(): Promise<{ user: User }> {
  const response = await api.get<{ user: User }>('/me');
  return response.data;
}

export async function getUserProfile(userId: string): Promise<User> {
  const response = await api.get<User>(`/users/${userId}`);
  return response.data;
}

export async function updateFeedPreferences(prefs: {
  defaultFeedMode?: string;
  mutedTopicIds?: string[];
  mutedAuthorIds?: string[];
}): Promise<void> {
  await api.patch('/me/feed-preferences', prefs);
}

export async function updateConnectionPreferences(prefs: {
  availableForMentorship?: boolean;
  availableForReferrals?: boolean;
  availableForQuestions?: boolean;
  pauseIncomingRequests?: boolean;
}): Promise<void> {
  await api.patch('/me/connection-preferences', prefs);
}

export async function resetInterests(): Promise<void> {
  await api.post('/me/interests/reset');
}

export async function getConnectionPreferences(): Promise<{
  availableForMentorship: boolean;
  availableForReferrals: boolean;
  availableForQuestions: boolean;
  pauseIncomingRequests: boolean;
}> {
  const response = await api.get('/me/connection-preferences');
  return response.data;
}
