import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  getConnections,
  respondToConnection,
  cancelConnectionRequest,
} from '../api/connections';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { PageSpinner } from '../components/ui/Spinner';
import { NoConnectionsState } from '../components/ui/EmptyState';
import { Users, Check, X, Clock, MessageSquare, ArrowUpRight } from 'lucide-react';
import type { Connection } from '../types/api';

export function ConnectionsPage() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['connections', userId],
    queryFn: () => getConnections(),
  });

  const connections = data?.connections || [];

  // Respond mutation
  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'declined' }) =>
      respondToConnection(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast(
        vars.status === 'accepted' ? 'Connection accepted! Chat unlocked.' : 'Connection declined.',
        'info'
      );
    },
    onError: (e: any) => toast(e.message, 'error'),
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelConnectionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast('Connection request cancelled', 'info');
    },
    onError: (e: any) => toast(e.message, 'error'),
  });

  const filtered = connections.filter((c: Connection) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="spatial-label block mb-1">Network & Relationships</span>
          <h1 className="text-3xl font-black tracking-tight text-mercury-black">Connections</h1>
          <p className="text-xs text-mercury-gray-500 mt-1">
            Accepting connection requests unlocks direct, encrypted 1-to-1 messaging.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex rounded-xl border border-mercury-gray-200 p-1 bg-white">
          {(['all', 'pending', 'accepted'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                filter === tab
                  ? 'bg-mercury-black text-white'
                  : 'text-mercury-gray-500 hover:text-mercury-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <NoConnectionsState />
      ) : (
        <div className="space-y-3">
          {filtered.map((conn) => {
            const isRequester = conn.requesterId === userId;
            const otherUserId = isRequester ? conn.recipientId : conn.requesterId;

            return (
              <div
                key={conn._id}
                className="mercury-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-mercury-black text-white flex items-center justify-center font-bold text-sm shadow-mercury-sm flex-shrink-0">
                    {otherUserId.replace(/^usr-/, '').charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/profile/${otherUserId}`}
                        className="text-sm font-bold text-mercury-black hover:underline flex items-center gap-1"
                      >
                        User: {otherUserId}
                        <ArrowUpRight size={12} className="text-mercury-gray-400" />
                      </Link>

                      <span
                        className={`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full font-bold ${
                          conn.status === 'accepted'
                            ? 'bg-green-50 text-green-700'
                            : conn.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-mercury-gray-100 text-mercury-gray-600'
                        }`}
                      >
                        {conn.status}
                      </span>
                    </div>

                    {conn.message && (
                      <p className="text-xs text-mercury-gray-600 mt-1 italic max-w-md bg-mercury-gray-50 p-2 rounded-lg border border-mercury-gray-100">
                        "{conn.message}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-[11px] text-mercury-gray-400">
                      <Clock size={11} />
                      <span>{isRequester ? 'Sent by you' : 'Received from them'}</span>
                      <span>·</span>
                      <span>{new Date(conn.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {conn.status === 'pending' && !isRequester && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          respondMutation.mutate({ id: conn._id, status: 'accepted' })
                        }
                        loading={respondMutation.isPending}
                      >
                        <Check size={13} />
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          respondMutation.mutate({ id: conn._id, status: 'declined' })
                        }
                        loading={respondMutation.isPending}
                      >
                        <X size={13} />
                        Decline
                      </Button>
                    </>
                  )}

                  {conn.status === 'pending' && isRequester && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => cancelMutation.mutate(conn._id)}
                      loading={cancelMutation.isPending}
                    >
                      Cancel Request
                    </Button>
                  )}

                  {conn.status === 'accepted' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/messages?targetId=${otherUserId}`)}
                    >
                      <MessageSquare size={13} />
                      Open Chat
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
