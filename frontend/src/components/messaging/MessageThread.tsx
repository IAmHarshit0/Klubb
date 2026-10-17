import React, { useEffect, useRef } from 'react';
import type { Message } from '../../types/api';

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  otherUserName?: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageThread({ messages, currentUserId, otherUserName }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-semibold text-mercury-black mb-1">
            Start the conversation
          </p>
          <p className="text-xs text-mercury-gray-400">
            Messages are end-to-end persisted and connection-gated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3"
      aria-label="Message thread"
      aria-live="polite"
    >
      {messages.map((msg) => {
        const isMine = msg.senderId === currentUserId;
        return (
          <div
            key={msg._id}
            className={`flex items-end gap-2 animate-fade-in ${isMine ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            {!isMine && (
              <div className="w-7 h-7 rounded-full bg-mercury-gray-100 flex items-center justify-center text-xs font-bold text-mercury-gray-600 flex-shrink-0">
                {otherUserName?.charAt(0) || '?'}
              </div>
            )}

            {/* Bubble */}
            <div className={`max-w-xs lg:max-w-md`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                  isMine
                    ? 'bg-mercury-black text-white rounded-br-md'
                    : 'bg-mercury-gray-50 border border-mercury-gray-100 text-mercury-black rounded-bl-md'
                }`}
              >
                {msg.text}
              </div>
              <p
                className={`text-xs text-mercury-gray-400 mt-1 ${isMine ? 'text-right' : 'text-left'}`}
                aria-label={`Sent at ${formatTime(msg.createdAt)}`}
              >
                {formatTime(msg.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
