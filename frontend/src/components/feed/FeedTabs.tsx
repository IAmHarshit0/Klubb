import React from 'react';
import type { FeedTab } from '../../api/feed';
import { Zap, GraduationCap, Users, Rss, LucideIcon } from 'lucide-react';

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

const TABS: { id: FeedTab; label: string; icon: LucideIcon }[] = [
  { id: 'for-you', label: 'For You', icon: Zap },
  { id: 'alumni', label: 'Alumni', icon: GraduationCap },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'following', label: 'Following', icon: Rss },
];

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  return (
    <div className="flex items-center justify-between border-b border-mercury-gray-100 bg-white sticky top-0 z-10 px-6">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Feed views"
        className="flex overflow-x-auto scrollbar-hide gap-2"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`feed-panel-${id}`}
            onClick={() => onTabChange(id)}
            className={`feed-tab flex items-center gap-2 whitespace-nowrap ${activeTab === id ? 'active' : ''}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
