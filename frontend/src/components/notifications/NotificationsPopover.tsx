import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ShieldAlert,
  UserPlus,
  Users,
  Building2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../api/notifications';
import { AppNotification } from '../../types/api';

export function NotificationsPopover() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => getNotifications({ limit: 15 }),
    enabled: !!userId,
    refetchInterval: 15000, // background refresh
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

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.read) {
      markReadMutation.mutate(n._id);
    }
    setIsOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'affiliation_verified':
      case 'verification_approved':
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'affiliation_rejected':
      case 'verification_rejected':
        return <ShieldAlert size={16} className="text-red-500" />;
      case 'connection_request':
      case 'connection_accepted':
        return <UserPlus size={16} className="text-blue-500" />;
      case 'group_access_approved':
      case 'group_access_declined':
        return <Users size={16} className="text-purple-500" />;
      case 'campus_announcement':
      default:
        return <Building2 size={16} className="text-amber-500" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-mercury-gray-600 hover:text-mercury-black hover:bg-mercury-gray-100 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-mercury-gray-200 shadow-mercury-lg z-50 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="px-4 py-3 border-b border-mercury-gray-100 flex items-center justify-between bg-mercury-gray-50/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-mercury-black">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                disabled={markAllReadMutation.isPending}
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-mercury-gray-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Bell size={24} className="mx-auto text-mercury-gray-300 mb-2" />
                <p className="text-xs font-semibold text-mercury-black">All caught up!</p>
                <p className="text-[11px] text-mercury-gray-400 mt-0.5">
                  No new announcements or alerts at this time.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    n.read
                      ? 'bg-white hover:bg-mercury-gray-50'
                      : 'bg-blue-50/40 hover:bg-blue-50/70'
                  }`}
                >
                  <div className="mt-0.5 w-7 h-7 rounded-lg bg-mercury-gray-100 flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-mercury-black truncate">{n.title}</p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-mercury-gray-600 line-clamp-2 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-mercury-gray-400 font-mono mt-1">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-mercury-gray-50/80 border-t border-mercury-gray-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-mercury-black hover:underline flex items-center justify-center gap-1"
            >
              View Full Notification History
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
