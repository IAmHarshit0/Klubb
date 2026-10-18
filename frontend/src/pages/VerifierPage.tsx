import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  UserPlus,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
  getOrganizationRegistrations,
  reviewOrganizationRegistration,
  appointSuperAdmin,
  submitOrganizationRegistration,
} from '../api/verification';
import { OrganizationRegistration, DEMO_USERS } from '../types/api';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

export function VerifierPage() {
  const { userId, switchUser } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const isVerifier = userId === 'usr-verifier-001';

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReg, setSelectedReg] = useState<OrganizationRegistration | null>(null);

  // Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | 'more_info_required'>('approved');
  const [assignedCode, setAssignedCode] = useState('');
  const [reviewReason, setReviewReason] = useState('');

  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [appointOrgId, setAppointOrgId] = useState('');
  const [appointOrgName, setAppointOrgName] = useState('');
  const [selectedAppointUserId, setSelectedAppointUserId] = useState('usr-admin-001');

  const [isNewOrgModalOpen, setIsNewOrgModalOpen] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    type: 'university',
    website: '',
    country: '',
    officialEmail: '',
    representativeName: '',
    description: '',
    evidence: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['adminOrganizationRegistrations', filterStatus, searchQuery],
    queryFn: () =>
      getOrganizationRegistrations({
        status: filterStatus === 'all' ? undefined : filterStatus,
        q: searchQuery || undefined,
      }),
    enabled: isVerifier,
  });

  const reviewMutation = useMutation({
    mutationFn: (vars: { id: string; status: 'approved' | 'rejected' | 'more_info_required'; assignedIdentifier?: string; reviewReason?: string }) =>
      reviewOrganizationRegistration(vars.id, {
        status: vars.status,
        assignedIdentifier: vars.assignedIdentifier,
        reviewReason: vars.reviewReason,
      }),
    onSuccess: (res) => {
      showToast(res.message || 'Registration updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminOrganizationRegistrations'] });
      setIsReviewModalOpen(false);
      setSelectedReg(null);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to update registration', 'error');
    },
  });

  const appointMutation = useMutation({
    mutationFn: (vars: { orgId: string; userId: string }) =>
      appointSuperAdmin(vars.orgId, { userId: vars.userId }),
    onSuccess: (res) => {
      showToast(res.message || 'Super Admin appointed successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminOrganizationRegistrations'] });
      setIsAppointModalOpen(false);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to appoint Super Admin', 'error');
    },
  });

  const submitOrgMutation = useMutation({
    mutationFn: submitOrganizationRegistration,
    onSuccess: () => {
      showToast('New organization onboarding request submitted', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminOrganizationRegistrations'] });
      setIsNewOrgModalOpen(false);
      setNewOrgForm({
        name: '',
        type: 'university',
        website: '',
        country: '',
        officialEmail: '',
        representativeName: '',
        description: '',
        evidence: '',
      });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to submit organization', 'error');
    },
  });

  if (!isVerifier) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={36} />
        </div>
        <h2 className="text-2xl font-bold text-mercury-black">Campus Network Verifier Portal</h2>
        <p className="text-sm text-mercury-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">
          Platform-level institutional and company verification is reserved for authorized Campus Network Operators. Switch to the platform verifier identity to manage the verification queue.
        </p>
        <div className="mt-8">
          <Button
            variant="primary"
            onClick={() => switchUser('usr-verifier-001')}
            className="inline-flex items-center gap-2"
          >
            <ShieldCheck size={18} /> Switch to Dr. Aris Thorne (Platform Verifier)
          </Button>
        </div>
      </div>
    );
  }

  const registrations = data?.registrations || [];
  const pendingCount = registrations.filter((r) => r.status === 'pending').length;
  const underReviewCount = registrations.filter((r) => r.status === 'under_review').length;
  const approvedCount = registrations.filter((r) => r.status === 'approved').length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-mercury-gray-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <ShieldCheck size={20} />
            </span>
            <h1 className="text-2xl font-extrabold text-mercury-black">Platform Verifier Dashboard</h1>
          </div>
          <p className="text-xs text-mercury-gray-500 mt-1">
            Authoritative platform-level review of institutional and organizational onboarding requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsNewOrgModalOpen(true)}
            className="flex items-center gap-2 text-xs"
          >
            <Plus size={16} /> Submit Onboarding Request
          </Button>
        </div>
      </div>

      {/* ── METRICS ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-mercury-gray-200 shadow-mercury-xs">
          <p className="text-xs font-semibold text-mercury-gray-500 uppercase tracking-wider">Pending Action</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">{pendingCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-mercury-gray-200 shadow-mercury-xs">
          <p className="text-xs font-semibold text-mercury-gray-500 uppercase tracking-wider">Under Review</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">{underReviewCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-mercury-gray-200 shadow-mercury-xs">
          <p className="text-xs font-semibold text-mercury-gray-500 uppercase tracking-wider">Verified Entities</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">{approvedCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-mercury-gray-200 shadow-mercury-xs">
          <p className="text-xs font-semibold text-mercury-gray-500 uppercase tracking-wider">Total Submissions</p>
          <p className="text-3xl font-extrabold text-mercury-black mt-2">{registrations.length}</p>
        </div>
      </div>

      {/* ── CONTROLS & SEARCH ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-mercury-gray-200 shadow-mercury-xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mercury-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by organization or domain..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-mercury-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-mercury-black/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'pending', 'under_review', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-mercury-black text-white'
                  : 'bg-mercury-gray-100 text-mercury-gray-600 hover:bg-mercury-gray-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── QUEUE LIST ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-mercury-gray-200 shadow-mercury-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-mercury-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-mercury-black flex items-center gap-2">
            <Building2 size={16} className="text-mercury-gray-500" /> Verification Requests Queue
          </h2>
          <span className="text-xs text-mercury-gray-400 font-mono">
            {registrations.length} record{registrations.length === 1 ? '' : 's'}
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center">
            <Spinner />
          </div>
        ) : registrations.length === 0 ? (
          <div className="py-16 text-center text-mercury-gray-400 text-xs">
            No organization registration requests match this filter.
          </div>
        ) : (
          <div className="divide-y divide-mercury-gray-100">
            {registrations.map((reg) => (
              <div
                key={reg._id}
                className="p-6 hover:bg-mercury-gray-50/60 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-base text-mercury-black">{reg.name}</h3>
                    <Badge variant={reg.type === 'company' ? 'secondary' : 'default'} className="text-[10px] capitalize">
                      {reg.type}
                    </Badge>
                    {reg.assignedIdentifier && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                        {reg.assignedIdentifier}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        reg.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : reg.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : reg.status === 'under_review'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {reg.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-mercury-gray-600 line-clamp-2">
                    {reg.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-mercury-gray-500 pt-1 flex-wrap">
                    <span>
                      Rep: <strong className="text-mercury-gray-700">{reg.representativeName}</strong> ({reg.officialEmail})
                    </span>
                    {reg.website && (
                      <a
                        href={reg.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        {reg.website} <ExternalLink size={10} />
                      </a>
                    )}
                    {reg.country && <span>Country: {reg.country}</span>}
                    <span>Submitted: {new Date(reg.createdAt).toLocaleDateString()}</span>
                  </div>

                  {reg.evidence && (
                    <div className="mt-2 text-[11px] bg-mercury-gray-50 p-2 rounded-lg border border-mercury-gray-200 font-mono text-mercury-gray-700">
                      <strong>Submitted Evidence:</strong> {reg.evidence}
                    </div>
                  )}

                  {reg.reviewReason && (
                    <div className="text-[11px] text-mercury-gray-500 italic">
                      Reviewer Note: "{reg.reviewReason}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start md:self-center flex-shrink-0">
                  {reg.status !== 'approved' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setSelectedReg(reg);
                        setReviewAction('approved');
                        setAssignedCode(reg.assignedIdentifier || reg.name.slice(0, 4).toUpperCase());
                        setReviewReason('');
                        setIsReviewModalOpen(true);
                      }}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle size={14} className="mr-1.5" /> Approve
                    </Button>
                  )}

                  {reg.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAppointOrgId(reg.assignedIdentifier ? `inst-${reg.assignedIdentifier.toLowerCase()}` : `inst-apex-001`);
                        setAppointOrgName(reg.name);
                        setIsAppointModalOpen(true);
                      }}
                      className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <UserPlus size={14} className="mr-1.5" /> Appoint Super Admin
                    </Button>
                  )}

                  {reg.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedReg(reg);
                        setReviewAction('rejected');
                        setReviewReason('');
                        setIsReviewModalOpen(true);
                      }}
                      className="text-xs text-rose-600 hover:bg-rose-50"
                    >
                      <XCircle size={14} className="mr-1.5" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── REVIEW MODAL ──────────────────────────────────────────────────── */}
      {isReviewModalOpen && selectedReg && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title={`Review Request: ${selectedReg.name}`}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-mercury-gray-700">Decision Status</label>
              <select
                value={reviewAction}
                onChange={(e) => setReviewAction(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-mercury-black/20"
              >
                <option value="approved">Approved (Issue Verified Badge)</option>
                <option value="more_info_required">More Information Required</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {reviewAction === 'approved' && (
              <div>
                <label className="text-xs font-semibold text-mercury-gray-700">
                  Assign Human-Readable Organization Identifier (Short Code)
                </label>
                <input
                  type="text"
                  value={assignedCode}
                  onChange={(e) => setAssignedCode(e.target.value.toUpperCase())}
                  placeholder="e.g. APEX, STR, IITD, MIT"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-mercury-black/20"
                />
                <p className="text-[11px] text-mercury-gray-500 mt-1">
                  Unique platform namespace code for navigation and institutional badging.
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-mercury-gray-700">Audit Notes / Decision Reason</label>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="Document verification check details or rejection grounds..."
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-mercury-black/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-mercury-gray-100">
              <Button variant="ghost" onClick={() => setIsReviewModalOpen(false)} size="sm">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={reviewMutation.isPending}
                onClick={() =>
                  reviewMutation.mutate({
                    id: selectedReg._id,
                    status: reviewAction,
                    assignedIdentifier: reviewAction === 'approved' ? assignedCode : undefined,
                    reviewReason,
                  })
                }
              >
                Confirm Review Decision
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── APPOINT SUPER ADMIN MODAL ─────────────────────────────────────── */}
      {isAppointModalOpen && (
        <Modal
          isOpen={isAppointModalOpen}
          onClose={() => setIsAppointModalOpen(false)}
          title={`Appoint Founding Super Admin for ${appointOrgName}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-mercury-gray-600">
              The founding Super Admin is appointed exclusively by the Campus Network Verifier. This grants institutional governance without compromising private member communications.
            </p>

            <div>
              <label className="text-xs font-semibold text-mercury-gray-700">Select Platform User</label>
              <select
                value={selectedAppointUserId}
                onChange={(e) => setSelectedAppointUserId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-mercury-black/20"
              >
                {DEMO_USERS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-mercury-gray-100">
              <Button variant="ghost" onClick={() => setIsAppointModalOpen(false)} size="sm">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={appointMutation.isPending}
                onClick={() =>
                  appointMutation.mutate({
                    orgId: appointOrgId,
                    userId: selectedAppointUserId,
                  })
                }
              >
                Appoint as Super Admin
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── SUBMIT NEW ORGANIZATION MODAL ─────────────────────────────────── */}
      {isNewOrgModalOpen && (
        <Modal
          isOpen={isNewOrgModalOpen}
          onClose={() => setIsNewOrgModalOpen(false)}
          title="Submit Organization Onboarding Request"
        >
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className="text-xs font-semibold text-mercury-gray-700">Official Organization Name *</label>
              <input
                type="text"
                value={newOrgForm.name}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                placeholder="e.g. Stanford University or OpenAI"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-mercury-gray-700">Organization Type</label>
                <select
                  value={newOrgForm.type}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs"
                >
                  <option value="university">University / College</option>
                  <option value="company">Company / Enterprise</option>
                  <option value="institution">Research Institution</option>
                  <option value="organization">Non-Profit / Professional</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-mercury-gray-700">Country</label>
                <input
                  type="text"
                  value={newOrgForm.country}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, country: e.target.value })}
                  placeholder="United States"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-mercury-gray-700">Official Email *</label>
                <input
                  type="email"
                  value={newOrgForm.officialEmail}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, officialEmail: e.target.value })}
                  placeholder="registrar@domain.edu"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-mercury-gray-700">Website URL</label>
                <input
                  type="url"
                  value={newOrgForm.website}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-mercury-gray-700">Authorized Representative Name *</label>
              <input
                type="text"
                value={newOrgForm.representativeName}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, representativeName: e.target.value })}
                placeholder="Dr. Jane Doe"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-mercury-gray-700">Organization Description</label>
              <textarea
                value={newOrgForm.description}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, description: e.target.value })}
                placeholder="Brief mission, campus, or corporate overview..."
                rows={2}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-mercury-gray-700">Supporting Evidence / Accreditation Proof</label>
              <textarea
                value={newOrgForm.evidence}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, evidence: e.target.value })}
                placeholder="Accreditation board registry link, corporate SEC filing ID, or government charter..."
                rows={2}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-mercury-gray-300 text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-mercury-gray-100">
              <Button variant="ghost" onClick={() => setIsNewOrgModalOpen(false)} size="sm">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={submitOrgMutation.isPending}
                onClick={() => submitOrgMutation.mutate(newOrgForm)}
              >
                Submit for Verifier Review
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
