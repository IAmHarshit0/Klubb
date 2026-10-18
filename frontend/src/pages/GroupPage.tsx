import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGroup, requestGroupAccess, postToGroup, getGroupPosts } from '../api/groups';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { PageSpinner } from '../components/ui/Spinner';
import { Users, Shield, Send, Lock, Globe, MessageSquare, Clock } from 'lucide-react';

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
  const isMember = !!membership && membership.status === 'active';

  // Group posts query
  const { data: postsData, isLoading: loadingPosts } = useQuery({
    queryKey: ['group-posts', groupId],
    queryFn: () => getGroupPosts(groupId),
    enabled: group?.visibility !== 'restricted' || isMember,
  });
  const groupPosts = postsData?.posts || [];

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
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
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
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
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

            <div className="flex flex-wrap items-center gap-4 text-xs text-mercury-gray-500">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Users size={13} />
                {memberCount} active member{memberCount !== 1 ? 's' : ''}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Shield size={13} />
                Posting: {group.postingPolicy.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            {isMember ? (
              (membership as any)?.isSuperAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-purple-200 bg-purple-50 text-purple-700 whitespace-nowrap shadow-sm">
                  <Shield size={13} className="text-purple-600 flex-shrink-0" />
                  <span>Superadmin Full Access</span>
                </span>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 whitespace-nowrap shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="font-semibold">Active Member</span>
                  <span className="text-emerald-300">·</span>
                  <span className="capitalize font-semibold text-emerald-700">{membership.role}</span>
                </div>
              )
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
          <h2 className="text-sm font-bold text-mercury-black mb-3">
            {(membership as any)?.isSuperAdmin
              ? 'Publish to this Group (Superadmin Access)'
              : 'Publish to this Group'}
          </h2>
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
        <div className="mercury-card p-8 text-center text-mercury-gray-500 mb-8">
          <Lock size={28} className="mx-auto mb-3 text-mercury-gray-300" />
          <h3 className="text-sm font-bold text-mercury-black mb-1">Restricted Group Community</h3>
          <p className="text-xs max-w-sm mx-auto text-mercury-gray-400">
            Posts within this space are protected by server-side membership checks.
            Request access above to view and participate.
          </p>
        </div>
      )}

      {/* Group Posts Feed */}
      {(group.visibility !== 'restricted' || isMember) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-mercury-black" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-mercury-black">
              Group Discussions ({groupPosts.length})
            </h2>
          </div>

          {loadingPosts ? (
            <p className="text-xs text-mercury-gray-400 py-6 text-center">Loading posts...</p>
          ) : groupPosts.length === 0 ? (
            <div className="mercury-card p-8 text-center text-mercury-gray-400">
              <p className="text-xs">No posts in this group yet. Be the first to start a conversation!</p>
            </div>
          ) : (
            groupPosts.map((post: any) => (
              <div key={post.id} className="mercury-card p-6">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-mercury-gray-100 flex items-center justify-center text-xs font-bold text-mercury-gray-700">
                      {post.author?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-mercury-black block">{post.author?.name}</span>
                      <span className="text-[11px] text-mercury-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-mercury-gray-800 whitespace-pre-wrap leading-relaxed mt-2">
                  {post.text}
                </p>
                {post.topicLabels?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {post.topicLabels.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-mercury-gray-50 text-mercury-gray-600 rounded text-[11px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
