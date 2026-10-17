import React, { useState } from 'react';
import { Globe, Users, Building2, X, ChevronDown } from 'lucide-react';
import { createPost } from '../../api/posts';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface CreatePostFormProps {
  onSuccess?: () => void;
}

const AUDIENCE_OPTIONS = [
  { value: 'public', label: 'Public', icon: Globe },
  { value: 'campus', label: 'Campus only', icon: Building2 },
];

const TOPIC_SUGGESTIONS = ['TypeScript', 'AI', 'Fintech', 'Mentorship', 'Cloud', 'Research', 'Career'];

export function CreatePostForm({ onSuccess }: CreatePostFormProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [audience, setAudience] = useState('public');
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    // Client-side sanitization — trim and validate length
    const sanitizedText = text.trim();
    if (sanitizedText.length > 5000) {
      toast('Post is too long (max 5000 characters)', 'error');
      return;
    }

    setLoading(true);
    try {
      await createPost({
        text: sanitizedText,
        audienceType: audience as 'public' | 'campus',
        topicLabels: topics,
      });
      setText('');
      setTopics([]);
      setExpanded(false);
      toast('Post published!', 'success');
      onSuccess?.();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (t: string) => {
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mercury-card p-5 space-y-4"
      aria-label="Create a post"
    >
      {/* Text area */}
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-mercury-black text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {currentUser?.name?.charAt(0) || '?'}
        </div>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); if (!expanded) setExpanded(true); }}
          onFocus={() => setExpanded(true)}
          placeholder="Share something with your network..."
          rows={expanded ? 4 : 2}
          maxLength={5000}
          className="mercury-input resize-none flex-1 min-h-0"
          aria-label="Post content"
        />
      </div>

      {expanded && (
        <div className="space-y-3 pl-12 animate-fade-in">
          {/* Audience selector */}
          <div className="flex items-center gap-2">
            <span className="spatial-label">Audience</span>
            <div className="flex gap-1">
              {AUDIENCE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAudience(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    audience === value
                      ? 'bg-mercury-black text-white'
                      : 'bg-mercury-gray-50 text-mercury-gray-600 hover:bg-mercury-gray-100'
                  }`}
                  aria-pressed={audience === value}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic chips */}
          <div>
            <p className="spatial-label mb-2">Topics</p>
            <div className="flex flex-wrap gap-1.5">
              {TOPIC_SUGGESTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTopic(t)}
                  aria-pressed={topics.includes(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    topics.includes(t)
                      ? 'bg-mercury-black text-white'
                      : 'bg-mercury-gray-50 border border-mercury-gray-100 text-mercury-gray-600 hover:bg-mercury-gray-100'
                  }`}
                >
                  {topics.includes(t) && <X size={10} className="inline mr-1" />}
                  #{t}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-mercury-gray-400">
              {text.length}/5000
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => { setExpanded(false); setText(''); setTopics([]); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={loading}
                disabled={!text.trim()}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
