import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile } from '../api/users';
import { getConnections, blockUser } from '../api/connections';
import { getConversations } from '../api/messaging';
import { reportContent } from '../api/moderation';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { InstitutionBadge, EmploymentBadge } from '../components/ui/Badge';
import { ConnectButton } from '../components/profile/ConnectButton';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Input';
import { PageSpinner } from '../components/ui/Spinner';
import {
  Globe,
  Briefcase,
  GraduationCap,
  ShieldAlert,
  Flag,
  ArrowLeft,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import type { Connection, Conversation } from '../types/api';

export function ProfilePage() {
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { userId: currentUserId, isVerifiedAlumnus } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const targetId = routeUserId || currentUserId;
  const isMe = targetId === currentUserId;

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);

  // Profile data
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['user', currentUserId, targetId],
    queryFn: () => getUserProfile(targetId),
    retry: 1,
  });

  // Connections data
  const { data: connectionsData } = useQuery({
    queryKey: ['connections', currentUserId],
    queryFn: () => getConnections(),
    enabled: !isMe,
  });

  // Conversations data
  const { data: convData } = useQuery({
    queryKey: ['conversations', currentUserId],
    queryFn: () => getConversations(),
    enabled: !isMe,
  });

  const connection =
    connectionsData?.connections?.find(
      (c: Connection) => c.requesterId === targetId || c.recipientId === targetId
    ) || null;

  const conversation = convData?.conversations?.find((c: Conversation) =>
    c.participantIds.includes(targetId)
  );

  const handleBlock = async () => {
    setBlocking(true);
    try {
      await blockUser(targetId);
      toast('User has been blocked', 'info');
      setBlockOpen(false);
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      navigate('/discover');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBlocking(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReporting(true);
    try {
      await reportContent({ targetType: 'user', targetId, reason: reportReason.trim() });
      toast('User reported successfully', 'success');
      setReportOpen(false);
      setReportReason('');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setReporting(false);
    }
  };

  if (isLoading) return <PageSpinner />;

  if (isError || !user) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-mercury-gray-100 flex items-center justify-center text-mercury-gray-400">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-xl font-bold text-mercury-black mb-2">Profile Unavailable</h2>
        <p className="text-sm text-mercury-gray-500 mb-6">
          {(error as Error)?.message || 'This profile is not accessible or has been restricted.'}
        </p>
        <Link to="/discover">
          <Button variant="secondary">Back to Discovery</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost flex items-center gap-1.5 mb-6 text-xs text-mercury-gray-500"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Profile Header Card */}
      <div className="mercury-card p-8 mb-6 relative overflow-hidden">
        <div
          className="mercury-blob w-56 h-56 -top-16 -right-16 opacity-30"
          style={{ animation: 'blobFloat 12s ease-in-out infinite' }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-mercury-black text-white flex items-center justify-center text-2xl font-black shadow-mercury-sm">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-mercury-black">{user.name}</h1>
                {isMe && (
                  <span className="text-xs px-2 py-0.5 bg-mercury-gray-100 text-mercury-gray-600 rounded-full font-medium">
                    You
                  </span>
                )}
              </div>
              {user.bio && (
                <p className="text-sm text-mercury-gray-600 mt-1 max-w-lg leading-relaxed">{user.bio}</p>
              )}
              {user.portfolioUrl && (
                <a
                  href={user.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-mercury-gray-500 hover:text-mercury-black mt-2 underline underline-offset-2"
                >
                  <Globe size={12} />
                  {user.portfolioUrl.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          {!isMe && (
            <div className="flex flex-wrap sm:flex-col items-end gap-2 w-full sm:w-auto">
              <ConnectButton
                targetUserId={targetId}
                connection={connection}
                hasConversation={!!conversation}
                conversationId={conversation?.id}
                onConnect={() => {
                  queryClient.invalidateQueries({ queryKey: ['connections'] });
                }}
                onConversationOpen={(convId) => navigate(`/messages?conversationId=${convId}`)}
              />

              {connection?.status === 'accepted' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/messages?targetId=${targetId}`)}
                  className="w-full sm:w-auto"
                >
                  <MessageCircle size={14} />
                  Direct Chat
                </Button>
              )}
            </div>
          )}

          {isMe && (
            <Link to="/profile/me">
              <Button variant="secondary" size="sm">
                Manage Preferences
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Grid: Affiliations & Employment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Affiliations */}
        <div className="mercury-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={18} className="text-mercury-black" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-mercury-black">
              Institutional Affiliations
            </h2>
          </div>

          {user.affiliations && user.affiliations.length > 0 ? (
            <div className="space-y-4">
              {user.affiliations.map((aff) => (
                <div key={aff.id || aff.institutionId} className="border-l-2 border-mercury-gray-200 pl-4 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-mercury-black">{aff.role}</span>
                    <InstitutionBadge status={aff.verificationStatus} />
                  </div>
                  <p className="text-xs text-mercury-gray-600 mt-0.5">
                    {[aff.programme, aff.department, aff.batch].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mercury-gray-400">No affiliations listed.</p>
          )}
        </div>

        {/* Employment Claims */}
        <div className="mercury-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={18} className="text-mercury-black" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-mercury-black">
              Professional Claims
            </h2>
          </div>

          {user.employmentClaims && user.employmentClaims.length > 0 ? (
            <div className="space-y-4">
              {user.employmentClaims.map((claim) => (
                <div key={claim.id || claim.companyName} className="border-l-2 border-mercury-gray-200 pl-4 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-mercury-black">{claim.companyName}</span>
                    <EmploymentBadge status={claim.status} />
                  </div>
                  <p className="text-xs text-mercury-gray-600 mt-0.5">{claim.jobTitle}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mercury-gray-400">No employment claims recorded.</p>
          )}
        </div>
      </div>

      {/* Skills & Availability */}
      <div className={`grid grid-cols-1 gap-6 mb-8 ${user.availability ? 'md:grid-cols-2' : ''}`}>
        {/* Skills */}
        <div className="mercury-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-mercury-black" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-mercury-black">
              Skills & Expertise
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {user.skills && user.skills.length > 0 ? (
              user.skills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 bg-mercury-gray-50 border border-mercury-gray-100 text-mercury-gray-800 text-xs font-medium rounded-lg"
                >
                  {s}
                </span>
              ))
            ) : (
              <p className="text-xs text-mercury-gray-400">No skills declared.</p>
            )}
          </div>
        </div>

        {/* Stated Availability */}
        {user.availability && (
        <div className="mercury-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-mercury-black mb-4">
            Stated Availability
          </h2>
          {user.availability.paused ? (
            <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-xl">
              Currently pausing new incoming connection requests.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs py-1 border-b border-mercury-gray-50">
                <span className="text-mercury-gray-600">Mentorship Opportunities</span>
                <span
                  className={`font-semibold ${user.availability.mentorship ? 'text-green-700' : 'text-mercury-gray-400'}`}
                >
                  {user.availability.mentorship ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-mercury-gray-50">
                <span className="text-mercury-gray-600">Company Referrals</span>
                <span
                  className={`font-semibold ${user.availability.referrals ? 'text-blue-700' : 'text-mercury-gray-400'}`}
                >
                  {user.availability.referrals ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-mercury-gray-600">General Career Questions</span>
                <span
                  className={`font-semibold ${user.availability.questions ? 'text-purple-700' : 'text-mercury-gray-400'}`}
                >
                  {user.availability.questions ? 'Open to chat' : 'Unavailable'}
                </span>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Safety Actions (Block & Report) */}
      {!isMe && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-mercury-gray-100">
          <button
            onClick={() => setReportOpen(true)}
            className="text-xs text-mercury-gray-500 hover:text-mercury-black flex items-center gap-1.5 transition-colors"
          >
            <Flag size={13} />
            Report Profile
          </button>
          <span className="text-mercury-gray-200">|</span>
          <button
            onClick={() => setBlockOpen(true)}
            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert size={13} />
            Block User
          </button>
        </div>
      )}

      {/* Block Confirmation Modal */}
      <Modal isOpen={blockOpen} onClose={() => setBlockOpen(false)} title="Block User" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-mercury-gray-600">
            Blocking prevents direct messaging and hides them from your discovery and feeds.
            Institutional group memberships are retained per campus policy.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setBlockOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={blocking} onClick={handleBlock}>
              Confirm Block
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Report Profile" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-mercury-gray-600">
            Reports are handled with backend audit logging and escalation if necessary.
          </p>
          <Textarea
            label="Reason for report"
            placeholder="Violates community standards, impersonation, etc."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={reporting}
              disabled={!reportReason.trim()}
              onClick={handleReport}
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
