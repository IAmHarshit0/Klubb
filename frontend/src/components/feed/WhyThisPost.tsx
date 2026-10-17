import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface WhyThisPostProps {
  explanation: string;
  score?: number;
}

export function WhyThisPost({ explanation, score }: WhyThisPostProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="Why am I seeing this post?"
        aria-expanded={open}
        aria-haspopup="true"
        className="text-mercury-gray-400 hover:text-mercury-gray-600 transition-colors"
      >
        <HelpCircle size={15} />
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute right-0 top-full mt-2 w-64 bg-white border border-mercury-gray-100 rounded-xl shadow-mercury-lg z-20 p-4 animate-slide-up"
        >
          <p className="spatial-label mb-2">Why this post?</p>
          <p className="text-sm text-mercury-gray-700 leading-relaxed">{explanation}</p>
          {typeof score === 'number' && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-mercury-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-mercury-black rounded-full"
                  style={{ width: `${Math.min(100, Math.round(score * 100))}%` }}
                />
              </div>
              <span className="text-xs text-mercury-gray-400 flex-shrink-0">
                {(score * 100).toFixed(0)}% match
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
