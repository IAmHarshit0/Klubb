import React from 'react';
import { Search, Users, Rss } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-mercury-gray-50 border border-mercury-gray-100 flex items-center justify-center mb-5 text-mercury-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-mercury-black mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-mercury-gray-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function FeedEmptyState() {
  return (
    <EmptyState
      icon={<Rss size={24} />}
      title="Nothing to show yet"
      description="Follow people and topics or check a different feed tab to see relevant content."
    />
  );
}

export function SearchEmptyState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<Search size={24} />}
      title={query ? `No results for "${query}"` : 'Start searching'}
      description={
        query
          ? 'Try broader terms, check spelling, or remove a filter.'
          : 'Search by name, company, role, skill, or institution.'
      }
    />
  );
}

export function NoConnectionsState() {
  return (
    <EmptyState
      icon={<Users size={24} />}
      title="No connections yet"
      description="Discover alumni and peers and send connection requests."
    />
  );
}
