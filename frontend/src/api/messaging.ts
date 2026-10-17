import { api } from './client';
import type { Conversation, Message } from '../types/api';

export async function getConversations(): Promise<{ conversations: Conversation[] }> {
  const response = await api.get<{ conversations: Conversation[] }>('/conversations');
  return response.data;
}

export async function getMessages(
  conversationId: string,
  before?: string
): Promise<{ messages: Message[] }> {
  const params = before ? { before } : {};
  const response = await api.get<{ messages: Message[] }>(
    `/conversations/${conversationId}/messages`,
    { params }
  );
  return response.data;
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<{ message: Message }> {
  const response = await api.post<{ message: Message }>(
    `/conversations/${conversationId}/messages`,
    { text }
  );
  return response.data;
}
