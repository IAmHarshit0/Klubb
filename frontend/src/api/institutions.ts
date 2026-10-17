import { api } from './client';
import type { Institution, Group } from '../types/api';

export interface InstitutionTree {
  departments: Group[];
  programmes: Group[];
  batches: Group[];
  clubs: Group[];
  general: Group[];
  allGroups: Group[];
}

export interface Announcement {
  _id: string;
  institutionId: string;
  senderId: string;
  targetType: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
}

export async function getInstitutions(): Promise<{ institutions: Institution[] }> {
  const response = await api.get<{ institutions: Institution[] }>('/institutions');
  return response.data;
}

export async function getInstitutionTree(
  institutionId: string
): Promise<{ institution: Institution; tree: InstitutionTree }> {
  const response = await api.get<{ institution: Institution; tree: InstitutionTree }>(
    `/institutions/${institutionId}/tree`
  );
  return response.data;
}

export async function getMyAnnouncements(): Promise<{ announcements: Announcement[] }> {
  const response = await api.get<{ announcements: Announcement[] }>('/me/announcements');
  return response.data;
}

export async function createInstitutionGroup(
  institutionId: string,
  data: {
    name: string;
    groupType?: 'programme' | 'batch' | 'department' | 'club' | 'general';
    visibility?: 'public' | 'campus_only' | 'restricted';
    postingPolicy?: 'all_members' | 'moderators_only';
    parentGroupId?: string;
  }
): Promise<{ group: Group }> {
  const response = await api.post<{ group: Group }>(`/institutions/${institutionId}/groups`, data);
  return response.data;
}
