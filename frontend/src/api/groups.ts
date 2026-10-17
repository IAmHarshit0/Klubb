import { api } from './client';

export async function getGroup(groupId: string) {
  const response = await api.get(`/groups/${groupId}`);
  return response.data;
}

export async function requestGroupAccess(groupId: string) {
  const response = await api.post(`/groups/${groupId}/access-requests`);
  return response.data;
}

export async function reviewAccessRequest(
  requestId: string,
  status: 'approved' | 'declined'
) {
  const response = await api.patch(`/group-access-requests/${requestId}`, { status });
  return response.data;
}

export async function postToGroup(
  groupId: string,
  data: { text: string; topicLabels?: string[] }
) {
  const response = await api.post(`/groups/${groupId}/posts`, data);
  return response.data;
}

export async function updateGroup(
  groupId: string,
  data: { name?: string; visibility?: string; postingPolicy?: string }
) {
  const response = await api.patch(`/groups/${groupId}`, data);
  return response.data;
}

export async function getGroupPosts(groupId: string) {
  const response = await api.get<{ posts: any[] }>(`/groups/${groupId}/posts`);
  return response.data;
}
