import { client } from './client';
import {
  OrganizationRegistration,
  AffiliationRequest,
  InstitutionMetrics,
} from '../types/api';

// Platform Verifier: Organization Registration Queue
export async function getOrganizationRegistrations(params?: {
  status?: string;
  type?: string;
  q?: string;
}): Promise<{ registrations: OrganizationRegistration[] }> {
  const { data } = await client.get('/admin/organization-registrations', { params });
  return data;
}

export async function getOrganizationRegistration(id: string): Promise<{ registration: OrganizationRegistration }> {
  const { data } = await client.get(`/admin/organization-registrations/${id}`);
  return data;
}

export async function submitOrganizationRegistration(body: {
  name: string;
  type?: string;
  website?: string;
  country?: string;
  officialEmail: string;
  domain?: string;
  description?: string;
  evidence?: string;
  representativeName: string;
  representativeContact?: string;
}): Promise<{ message: string; registration: OrganizationRegistration }> {
  const { data } = await client.post('/organization-registrations', body);
  return data;
}

export async function reviewOrganizationRegistration(
  id: string,
  body: {
    status: 'approved' | 'rejected' | 'more_info_required' | 'suspended' | 'revoked';
    reviewReason?: string;
    assignedIdentifier?: string;
  }
): Promise<{ message: string; registration: OrganizationRegistration }> {
  const { data } = await client.patch(`/admin/organization-registrations/${id}`, body);
  return data;
}

export async function appointSuperAdmin(
  orgId: string,
  body: {
    userId: string;
    roleTitle?: string;
  }
): Promise<{ message: string; affiliation: any }> {
  const { data } = await client.post(`/admin/organizations/${orgId}/appoint-super-admin`, body);
  return data;
}

// Institutional Affiliation Requests Queue
export async function submitAffiliationRequest(body: {
  institutionId: string;
  role: 'Student' | 'Alumnus' | 'Faculty' | 'Staff' | 'Researcher';
  programme?: string;
  department?: string;
  batch?: string;
  officialEmail?: string;
  evidence?: string;
}): Promise<{ message: string; request: AffiliationRequest }> {
  const { data } = await client.post('/affiliation-requests', body);
  return data;
}

export async function getMyAffiliationRequests(): Promise<{ requests: AffiliationRequest[] }> {
  const { data } = await client.get('/me/affiliation-requests');
  return data;
}

export async function getInstitutionVerificationRequests(
  institutionId: string
): Promise<{ requests: AffiliationRequest[] }> {
  const { data } = await client.get(`/institutions/${institutionId}/verification-requests`);
  return data;
}

export async function reviewAffiliationRequest(
  requestId: string,
  body: {
    status: 'approved' | 'rejected' | 'more_info_required';
    reviewReason?: string;
  }
): Promise<{ message: string; request: AffiliationRequest }> {
  const { data } = await client.patch(`/affiliation-requests/${requestId}`, body);
  return data;
}

// Institutional Metrics (Section 6)
export async function getInstitutionMetrics(institutionId: string): Promise<{
  institutionId: string;
  institutionName: string;
  metrics: InstitutionMetrics;
}> {
  const { data } = await client.get(`/institutions/${institutionId}/metrics`);
  return data;
}
