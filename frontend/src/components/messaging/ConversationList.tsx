import React from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import type { Conversation } from '../../types/api';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelect: (conv: Conversation) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-mercury-gray-50 border border-mercury-gray-100 flex items-center justify-center mb-4 text-mercury-gray-300">
          <MessageCircle size={22} />
        </div>
        <p className="text-sm font-semibold text-mercury-black mb-1">No messages yet</p>
        <p className="text-xs text-mercury-gray-400 leading-relaxed">
          Connect with someone to start a conversation.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-mercury-gray-50" role="list" aria-label="Conversations">
      {conversations.map((conv) => {
        const isActive = conv.id === activeConversationId;
        const other = conv.otherUser;

        return (
          <li key={conv.id}>
            <button
              onClick={() => onSelect(conv)}
              aria-current={isActive ? 'true' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-mercury-gray-50 transition-colors text-left ${
                isActive ? 'bg-mercury-gray-50' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  isActive ? 'bg-mercury-black text-white' : 'bg-mercury-gray-100 text-mercury-gray-700'
                }`}
              >
                {other?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-mercury-black truncate">
                    {other?.name || 'Unknown'}
                  </span>
                  <span className="text-xs text-mercury-gray-400 flex-shrink-0 flex items-center gap-1 ml-2">
                    <Clock size={10} />
                    {timeAgo(conv.lastMessageAt)}
                  </span>
                </div>
                {other?.skills?.length ? (
                  <span className="text-xs text-mercury-gray-400 truncate block">
                    {other.skills.slice(0, 2).join(', ')}
                  </span>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
