import { api } from './client';
import type { FeedResponse } from '../types/api';

export type FeedTab = 'for-you' | 'alumni' | 'students';
export type FeedMode = 'baseline' | 'reranked';

export interface FeedParams {
  tab: FeedTab;
  mode: FeedMode;
  limit?: number;
  cursor?: string;
}

export async function getFeed(params: FeedParams): Promise<FeedResponse> {
  const response = await api.get<FeedResponse>('/feed', { params });
  return response.data;
}
