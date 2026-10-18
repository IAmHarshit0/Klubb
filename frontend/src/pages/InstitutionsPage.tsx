import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  getInstitutions,
  getInstitutionTree,
  getMyAnnouncements,
  createInstitutionGroup,
  getInstitutionRoles,
  getInstitutionRoleAssignments,
  createInstitutionRole,
  assignInstitutionRole,
  getVerifiedMembers,
  Announcement,
  RoleDefinition,
  RoleAssignment,
  VerifiedMember,
} from '../api/institutions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import { PageSpinner } from '../components/ui/Spinner';
import {
  Building2,
  Users,
  Lock,
  Globe,
  Bell,
  Plus,
  ArrowRight,
  ShieldCheck,
  FolderTree,
  Sparkles,
  UserCheck,
  Award,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import type { Group } from '../types/api';

export function InstitutionsPage() {
  const { userId, currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'communities' | 'announcements' | 'governance'>('communities');
  const [selectedInstId, setSelectedInstId] = useState<string>('inst-apex-001');

  // Create group modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<
    'programme' | 'batch' | 'department' | 'club' | 'general'
  >('club');
  const [visibility, setVisibility] = useState<'public' | 'campus_only' | 'restricted'>(
    'campus_only'
  );

  // Role creation & assignment modals state
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'verify_affiliation',
    'publish_announcement',
  ]);

  const [assignRoleOpen, setAssignRoleOpen] = useState(false);
  const [selectedTargetUserId, setSelectedTargetUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  // 1. Fetch institutions
  const { data: instData, isLoading: loadingInsts } = useQuery({
    queryKey: ['institutions'],
    queryFn: getInstitutions,
  });

  const institutions = instData?.institutions || [];
  const activeInstitution = institutions.find((i) => i._id === selectedInstId) || institutions[0];

  // 2. Fetch hierarchy tree for active institution
  const { data: treeData, isLoading: loadingTree } = useQuery({
    queryKey: ['institution-tree', activeInstitution?._id || selectedInstId],
    queryFn: () => getInstitutionTree(activeInstitution?._id || selectedInstId),
    enabled: !!(activeInstitution?._id || selectedInstId),
  });

  // 3. Fetch announcements
  const { data: annData, isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['announcements', userId],
    queryFn: getMyAnnouncements,
  });

  // 4. Fetch Roles & Role Assignments for the institution
  const { data: rolesData, isLoading: loadingRoles } = useQuery({
    queryKey: ['institution-roles', activeInstitution?._id || selectedInstId],
    queryFn: () => getInstitutionRoles(activeInstitution?._id || selectedInstId),
    enabled: !!(activeInstitution?._id || selectedInstId),
  });

  const { data: assignmentsData, isLoading: loadingAssignments } = useQuery({
    queryKey: ['institution-role-assignments', activeInstitution?._id || selectedInstId],
    queryFn: () => getInstitutionRoleAssignments(activeInstitution?._id || selectedInstId),
    enabled: !!(activeInstitution?._id || selectedInstId),
  });

  // 5. Fetch Verified Members for assignment dropdown
  const { data: membersData } = useQuery({
    queryKey: ['institution-verified-members', activeInstitution?._id || selectedInstId],
    queryFn: () => getVerifiedMembers(activeInstitution?._id || selectedInstId),
    enabled: !!(activeInstitution?._id || selectedInstId),
  });

  const announcements = annData?.announcements || [];
  const tree = treeData?.tree;
  const roles = rolesData?.roles || [];
  const roleAssignments = assignmentsData?.roleAssignments || [];
  const verifiedMembers = membersData?.members || [];

  // Superadmin check
  const isSuperAdmin = currentUser?.affiliations?.some(
    (a) => a.institutionId === (activeInstitution?._id || selectedInstId) && a.role === 'Admin'
  );

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (data: {
      name: string;
      groupType: 'programme' | 'batch' | 'department' | 'club' | 'general';
      visibility: 'public' | 'campus_only' | 'restricted';
    }) => createInstitutionGroup(activeInstitution?._id || selectedInstId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['institution-tree'] });
      toast(`Group "${data.group.name}" created successfully!`, 'success');
      setCreateOpen(false);
      setGroupName('');
      navigate(`/groups/${data.group._id}`);
    },
    onError: (e: any) => toast(e.message, 'error'),
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: { name: string; permissions: string[] }) =>
      createInstitutionRole(activeInstitution?._id || selectedInstId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['institution-roles'] });
      toast(`Role "${data.roleDefinition.name}" defined successfully!`, 'success');
      setCreateRoleOpen(false);
      setNewRoleName('');
    },
    onError: (e: any) => toast(e.message, 'error'),
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: (data: { userId: string; roleDefinitionId: string }) =>
      assignInstitutionRole(activeInstitution?._id || selectedInstId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-role-assignments'] });
      toast('Role assigned successfully to member!', 'success');
      setAssignRoleOpen(false);
      setSelectedTargetUserId('');
      setSelectedRoleId('');
    },
    onError: (e: any) => toast(e.message, 'error'),
  });

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast('Please enter a group name', 'error');
      return;
    }
    createGroupMutation.mutate({
      name: groupName.trim(),
      groupType,
      visibility,
    });
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast('Please enter a role name', 'error');
      return;
    }
    createRoleMutation.mutate({
      name: newRoleName.trim(),
      permissions: selectedPermissions,
    });
  };

  const handleAssignRole = () => {
    if (!selectedTargetUserId || !selectedRoleId) {
      toast('Please select both a person and a role', 'error');
      return;
    }
    assignRoleMutation.mutate({
      userId: selectedTargetUserId,
      roleDefinitionId: selectedRoleId,
    });
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  if (loadingInsts || (loadingTree && !treeData)) return <PageSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Hero */}
      <div className="mercury-card p-8 mb-8 relative overflow-hidden">
        <div
          className="mercury-blob w-64 h-64 -top-20 -right-20 opacity-30"
          style={{ animation: 'blobFloat 12s ease-in-out infinite' }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="spatial-label">ORGANIZING LAYER</span>
              <span className="text-mercury-gray-300">·</span>
              <span className="text-xs text-mercury-gray-500 font-medium">Campus Network v3.0</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-mercury-black mb-2">
              {activeInstitution?.displayName || 'Apex University'}
            </h1>

            <p className="text-sm text-mercury-gray-500 max-w-lg leading-relaxed">
              Institution-aware spaces, official academic announcements, and verified student &
              alumni communities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <Button
                variant="secondary"
                onClick={() => setCreateRoleOpen(true)}
                className="flex items-center gap-2"
              >
                <Award size={15} />
                Define Role
              </Button>
            )}
            <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
              <Plus size={15} />
              Create Community
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center justify-between border-b border-mercury-gray-100 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('communities')}
            className={`feed-tab flex items-center gap-2 ${
              activeTab === 'communities' ? 'active' : ''
            }`}
          >
            <FolderTree size={15} />
            <span>Communities & Groups</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`feed-tab flex items-center gap-2 ${
              activeTab === 'announcements' ? 'active' : ''
            }`}
          >
            <Bell size={15} />
            <span>Campus Announcements</span>
            {announcements.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-mercury-black text-white text-[10px] font-bold">
                {announcements.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('governance')}
            className={`feed-tab flex items-center gap-2 ${
              activeTab === 'governance' ? 'active' : ''
            }`}
          >
            <ShieldCheck size={15} />
            <span>Leadership & Roles</span>
            {roleAssignments.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                {roleAssignments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Communities Tree */}
      {activeTab === 'communities' && tree && (
        <div className="space-y-8">
          {/* Departments */}
          {tree.departments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-mercury-black" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-mercury-gray-500">
                  Academic Departments
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tree.departments.map((dept) => (
                  <GroupCard key={dept._id} group={dept} />
                ))}
              </div>
            </div>
          )}

          {/* Clubs & Student Organizations */}
          {tree.clubs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-mercury-black" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-mercury-gray-500">
                  Clubs & Student Societies
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tree.clubs.map((club) => (
                  <GroupCard key={club._id} group={club} />
                ))}
              </div>
            </div>
          )}

          {/* Programmes & Batches */}
          {(tree.programmes.length > 0 || tree.batches.length > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-mercury-black" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-mercury-gray-500">
                  Programmes & Cohorts
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...tree.programmes, ...tree.batches].map((item) => (
                  <GroupCard key={item._id} group={item} />
                ))}
              </div>
            </div>
          )}

          {/* General Communities */}
          {tree.general.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={16} className="text-mercury-black" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-mercury-gray-500">
                  Open Campus Spaces
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tree.general.map((gen) => (
                  <GroupCard key={gen._id} group={gen} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Campus Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="mercury-card p-12 text-center text-mercury-gray-400">
              <Bell size={24} className="mx-auto mb-2 text-mercury-gray-300" />
              <p className="text-sm font-semibold text-mercury-black">No official announcements</p>
              <p className="text-xs mt-1">Verified administrative broadcasts will appear here.</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <div key={ann._id} className="mercury-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      Official Broadcast
                    </span>
                    <span className="text-xs text-mercury-gray-400">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <ShieldCheck size={14} className="text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-mercury-black mb-1">{ann.title}</h3>
                <p className="text-xs text-mercury-gray-700 leading-relaxed whitespace-pre-wrap">
                  {ann.body}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Leadership & Delegated Roles */}
      {activeTab === 'governance' && (
        <div className="space-y-8">
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] tracking-widest font-black uppercase text-purple-700">
                  Institutional RBAC
                </span>
                <span className="text-purple-300">·</span>
                <span className="text-xs text-purple-600 font-medium">Campus Network Spec §4.3</span>
              </div>
              <h2 className="text-lg font-bold text-mercury-black">Delegated Roles & Governance</h2>
              <p className="text-xs text-mercury-gray-600 mt-0.5">
                Super Admins define institutional roles and delegate them to verified alumni, students, or staff.
              </p>
            </div>
            {isSuperAdmin && (
              <div className="flex items-center gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCreateRoleOpen(true)}
                  className="bg-white flex items-center gap-1.5"
                >
                  <Award size={14} />
                  Define Role
                </Button>
                <Button
                  size="sm"
                  onClick={() => setAssignRoleOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <UserCheck size={14} />
                  Assign Role to Member
                </Button>
              </div>
            )}
          </div>

          {/* Active Delegated Role Assignments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-mercury-gray-500 flex items-center gap-1.5">
                <Users size={14} />
                Current Role Holders ({roleAssignments.length})
              </h3>
            </div>

            {roleAssignments.length === 0 ? (
              <div className="mercury-card p-8 text-center text-mercury-gray-400">
                <Award size={24} className="mx-auto mb-2 text-mercury-gray-300" />
                <p className="text-sm font-semibold text-mercury-black">No roles assigned yet</p>
                <p className="text-xs mt-1">Super administrators can assign defined roles to verified campus people.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleAssignments.map((assignment) => (
                  <div key={assignment._id} className="mercury-card p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          <Award size={11} />
                          {assignment.roleName}
                        </span>
                        <span className="text-[10px] text-mercury-gray-400 font-mono">
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-10 h-10 rounded-full bg-mercury-black text-white flex items-center justify-center font-bold text-sm">
                          {assignment.userName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-mercury-black">{assignment.userName}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-mercury-gray-500 font-medium">
                              {assignment.userRole || 'User'}
                            </span>
                            {assignment.verificationStatus === 'institution-verified' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                                <CheckCircle2 size={11} />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {assignment.permissions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-mercury-gray-100">
                          <p className="text-[10px] uppercase font-bold text-mercury-gray-400 mb-1.5 tracking-wider">
                            Granted Permissions
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {assignment.permissions.map((perm) => (
                              <span
                                key={perm}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-mercury-gray-100 text-mercury-gray-700 font-mono"
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Defined Roles in the Institution */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-mercury-gray-500 flex items-center gap-1.5">
                <KeyRound size={14} />
                Defined Role Templates ({roles.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {roles.map((r) => (
                <div key={r._id} className="mercury-card p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-mercury-black mb-1">{r.name}</h4>
                    <p className="text-[11px] text-mercury-gray-500 mb-2 font-mono">
                      Scope: {r.institutionId}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {r.permissions.map((p) => (
                        <span
                          key={p}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Community" size="md">
        <div className="space-y-4">
          <Input
            label="Community Name"
            placeholder="e.g. Apex AI & Robotics Club, Fintech Society"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-mercury-gray-700 mb-1.5 uppercase tracking-wide">
              Community Type
            </label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value as any)}
              className="mercury-input"
            >
              <option value="club">Club / Student Society</option>
              <option value="department">Academic Department</option>
              <option value="programme">Degree Programme</option>
              <option value="batch">Graduating Batch / Cohort</option>
              <option value="general">General Campus Space</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-mercury-gray-700 mb-1.5 uppercase tracking-wide">
              Visibility & Access Gating
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="mercury-input"
            >
              <option value="campus_only">Campus Only (Verified Institution Members)</option>
              <option value="restricted">Restricted (Requires Supervisor Request Approval)</option>
              <option value="public">Public (Open Discovery)</option>
            </select>
            <p className="text-[11px] text-mercury-gray-400 mt-1">
              Restricted groups enforce server-side supervisor approval before post viewing or publishing.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={createGroupMutation.isPending}
              disabled={!groupName.trim()}
              onClick={handleCreateGroup}
            >
              Create Community
            </Button>
          </div>
        </div>
      </Modal>

      {/* Define Role Modal (Super Admin) */}
      <Modal isOpen={createRoleOpen} onClose={() => setCreateRoleOpen(false)} title="Define Institutional Role" size="md">
        <div className="space-y-4">
          <Input
            label="Role Name"
            placeholder="e.g. Placement Officer, Alumni Coordinator, Ethics Reviewer"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-mercury-gray-700 mb-1.5 uppercase tracking-wide">
              Select Permissions to Grant
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-xl border border-mercury-gray-100 bg-mercury-gray-50">
              {[
                { id: 'verify_affiliation', label: 'Verify Affiliations (Student & Faculty)' },
                { id: 'verify_employment', label: 'Verify Employer Claims' },
                { id: 'publish_announcement', label: 'Publish Official Campus Announcements' },
                { id: 'moderate_student_groups', label: 'Moderate Student Communities' },
                { id: 'host_campus_events', label: 'Host & Authorize Campus Events' },
                { id: 'view_audit_logs', label: 'View Governance Audit Logs' },
              ].map((p) => (
                <label key={p.id} className="flex items-center gap-2.5 text-xs text-mercury-black cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(p.id)}
                    onChange={() => togglePermission(p.id)}
                    className="rounded border-mercury-gray-300 text-mercury-black focus:ring-mercury-black"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" size="sm" onClick={() => setCreateRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={createRoleMutation.isPending}
              disabled={!newRoleName.trim()}
              onClick={handleCreateRole}
            >
              Define Role
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Role Modal (Super Admin) */}
      <Modal isOpen={assignRoleOpen} onClose={() => setAssignRoleOpen(false)} title="Assign Role to Verified Person" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-mercury-gray-700 mb-1.5 uppercase tracking-wide">
              Select Verified Person (Defaults to User if unassigned)
            </label>
            <select
              value={selectedTargetUserId}
              onChange={(e) => setSelectedTargetUserId(e.target.value)}
              className="mercury-input"
            >
              <option value="">-- Choose a person --</option>
              {verifiedMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} ({m.role || 'User'} · {m.department || m.programme || 'General'} · {m.verificationStatus})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-mercury-gray-400 mt-1">
              Supports verified alumni, students, faculty, or registered campus users.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-mercury-gray-700 mb-1.5 uppercase tracking-wide">
              Role to Assign
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="mercury-input"
            >
              <option value="">-- Choose defined role --</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.permissions.length} permissions)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" size="sm" onClick={() => setAssignRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={assignRoleMutation.isPending}
              disabled={!selectedTargetUserId || !selectedRoleId}
              onClick={handleAssignRole}
            >
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  const isRestricted = group.visibility === 'restricted';

  return (
    <div className="mercury-card p-5 flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] tracking-widest uppercase font-bold text-mercury-gray-400">
            {group.groupType}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
              isRestricted
                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                : 'bg-mercury-gray-100 text-mercury-gray-700'
            }`}
          >
            {isRestricted ? <Lock size={10} /> : <Globe size={10} />}
            {group.visibility.replace('_', ' ')}
          </span>
        </div>

        <h3 className="text-base font-bold text-mercury-black tracking-tight">{group.name}</h3>
        <p className="text-xs text-mercury-gray-500 mt-1">
          Posting policy: {group.postingPolicy.replace('_', ' ')}
        </p>
      </div>

      <div className="pt-2 border-t border-mercury-gray-50 flex items-center justify-between">
        <Link
          to={`/groups/${group._id}`}
          className="text-xs font-semibold text-mercury-black hover:underline flex items-center gap-1"
        >
          Enter Space
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
