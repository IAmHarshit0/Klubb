import { api } from './client';

export async function reportContent(data: {
  targetType: 'post' | 'user' | 'group';
  targetId: string;
  reason: string;
}) {
  const response = await api.post('/reports', data);
  return response.data;
}
