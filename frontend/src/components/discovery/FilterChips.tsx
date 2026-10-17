import React from 'react';
import { X } from 'lucide-react';

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Active filters">
      {filters.map((f) => (
        <span
          key={f.key}
          className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-mercury-black text-white text-xs font-medium rounded-full"
        >
          <span className="text-mercury-gray-400 text-xs uppercase tracking-wide">{f.label}:</span>
          <span>{f.value}</span>
          <button
            onClick={() => onRemove(f.key)}
            aria-label={`Remove ${f.label} filter`}
            className="ml-0.5 w-4 h-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X size={10} />
          </button>
        </span>
      ))}

      <button
        onClick={onClearAll}
        className="text-xs text-mercury-gray-500 hover:text-mercury-black underline underline-offset-2 transition-colors"
        aria-label="Clear all filters"
      >
        Clear all
      </button>
    </div>
  );
}
