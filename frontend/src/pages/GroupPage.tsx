import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGroup, requestGroupAccess, postToGroup } from '../api/groups';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { PageSpinner } from '../components/ui/Spinner';
import { Users, Shield, Send, Lock, Globe } from 'lucide-react';

export function GroupPage() {
  const { groupId = 'grp-robotics-club' } = useParams<{ groupId: string }>();
  const { userId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [postText, setPostText] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['group', groupId, userId],
    queryFn: () => getGroup(groupId),
  });

  const group = data?.group;
  const memberCount = data?.memberCount ?? 0;
  const membership = data?.membership;

  // Request access mutation
  const accessMutation = useMutation({
    mutationFn: () => requestGroupAccess(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast('Access request submitted for supervisor approval', 'success');
    },
    onError: (e: any) => toast(e.message, 'error'),
  });

  // Post to group mutation
  const postMutation = useMutation({
    mutationFn: (text: string) => postToGroup(groupId, { text }),
    onSuccess: () => {
      setPostText('');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast('Group post published', 'success');
    },
    onError: (e: any) => toast(e.message, 'error'),
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !group) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <p className="text-sm text-red-600">{(error as Error)?.message || 'Group not found'}</p>
      </div>
    );
  }

  const isMember = !!membership && membership.status === 'active';

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Group Hero */}
      <div className="mercury-card p-8 mb-8 relative overflow-hidden">
        <div
          className="mercury-blob w-52 h-52 -top-16 -right-16 opacity-30"
          style={{ animation: 'blobFloat 11s ease-in-out infinite' }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="spatial-label">{group.groupType} Group</span>
              <span className="text-mercury-gray-300">·</span>
              <span className="text-xs text-mercury-gray-400 capitalize flex items-center gap-1">
                {group.visibility === 'restricted' ? <Lock size={11} /> : <Globe size={11} />}
                {group.visibility.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-mercury-black mb-2">
              {group.name}
            </h1>

            <div className="flex items-center gap-4 text-xs text-mercury-gray-500">
              <span className="flex items-center gap-1.5">
                <Users size={13} />
                {memberCount} active member{memberCount !== 1 ? 's' : ''}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Shield size={13} />
                Posting: {group.postingPolicy.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div>
            {isMember ? (
              <span className="px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-200">
                Active Member ({membership.role})
              </span>
            ) : (
              <Button
                onClick={() => accessMutation.mutate()}
                loading={accessMutation.isPending}
              >
                Request Access
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Post Composer if Member */}
      {isMember ? (
        <div className="mercury-card p-6 mb-8">
          <h2 className="text-sm font-bold text-mercury-black mb-3">Publish to this Group</h2>
          <Textarea
            placeholder="Share an update or question with group members..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={3}
            className="mb-3"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!postText.trim()}
              loading={postMutation.isPending}
              onClick={() => postMutation.mutate(postText.trim())}
            >
              <Send size={13} />
              Post to Group
            </Button>
          </div>
        </div>
      ) : (
        <div className="mercury-card p-8 text-center text-mercury-gray-500">
          <Lock size={28} className="mx-auto mb-3 text-mercury-gray-300" />
          <h3 className="text-sm font-bold text-mercury-black mb-1">Restricted Group Community</h3>
          <p className="text-xs max-w-sm mx-auto text-mercury-gray-400">
            Posts within this space are protected by server-side membership checks.
            Request access above to view and participate.
          </p>
        </div>
      )}
    </div>
  );
}
