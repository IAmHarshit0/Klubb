import React from 'react';
import type { FeedTab, FeedMode } from '../../api/feed';
import { Zap, GraduationCap, Users, SlidersHorizontal, LucideIcon } from 'lucide-react';

interface FeedTabsProps {
  activeTab: FeedTab;
  activeMode: FeedMode;
  onTabChange: (tab: FeedTab) => void;
  onModeChange: (mode: FeedMode) => void;
}

const TABS: { id: FeedTab; label: string; icon: LucideIcon }[] = [
  { id: 'for-you', label: 'For You', icon: Zap },
  { id: 'alumni', label: 'Alumni', icon: GraduationCap },
  { id: 'students', label: 'Students', icon: Users },
];

export function FeedTabs({ activeTab, activeMode, onTabChange, onModeChange }: FeedTabsProps) {
  return (
    <div className="flex items-center justify-between border-b border-mercury-gray-100 bg-white sticky top-0 z-10">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Feed views"
        className="flex overflow-x-auto scrollbar-hide"
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

      {/* Mode toggle */}
      <div className="flex items-center gap-1.5 pr-4 flex-shrink-0">
        <SlidersHorizontal size={13} className="text-mercury-gray-400" />
        <div className="flex rounded-lg border border-mercury-gray-100 overflow-hidden">
          {(['baseline', 'reranked'] as FeedMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              aria-pressed={activeMode === mode}
              className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                activeMode === mode
                  ? 'bg-mercury-black text-white'
                  : 'bg-white text-mercury-gray-500 hover:text-mercury-black'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
