import { api } from './client';
import type { DiscoveryPerson, Organisation } from '../types/api';

export interface PeopleSearchParams {
  q?: string;
  company?: string;
  role?: string;
  skill?: string;
  institution?: string;
  programme?: string;
  batch?: string;
}

export async function discoverPeople(
  params: PeopleSearchParams
): Promise<{ results: DiscoveryPerson[] }> {
  // Remove empty string params to avoid leaking empty filters
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v && v.trim().length > 0) clean[k] = v.trim();
  }
  const response = await api.get<{ results: DiscoveryPerson[] }>('/discover/people', { params: clean });
  return response.data;
}

export async function discoverOrganisations(q?: string): Promise<{ organisations: Organisation[] }> {
  const params = q ? { q } : {};
  const response = await api.get<{ organisations: Organisation[] }>('/discover/organisations', { params });
  return response.data;
}
