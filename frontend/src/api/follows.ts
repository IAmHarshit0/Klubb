import { api } from './client';

export async function followUser(userId: string) {
  const response = await api.post('/follows', { targetType: 'user', targetId: userId });
  return response.data;
}

export async function followTopic(topicId: string) {
  const response = await api.post('/follows', { targetType: 'topic', targetId: topicId });
  return response.data;
}

export async function unfollowUser(userId: string) {
  const response = await api.delete(`/follows/user/${userId}`);
  return response.data;
}

export async function unfollowTopic(topicId: string) {
  const response = await api.delete(`/follows/topic/${topicId}`);
  return response.data;
}

export async function getFollows() {
  const response = await api.get('/follows');
  return response.data;
}
