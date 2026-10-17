import React, { useState } from 'react';
import { Heart, Bookmark, EyeOff, MessageSquare, Flag } from 'lucide-react';
import { interactWithPost } from '../../api/posts';
import { reportContent } from '../../api/moderation';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Input';
import { Button } from '../ui/Button';

interface PostActionsProps {
  postId: string;
  onHide?: () => void;
  onComment?: () => void;
}

export function PostActions({ postId, onHide, onComment }: PostActionsProps) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleInteract = async (type: 'like' | 'save' | 'hide') => {
    if (loading) return;
    setLoading(type);
    try {
      await interactWithPost(postId, type);
      if (type === 'like') {
        setLiked((p) => !p);
        toast(liked ? 'Like removed' : 'Post liked', 'success');
      } else if (type === 'save') {
        setSaved((p) => !p);
        toast(saved ? 'Removed from saved' : 'Post saved', 'success');
      } else if (type === 'hide') {
        toast('Post hidden. You won\'t see this again.', 'info');
        onHide?.();
      }
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReporting(true);
    try {
      await reportContent({ targetType: 'post', targetId: postId, reason: reportReason.trim() });
      toast('Report submitted. Thank you.', 'success');
      setReportOpen(false);
      setReportReason('');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setReporting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 pt-1">
        <button
          onClick={() => handleInteract('like')}
          disabled={loading === 'like'}
          aria-label={liked ? 'Unlike post' : 'Like post'}
          aria-pressed={liked}
          className={`btn-ghost ${liked ? 'text-red-500' : ''}`}
        >
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          <span className="text-xs">Like</span>
        </button>

        <button
          onClick={onComment}
          aria-label="Comment on post"
          className="btn-ghost"
        >
          <MessageSquare size={15} />
          <span className="text-xs">Comment</span>
        </button>

        <button
          onClick={() => handleInteract('save')}
          disabled={loading === 'save'}
          aria-label={saved ? 'Unsave post' : 'Save post'}
          aria-pressed={saved}
          className={`btn-ghost ${saved ? 'text-mercury-black' : ''}`}
        >
          <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
          <span className="text-xs">Save</span>
        </button>

        <button
          onClick={() => handleInteract('hide')}
          disabled={loading === 'hide'}
          aria-label="Hide post"
          className="btn-ghost"
        >
          <EyeOff size={15} />
          <span className="text-xs">Hide</span>
        </button>

        <button
          onClick={() => setReportOpen(true)}
          aria-label="Report post"
          className="btn-ghost ml-auto"
        >
          <Flag size={15} />
          <span className="text-xs">Report</span>
        </button>
      </div>

      {/* Report modal */}
      <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Report Post" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-mercury-gray-600">
            Describe why you're reporting this content. Reports are reviewed by moderators.
          </p>
          <Textarea
            label="Reason"
            placeholder="Explain the issue..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleReport}
              loading={reporting}
              disabled={!reportReason.trim()}
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
