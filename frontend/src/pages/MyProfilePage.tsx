import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMe,
  updateFeedPreferences,
  updateConnectionPreferences,
  resetInterests,
} from '../api/users';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { InstitutionBadge, EmploymentBadge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { Sliders, Shield, RotateCcw, UserCheck, Sparkles, Building, Briefcase } from 'lucide-react';

export function MyProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const user = data?.user;

  // Local state for toggles
  const [mentorship, setMentorship] = useState(false);
  const [referrals, setReferrals] = useState(false);
  const [questions, setQuestions] = useState(false);
  const [pauseRequests, setPauseRequests] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Sync state once data loads
  if (user && !initialized) {
    setMentorship(!!user.connectionPreferences?.availableForMentorship);
    setReferrals(!!user.connectionPreferences?.availableForReferrals);
    setQuestions(!!user.connectionPreferences?.availableForQuestions);
    setPauseRequests(!!user.connectionPreferences?.pauseIncomingRequests);
    setInitialized(true);
  }

  // Update connection preferences
  const updateConnPrefMutation = useMutation({
    mutationFn: () =>
      updateConnectionPreferences({
        availableForMentorship: mentorship,
        availableForReferrals: referrals,
        availableForQuestions: questions,
        pauseIncomingRequests: pauseRequests,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast('Connection preferences saved', 'success');
    },
    onError: (e: any) => toast(e.message, 'error'),
  });

  // Reset inferred interests
  const resetInterestsMutation = useMutation({
    mutationFn: resetInterests,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast('Inferred interests reset to default state', 'success');
    },
    onError: (e: any) => toast(e.message, 'error'),
  });

  if (isLoading || !user) return <PageSpinner />;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mercury-card p-8 mb-8 relative overflow-hidden">
        <div
          className="mercury-blob w-48 h-48 -top-12 -right-12 opacity-30"
          style={{ animation: 'blobFloat 10s ease-in-out infinite' }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-mercury-black text-white flex items-center justify-center text-xl font-bold shadow-mercury-sm">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-mercury-black">{user.name}</h1>
              <span className="text-xs px-2 py-0.5 bg-mercury-gray-100 text-mercury-gray-600 rounded-full font-medium">
                {user.email || 'Demo Session'}
              </span>
            </div>
            <p className="text-sm text-mercury-gray-500 mt-1">{user.bio || 'No bio provided'}</p>
          </div>
        </div>
      </div>

      {/* Affiliations & Employment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="mercury-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building size={16} className="text-mercury-black" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-mercury-black">
              Verified Affiliations
            </h2>
          </div>
          {user.affiliations && user.affiliations.length > 0 ? (
            <div className="space-y-3">
              {user.affiliations.map((a) => (
                <div key={a.id || a.institutionId} className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-sm font-bold text-mercury-black block">{a.role}</span>
                    <span className="text-xs text-mercury-gray-500">
                      {[a.programme, a.batch].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <InstitutionBadge status={a.verificationStatus} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mercury-gray-400">None linked.</p>
          )}
        </div>

        <div className="mercury-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={16} className="text-mercury-black" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-mercury-black">
              Employment Records
            </h2>
          </div>
          {user.employmentClaims && user.employmentClaims.length > 0 ? (
            <div className="space-y-3">
              {user.employmentClaims.map((c) => (
                <div key={c.id || c.companyName} className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-sm font-bold text-mercury-black block">{c.companyName}</span>
                    <span className="text-xs text-mercury-gray-500">{c.jobTitle}</span>
                  </div>
                  <EmploymentBadge status={c.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mercury-gray-400">No employment records.</p>
          )}
        </div>
      </div>

      {/* Connection Preferences Panel */}
      <div className="mercury-card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-mercury-black" />
            <div>
              <h2 className="text-base font-bold text-mercury-black">Discovery & Availability</h2>
              <p className="text-xs text-mercury-gray-400">
                Configure your public flags for mentorship, referrals, and connection requests.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => updateConnPrefMutation.mutate()}
            loading={updateConnPrefMutation.isPending}
          >
            Save Changes
          </Button>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-xl bg-mercury-gray-50 hover:bg-mercury-gray-100 cursor-pointer transition-colors">
            <div>
              <span className="text-sm font-semibold text-mercury-black block">Available for Mentorship</span>
              <span className="text-xs text-mercury-gray-500">Allow students and juniors to reach out for career advice</span>
            </div>
            <input
              type="checkbox"
              checked={mentorship}
              onChange={(e) => setMentorship(e.target.checked)}
              className="w-4 h-4 rounded text-mercury-black focus:ring-black"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-mercury-gray-50 hover:bg-mercury-gray-100 cursor-pointer transition-colors">
            <div>
              <span className="text-sm font-semibold text-mercury-black block">Available for Referrals</span>
              <span className="text-xs text-mercury-gray-500">Signal openness to review profiles for company openings</span>
            </div>
            <input
              type="checkbox"
              checked={referrals}
              onChange={(e) => setReferrals(e.target.checked)}
              className="w-4 h-4 rounded text-mercury-black focus:ring-black"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-mercury-gray-50 hover:bg-mercury-gray-100 cursor-pointer transition-colors">
            <div>
              <span className="text-sm font-semibold text-mercury-black block">Open to Questions</span>
              <span className="text-xs text-mercury-gray-500">Willing to answer general questions about roles or courses</span>
            </div>
            <input
              type="checkbox"
              checked={questions}
              onChange={(e) => setQuestions(e.target.checked)}
              className="w-4 h-4 rounded text-mercury-black focus:ring-black"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 cursor-pointer transition-colors">
            <div>
              <span className="text-sm font-semibold text-red-900 block">Pause Incoming Requests</span>
              <span className="text-xs text-red-600">Temporarily stop accepting new connection requests on discovery</span>
            </div>
            <input
              type="checkbox"
              checked={pauseRequests}
              onChange={(e) => setPauseRequests(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
            />
          </label>
        </div>
      </div>

      {/* Privacy & Inferred Signals Reset */}
      <div className="mercury-card p-6 border-mercury-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw size={18} className="text-mercury-gray-600" />
            <div>
              <h3 className="text-sm font-bold text-mercury-black">Reset Behavioral Personalization</h3>
              <p className="text-xs text-mercury-gray-500">
                Clear all algorithmically inferred topics and feed weights back to clean cold-start.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => resetInterestsMutation.mutate()}
            loading={resetInterestsMutation.isPending}
          >
            Reset Interests
          </Button>
        </div>
      </div>
    </div>
  );
}
