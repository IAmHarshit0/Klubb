import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FeedItem, Comment } from '../../types/api';
import { getComments, addComment } from '../../api/posts';
import { PostActions } from './PostActions';
import { WhyThisPost } from './WhyThisPost';
import { Badge } from '../ui/Badge';
import { InstitutionBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PostCardProps {
  item: FeedItem;
  onHide?: (postId: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function PostCard({ item, onHide }: PostCardProps) {
  const { post, explanation, score } = item;
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [hidden, setHidden] = useState(false);
  const queryClient = useQueryClient();

  // Comments query
  const { data: commentsData, isLoading: loadingComments } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => getComments(post.id),
    enabled: showComments,
  });

  const comments = commentsData?.comments || [];

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: (text: string) => addComment(post.id, text),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  if (hidden) return null;

  const audienceMap: Record<string, 'campus' | 'group' | 'public'> = {
    campus: 'campus',
    group: 'group',
    public: 'public',
  };

  return (
    <article className="mercury-card p-5 animate-fade-in" aria-label={`Post by ${post.author.name}`}>
      {/* Author row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Link to={`/profile/${post.author.id}`} className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mercury-gray-200 to-mercury-gray-300 flex items-center justify-center text-sm font-bold text-mercury-gray-700 hover:ring-2 hover:ring-mercury-gray-200 transition-all">
              {post.author.name.charAt(0)}
            </div>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-1.5">
              <Link
                to={`/profile/${post.author.id}`}
                className="text-sm font-bold text-mercury-black hover:underline underline-offset-2 truncate"
              >
                {post.author.name}
              </Link>
              <InstitutionBadge status={post.author.verificationStatus} />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-mercury-gray-500">{post.author.role}</span>
              <span className="text-mercury-gray-200">·</span>
              <div className="flex items-center gap-1 text-xs text-mercury-gray-400">
                <Clock size={11} />
                {timeAgo(post.createdAt)}
              </div>
              <span className="text-mercury-gray-200">·</span>
              <Badge variant={audienceMap[post.audienceType] || 'neutral'}>
                {post.audienceType}
              </Badge>
            </div>
          </div>
        </div>

        {/* Why this post */}
        <WhyThisPost explanation={explanation} score={score} />
      </div>

      {/* Post text */}
      <p className="text-sm text-mercury-gray-800 leading-relaxed whitespace-pre-wrap break-words mb-3">
        {post.text}
      </p>

      {/* Topic labels */}
      {post.topicLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.topicLabels.map((label) => (
            <span
              key={label}
              className="px-2 py-0.5 bg-mercury-gray-50 border border-mercury-gray-100 text-mercury-gray-600 text-xs rounded-lg font-medium"
            >
              #{label}
            </span>
          ))}
        </div>
      )}

      {/* Actions Divider */}
      <div className="border-t border-mercury-gray-50 -mx-5 px-5 pt-3">
        <PostActions
          postId={post.id}
          onHide={() => {
            setHidden(true);
            onHide?.(post.id);
          }}
          onComment={() => setShowComments((p) => !p)}
        />
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-mercury-gray-50 -mx-5 px-5 pt-4 mt-3 space-y-3 bg-mercury-gray-50/50 rounded-b-2xl">
          {/* New comment input */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="mercury-input text-xs py-2"
            />
            <Button
              size="sm"
              type="submit"
              disabled={!commentText.trim()}
              loading={commentMutation.isPending}
            >
              <Send size={12} />
            </Button>
          </form>

          {/* Comments list */}
          {loadingComments ? (
            <p className="text-xs text-mercury-gray-400 py-2 text-center">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-mercury-gray-400 py-2 text-center">No comments yet.</p>
          ) : (
            <div className="space-y-2 pb-1">
              {comments.map((c: Comment) => (
                <div key={c._id} className="bg-white p-3 rounded-xl border border-mercury-gray-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-mercury-black">
                      {c.authorId.replace(/^usr-/, '')}
                    </span>
                    <span className="text-[10px] text-mercury-gray-400">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-mercury-gray-700">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
