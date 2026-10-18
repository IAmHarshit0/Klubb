import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ShieldAlert,
  UserPlus,
  Users,
  Building2,
  Check,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { AppNotification } from '../types/api';

export function NotificationsPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => getNotifications({ limit: 50 }),
    enabled: !!userId,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const allNotifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const filteredNotifications =
    filter === 'unread' ? allNotifications.filter((n) => !n.read) : allNotifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'affiliation_verified':
      case 'verification_approved':
        return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'affiliation_rejected':
      case 'verification_rejected':
        return <ShieldAlert size={18} className="text-red-500" />;
      case 'connection_request':
      case 'connection_accepted':
        return <UserPlus size={18} className="text-blue-500" />;
      case 'group_access_approved':
      case 'group_access_declined':
        return <Users size={18} className="text-purple-500" />;
      case 'campus_announcement':
      default:
        return <Building2 size={18} className="text-amber-500" />;
    }
  };

  const handleClick = (n: AppNotification) => {
    if (!n.read) {
      markReadMutation.mutate(n._id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-mercury-gray-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-mercury-black text-white flex items-center justify-center">
              <Bell size={18} />
            </span>
            <h1 className="text-2xl font-extrabold text-mercury-black">Notification Center</h1>
          </div>
          <p className="text-xs text-mercury-gray-500 mt-1">
            Real-time updates on affiliation reviews, connection invitations, and official announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Check size={14} /> Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-mercury-black text-white'
              : 'bg-mercury-gray-100 text-mercury-gray-600 hover:bg-mercury-gray-200'
          }`}
        >
          All ({allNotifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-mercury-black text-white'
              : 'bg-mercury-gray-100 text-mercury-gray-600 hover:bg-mercury-gray-200'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-mercury-gray-200 shadow-mercury-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center text-mercury-gray-400">
            <Bell size={32} className="mx-auto text-mercury-gray-300 mb-3" />
            <p className="text-sm font-semibold text-mercury-black">No notifications to display</p>
            <p className="text-xs text-mercury-gray-400 mt-1">
              {filter === 'unread' ? 'All notifications have been read.' : 'You have no notifications yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-mercury-gray-100">
            {filteredNotifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={`p-5 flex items-start gap-4 cursor-pointer transition-colors ${
                  n.read ? 'bg-white hover:bg-mercury-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/60'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-mercury-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-mercury-black">{n.title}</h3>
                    <span className="text-[11px] text-mercury-gray-400 font-mono flex-shrink-0">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-mercury-gray-600 mt-1 leading-relaxed">{n.message}</p>

                  <div className="flex items-center gap-3 mt-3">
                    {n.actorName && (
                      <span className="text-[11px] font-medium text-mercury-gray-500">
                        From: <span className="text-mercury-black font-semibold">{n.actorName}</span>
                      </span>
                    )}
                    {!n.read && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
