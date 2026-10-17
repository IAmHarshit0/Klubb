import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  getInstitutions,
  getInstitutionTree,
  getMyAnnouncements,
  createInstitutionGroup,
  Announcement,
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
} from 'lucide-react';
import type { Group } from '../types/api';

export function InstitutionsPage() {
  const { userId, currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'communities' | 'announcements'>('communities');
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

  const announcements = annData?.announcements || [];
  const tree = treeData?.tree;

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
