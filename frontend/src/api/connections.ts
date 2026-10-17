import { api } from './client';
import type { Connection } from '../types/api';

export async function getConnections(status?: string): Promise<{ connections: Connection[] }> {
  const params = status ? { status } : {};
  const response = await api.get<{ connections: Connection[] }>('/connections', { params });
  return response.data;
}

export async function sendConnectionRequest(
  recipientId: string,
  message?: string
): Promise<{ connection: Connection }> {
  const response = await api.post<{ connection: Connection }>('/connections', { recipientId, message });
  return response.data;
}

export async function respondToConnection(
  connectionId: string,
  status: 'accepted' | 'declined'
): Promise<{ connection: Connection }> {
  const response = await api.patch<{ connection: Connection }>(`/connections/${connectionId}`, { status });
  return response.data;
}

export async function cancelConnectionRequest(connectionId: string): Promise<void> {
  await api.post(`/connections/${connectionId}/cancel`);
}

export async function blockUser(userId: string): Promise<void> {
  await api.post(`/users/${userId}/block`);
}

export async function getConnectionWithUser(
  userId: string
): Promise<Connection | null> {
  try {
    const { connections } = await getConnections();
    return (
      connections.find(
        (c) => c.requesterId === userId || c.recipientId === userId
      ) || null
    );
  } catch {
    return null;
  }
}
