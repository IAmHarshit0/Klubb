import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMe,
  getTopicMap,
  updateFeedPreferences,
  updateConnectionPreferences,
  resetInterests,
  resetTopicMap,
  updateInterests,
} from '../api/users';
import { getMyPosts, deletePost } from '../api/posts';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { InstitutionBadge, EmploymentBadge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import {
  RotateCcw,
  UserCheck,
  Building,
  Briefcase,
  X,
  VolumeX,
  FileText,
  Trash2,
  Heart,
  MessageSquare,
  Globe,
  Users,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MyProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId, isVerifiedAlumnus, canConfigureAvailability } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['me', userId],
    queryFn: getMe,
  });

  const {
    data: topicMapData,
    isLoading: topicMapLoading,
    isError: topicMapIsError,
    error: topicMapError,
  } = useQuery({
    queryKey: ['topic-map', userId],
    queryFn: getTopicMap,
  });

  const {
    data: myPostsData,
    isLoading: loadingMyPosts,
  } = useQuery({
    queryKey: ['my-posts', userId],
    queryFn: getMyPosts,
  });

  const myPosts = myPostsData?.posts || [];
  const [postAudienceFilter, setPostAudienceFilter] = useState<'all' | 'campus' | 'group' | 'public'>('all');

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posts', userId] });
      queryClient.invalidateQueries({ queryKey: ['topic-map', userId] });
      toast('Post deleted successfully', 'success');
    },
    onError: (e: any) => toast(e.message || 'Failed to delete post', 'error'),
  });

  const user = data?.user;
  const [interests, setInterests] = useState<string[]>([]);
  const [interestDraft, setInterestDraft] = useState('');
  const [interestError, setInterestError] = useState<string | null>(null);

  // Local state for toggles
  const [mentorship, setMentorship] = useState(false);
  const [referrals, setReferrals] = useState(false);
  const [questions, setQuestions] = useState(false);
  const [pauseRequests, setPauseRequests] = useState(false);
  useEffect(() => {
    if (user) setInterests(user.interests || []);
  }, [user?.id, user?.interests]);

  useEffect(() => {
    if (!user) return;
    setMentorship(!!user.connectionPreferences?.availableForMentorship);
    setReferrals(!!user.connectionPreferences?.availableForReferrals);
    setQuestions(!!user.connectionPreferences?.availableForQuestions);
    setPauseRequests(!!user.connectionPreferences?.pauseIncomingRequests);
  }, [user?.id, user?.connectionPreferences]);

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

  // Clear saved interests
  const resetInterestsMutation = useMutation({
    mutationFn: resetInterests,
    onSuccess: () => {
      setInterests([]);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['topic-map', userId] });
      toast('Interests cleared', 'success');
    },
    onError: (e: any) => toast(e.message, 'error'),
  });

  const updateInterestsMutation = useMutation({
    mutationFn: updateInterests,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['topic-map', userId] });
      toast('Interests saved', 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const resetTopicMapMutation = useMutation({
    mutationFn: resetTopicMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-map', userId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast('Inferred topic signals reset', 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const muteTopicMutation = useMutation({
    mutationFn: async (topic: string) => {
      const mutedTopics = new Set(topicMapData?.mutedTopicIds || []);
      if (mutedTopics.has(topic)) mutedTopics.delete(topic);
      else mutedTopics.add(topic);
      await updateFeedPreferences({ mutedTopicIds: [...mutedTopics] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-map', userId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast('Topic feed preference saved', 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
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

      {/* My Published Posts Section */}
      <section className="mercury-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 border-b border-mercury-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-mercury-gray-100 rounded-xl text-mercury-black">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-mercury-black">My Published Posts</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-mercury-gray-100 text-mercury-gray-700">
                  {myPosts.length}
                </span>
              </div>
              <p className="text-xs text-mercury-gray-500 mt-0.5">
                Posts you author are delivered across discovery feeds to peers and archived here on your profile.
              </p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-mercury-gray-50 p-1 rounded-xl border border-mercury-gray-200">
            {(['all', 'campus', 'group', 'public'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setPostAudienceFilter(filter)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  postAudienceFilter === filter
                    ? 'bg-mercury-black text-white shadow-sm'
                    : 'text-mercury-gray-600 hover:text-mercury-black'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {loadingMyPosts ? (
          <p className="text-xs text-mercury-gray-400 py-6 text-center">Loading your posts...</p>
        ) : myPosts.filter((p) => postAudienceFilter === 'all' || p.audienceType === postAudienceFilter).length === 0 ? (
          <div className="p-8 text-center text-mercury-gray-400 bg-mercury-gray-50 rounded-2xl border border-dashed border-mercury-gray-200">
            <FileText size={28} className="mx-auto mb-2 text-mercury-gray-300" />
            <p className="text-sm font-semibold text-mercury-black mb-1">
              {postAudienceFilter === 'all'
                ? 'No posts published yet'
                : `No ${postAudienceFilter} posts found`}
            </p>
            <p className="text-xs max-w-sm mx-auto text-mercury-gray-500">
              Share updates, research, or announcements from the feed composer or your groups to see them cataloged here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myPosts
              .filter((p) => postAudienceFilter === 'all' || p.audienceType === postAudienceFilter)
              .map((post) => (
                <div
                  key={post.id}
                  className="p-5 rounded-2xl border border-mercury-gray-200 bg-white hover:border-mercury-gray-300 transition-shadow shadow-mercury-xs"
                >
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-mercury-gray-100 text-mercury-gray-700 capitalize">
                        {post.audienceType === 'campus' && <Building size={11} />}
                        {post.audienceType === 'group' && <Users size={11} />}
                        {post.audienceType === 'public' && <Globe size={11} />}
                        {post.audienceType}
                        {post.audienceId ? ` · ${post.audienceId}` : ''}
                      </span>
                      <span className="text-[11px] text-mercury-gray-400 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <button
                      type="button"
                      title="Delete Post"
                      aria-label="Delete Post"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this post?')) {
                          deletePostMutation.mutate(post.id);
                        }
                      }}
                      disabled={deletePostMutation.isPending}
                      className="p-1.5 text-mercury-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="text-sm text-mercury-gray-800 whitespace-pre-wrap leading-relaxed">
                    {post.text}
                  </p>

                  {post.topicLabels && post.topicLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {post.topicLabels.map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 rounded-md bg-mercury-gray-50 text-[11px] text-mercury-gray-600 font-medium border border-mercury-gray-100"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-mercury-gray-100 text-xs text-mercury-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart size={13} className="text-mercury-gray-400" />
                      {post.likeCount || 0} reaction{post.likeCount !== 1 ? 's' : ''}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={13} className="text-mercury-gray-400" />
                      {post.commentCount || 0} comment{post.commentCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="mercury-card p-6 mb-8">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-mercury-black">Your Interests (Up to 15)</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-mercury-gray-100 text-mercury-gray-700">
              {interests.length} / 15
            </span>
          </div>
          <p className="text-xs text-mercury-gray-500 mt-1">
            Add 1–3 word academic or professional nouns (e.g. Distributed Systems, Artificial Intelligence, Fintech). Filler words and conversational phrases are automatically filtered out.
          </p>
        </div>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setInterestError(null);
            const interest = interestDraft.trim();
            if (!interest) return;

            if (interests.length >= 15) {
              setInterestError('Maximum limit of 15 interests reached.');
              return;
            }

            if (interests.some((saved) => saved.toLowerCase() === interest.toLowerCase())) {
              setInterestError('This interest is already in your list.');
              return;
            }

            if (interest.length < 2 || interest.length > 35) {
              setInterestError('Topic concepts must be between 2 and 35 characters.');
              return;
            }

            const words = interest.toLowerCase().split(/\s+/).filter(Boolean);
            if (words.length > 3) {
              setInterestError('Please enter a concise noun concept (1 to 3 words maximum).');
              return;
            }

            const bogusSet = new Set([
              'stuff', 'really', 'today', 'awesome', 'things', 'cool', 'hello', 'lol', 'lmao',
              'update', 'doing', 'please', 'thanks', 'thank', 'good', 'bad', 'nice', 'great',
              'very', 'just', 'more', 'less', 'best', 'worst', 'hey', 'hi', 'yes', 'no'
            ]);
            if (words.some((w) => bogusSet.has(w))) {
              setInterestError('Please enter a substantive topic noun or domain phrase, avoiding conversational filler words.');
              return;
            }

            setInterests((saved) => [...saved, interest]);
            setInterestDraft('');
          }}
        >
          <div className="flex gap-2">
            <input
              value={interestDraft}
              onChange={(event) => {
                setInterestDraft(event.target.value);
                if (interestError) setInterestError(null);
              }}
              placeholder="e.g. Machine Learning, Distributed Systems, Cloud Infrastructure"
              aria-label="Add an interest"
              className="mercury-input flex-1"
            />
            <Button type="submit" variant="secondary" disabled={!interestDraft.trim() || interests.length >= 15}>
              Add
            </Button>
          </div>
          {interestError && (
            <p className="text-xs text-rose-600 font-medium mt-1">{interestError}</p>
          )}
        </form>
        <div className="flex flex-wrap gap-2 mt-4">
          {interests.length > 0 ? interests.map((interest) => (
            <span key={interest} className="inline-flex items-center gap-1 rounded-full bg-mercury-gray-100 px-3 py-1 text-xs font-medium text-mercury-gray-700">
              {interest}
              <button
                type="button"
                onClick={() => setInterests((saved) => saved.filter((item) => item !== interest))}
                aria-label={`Remove ${interest}`}
                className="rounded-full hover:text-red-600"
              >
                <X size={12} />
              </button>
            </span>
          )) : (
            <p className="text-xs text-mercury-gray-400">No interests added yet.</p>
          )}
        </div>
        <div className="flex justify-end mt-5">
          <Button
            size="sm"
            onClick={() => updateInterestsMutation.mutate(interests)}
            loading={updateInterestsMutation.isPending}
          >
            Save Interests
          </Button>
        </div>
      </section>

      <section className="mercury-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-mercury-black">Your Campus Topic Map (Top 15 Ranked Nouns)</h2>
              {topicMapData?.topicMap?.length ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {topicMapData.topicMap.length} / 15 Max
                </span>
              ) : null}
            </div>
            <p className="text-xs text-mercury-gray-500 mt-1">
              Interest signals from follows, searches, saves, reactions, comments, and your published post topics decay exponentially over time.
              Conversational filler words are strictly eliminated; only legitimate 1–3 word nouns are retained, capped at your top 15 highest-affinity concepts.
              Private messages are never used.
            </p>
            <p className="text-xs text-mercury-gray-400 mt-1">
              Resetting clears inferred activity; your profile interests, skills, and explicit topic follows remain intact.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => resetTopicMapMutation.mutate()}
            loading={resetTopicMapMutation.isPending}
            disabled={
              topicMapLoading ||
              Boolean(topicMapData && !topicMapData.topicMap.some((entry) => entry.hasInferredSignals))
            }
          >
            Reset Inferred Topics
          </Button>
        </div>

        {topicMapLoading ? (
          <p className="text-xs text-mercury-gray-400">Loading your topic map...</p>
        ) : topicMapIsError ? (
          <p className="text-xs text-red-600">
            Could not load your topic map: {topicMapError instanceof Error ? topicMapError.message : 'Please try again.'}
          </p>
        ) : topicMapData?.topicMap.length ? (
          <div className="flex flex-wrap gap-2.5">
            {topicMapData.topicMap.map(({ topic, score, shortTermWeight, lastActive, muted }, index) => (
              <div
                key={topic}
                title={lastActive ? `Rank #${index + 1} · Last active ${new Date(lastActive).toLocaleDateString()}` : `Rank #${index + 1} · From your profile`}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                  muted ? 'border-mercury-gray-200 bg-mercury-gray-50 opacity-70' : 'border-mercury-gray-200 bg-white'
                }`}
              >
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-mercury-gray-100 text-mercury-gray-600">
                  #{index + 1}
                </span>
                <span className="text-sm font-semibold text-mercury-black capitalize">{topic}</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                  {(score * 100).toFixed(0)}%
                </span>
                {shortTermWeight > 0.4 && (
                  <span className="text-[10px] text-blue-600 font-bold">Trending</span>
                )}
                <button
                  type="button"
                  onClick={() => muteTopicMutation.mutate(topic)}
                  disabled={muteTopicMutation.isPending}
                  aria-label={`${muted ? 'Unmute' : 'Mute'} ${topic} in feed`}
                  title={`${muted ? 'Unmute' : 'Mute'} this topic in your feed`}
                  className="text-mercury-gray-400 hover:text-mercury-black disabled:opacity-50"
                >
                  <VolumeX size={14} />
                </button>
                {muted && <span className="text-[10px] text-mercury-gray-500">Muted</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-mercury-gray-400">
            No topic signals yet. Follow a topic, search for something, or interact with a post that has topic labels.
          </p>
        )}
      </section>

      {/* Connection Preferences Panel */}
      {canConfigureAvailability ? (
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
      ) : (
        <div className="mercury-card p-6 mb-8">
          <h2 className="text-base font-bold text-mercury-black">Discovery & Availability</h2>
          <p className="text-xs text-mercury-gray-500 mt-1">
            Availability flags (mentorship, referrals, open to questions) are active for alumni, faculty, leadership, and industry partners. You can discover and connect with these members from the Discover page.
          </p>
        </div>
      )}

      {/* Interest reset */}
      <div className="mercury-card p-6 border-mercury-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw size={18} className="text-mercury-gray-600" />
            <div>
              <h3 className="text-sm font-bold text-mercury-black">Clear your interests</h3>
              <p className="text-xs text-mercury-gray-500">
                Remove the interests saved on your profile and used to personalize your feed.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => resetInterestsMutation.mutate()}
            loading={resetInterestsMutation.isPending}
          >
            Clear Interests
          </Button>
        </div>
      </div>
    </div>
  );
}
