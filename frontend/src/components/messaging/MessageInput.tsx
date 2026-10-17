import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, disabled = false, placeholder = 'Type a message...' }: MessageInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;

    // Client-side validation
    if (trimmed.length > 2000) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setText('');
      textareaRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-3 p-4 border-t border-mercury-gray-100 bg-white">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Connection required to message' : placeholder}
        disabled={disabled || sending}
        maxLength={2000}
        rows={1}
        aria-label="Message input"
        className="flex-1 mercury-input resize-none min-h-[42px] max-h-32 overflow-y-auto"
        style={{ height: 'auto' }}
        onInput={(e) => {
          const t = e.currentTarget;
          t.style.height = 'auto';
          t.style.height = `${t.scrollHeight}px`;
        }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending || disabled}
        aria-label="Send message"
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
          text.trim() && !disabled
            ? 'bg-mercury-black text-white hover:bg-mercury-gray-900'
            : 'bg-mercury-gray-100 text-mercury-gray-400 cursor-not-allowed'
        }`}
      >
        {sending ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send size={16} />
        )}
      </button>
    </div>
  );
}
