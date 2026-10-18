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

export async function discoverInstitutions(q?: string): Promise<{
  institutions: Array<{
    _id: string;
    name: string;
    displayName: string;
    slug: string;
    type?: string;
    verifiedMemberCount: number;
    groupCount: number;
  }>;
}> {
  const params = q ? { q } : {};
  const response = await api.get('/discover/institutions', { params });
  return response.data;
}

export async function discoverGroups(params?: {
  q?: string;
  institutionId?: string;
  groupType?: string;
}): Promise<{
  groups: Array<{
    _id: string;
    name: string;
    groupType: string;
    visibility: string;
    institutionId: string;
    memberCount: number;
    isMember: boolean;
  }>;
}> {
  const response = await api.get('/discover/groups', { params });
  return response.data;
}

export async function discoverPosts(params?: {
  q?: string;
  topic?: string;
}): Promise<{
  posts: Array<{
    id: string;
    text: string;
    media: string[];
    audienceType: string;
    topicLabels: string[];
    createdAt: string;
    author: {
      id: string;
      name: string;
      role: string;
      verificationStatus: string;
    };
  }>;
}> {
  const response = await api.get('/discover/posts', { params });
  return response.data;
}

