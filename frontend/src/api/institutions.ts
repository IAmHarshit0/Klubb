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

export interface RoleDefinition {
  _id: string;
  institutionId: string;
  name: string;
  permissions: string[];
  createdBy: string;
}

export interface RoleAssignment {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  userDepartment?: string;
  verificationStatus: string;
  roleDefinitionId: string;
  roleName: string;
  permissions: string[];
  assignedBy: string;
  createdAt: string;
}

export interface VerifiedMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  programme?: string;
  department?: string;
  batch?: string;
  verificationStatus: string;
}

export async function getInstitutionRoles(
  institutionId: string
): Promise<{ roles: RoleDefinition[] }> {
  const response = await api.get<{ roles: RoleDefinition[] }>(`/institutions/${institutionId}/roles`);
  return response.data;
}

export async function getInstitutionRoleAssignments(
  institutionId: string
): Promise<{ roleAssignments: RoleAssignment[] }> {
  const response = await api.get<{ roleAssignments: RoleAssignment[] }>(
    `/institutions/${institutionId}/role-assignments`
  );
  return response.data;
}

export async function createInstitutionRole(
  institutionId: string,
  data: { name: string; permissions: string[] }
): Promise<{ roleDefinition: RoleDefinition }> {
  const response = await api.post<{ roleDefinition: RoleDefinition }>(
    `/institutions/${institutionId}/roles`,
    data
  );
  return response.data;
}

export async function assignInstitutionRole(
  institutionId: string,
  data: { userId: string; roleDefinitionId: string }
): Promise<{ roleAssignment: any }> {
  const response = await api.post<{ roleAssignment: any }>(
    `/institutions/${institutionId}/role-assignments`,
    data
  );
  return response.data;
}

export async function getVerifiedMembers(
  institutionId: string
): Promise<{ members: VerifiedMember[] }> {
  const response = await api.get<{ members: VerifiedMember[] }>(
    `/institutions/${institutionId}/verified-members`
  );
  return response.data;
}

