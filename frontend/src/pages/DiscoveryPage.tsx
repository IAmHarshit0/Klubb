import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { discoverPeople } from '../api/discovery';
import { sendConnectionRequest, getConnections } from '../api/connections';
import type { PeopleSearchParams } from '../api/discovery';
import { PersonCard } from '../components/discovery/PersonCard';
import { FilterChips } from '../components/discovery/FilterChips';
import { Input } from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Spinner';
import { SearchEmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { Connection } from '../types/api';

const FILTER_FIELDS = [
  { key: 'company', label: 'Company', placeholder: 'e.g. Stripe' },
  { key: 'role', label: 'Role', placeholder: 'e.g. Software Engineer' },
  { key: 'skill', label: 'Skill', placeholder: 'e.g. TypeScript' },
  { key: 'batch', label: 'Batch', placeholder: 'e.g. Class of 2020' },
];

export function DiscoveryPage() {
  const { toast } = useToast();
  const { userId } = useAuth();

  // Search state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filterInputs, setFilterInputs] = useState<Record<string, string>>({});

  // Connect modal
  const [connectModal, setConnectModal] = useState<{ open: boolean; personId: string; name: string }>({
    open: false,
    personId: '',
    name: '',
  });
  const [connectMsg, setConnectMsg] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const searchParams: PeopleSearchParams = { q: debouncedQuery, ...filters };
  const hasSearch = Object.values(searchParams).some(Boolean);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['discover', 'people', searchParams],
    queryFn: () => discoverPeople(searchParams),
  });

  const { data: connectionsData } = useQuery({
    queryKey: ['connections', userId],
    queryFn: () => getConnections(),
  });

  const getConnectionState = useCallback(
    (personId: string): 'none' | 'pending' | 'accepted' => {
      const conn = connectionsData?.connections?.find(
        (c: Connection) => c.requesterId === personId || c.recipientId === personId
      );
      if (!conn) return 'none';
      return conn.status === 'accepted' ? 'accepted' : conn.status === 'pending' ? 'pending' : 'none';
    },
    [connectionsData]
  );

  const handleConnect = (personId: string, name: string) => {
    setConnectModal({ open: true, personId, name });
    setConnectMsg('');
  };

  const handleSendRequest = async () => {
    if (!connectMsg.trim()) {
      toast('Please write a short message.', 'error');
      return;
    }
    setConnectLoading(true);
    try {
      await sendConnectionRequest(connectModal.personId, connectMsg.trim());
      toast('Connection request sent!', 'success');
      setConnectModal({ open: false, personId: '', name: '' });
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setConnectLoading(false);
    }
  };

  const applyFilters = () => {
    const newFilters: Record<string, string> = {};
    for (const [k, v] of Object.entries(filterInputs)) {
      if (v?.trim()) newFilters[k] = v.trim();
    }
    setFilters(newFilters);
    setShowFilters(false);
  };

  const removeFilter = (key: string) => {
    const { [key]: _, ...rest } = filters;
    setFilters(rest);
    setFilterInputs((prev) => ({ ...prev, [key]: '' }));
  };

  const clearAll = () => {
    setFilters({});
    setFilterInputs({});
    setQuery('');
    setDebouncedQuery('');
  };

  const activeFilterChips = Object.entries(filters).map(([key, value]) => ({
    key,
    label: key,
    value,
  }));

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Hero */}
      <div className="relative overflow-hidden mb-8">
        <div
          className="mercury-blob w-64 h-64 -top-20 -right-20 opacity-40"
          aria-hidden="true"
          style={{ animation: 'blobFloat 9s ease-in-out infinite' }}
        />
        <div className="relative z-10">
          <span className="spatial-label block mb-3">Professional Discovery</span>
          <h1 className="text-5xl font-black leading-none tracking-tight gradient-heading mb-3">
            Find People
          </h1>
          <p className="text-sm text-mercury-gray-500 max-w-md">
            Search alumni, students, and faculty by company, role, skill, or institution.
            Verification labels distinguish employer-verified from self-reported.
          </p>
        </div>
      </div>

      {/* Search bar + filter toggle */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mercury-gray-400 pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, skill, bio..."
            className="mercury-input pl-10"
            aria-label="Search people"
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className={`btn-secondary flex items-center gap-2 flex-shrink-0 ${
            Object.keys(filters).length > 0 ? 'border-mercury-black' : ''
          }`}
          aria-label="Open filters"
        >
          <SlidersHorizontal size={15} />
          Filters
          {Object.keys(filters).length > 0 && (
            <span className="w-5 h-5 rounded-full bg-mercury-black text-white text-xs font-bold flex items-center justify-center">
              {Object.keys(filters).length}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {activeFilterChips.length > 0 && (
        <div className="mb-5">
          <FilterChips filters={activeFilterChips} onRemove={removeFilter} onClearAll={clearAll} />
        </div>
      )}

      {/* Results */}
      <div>
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {isError && (
          <p className="text-sm text-red-600 text-center py-8">{(error as Error).message}</p>
        )}

        {data?.results?.length === 0 && !isLoading && (
          <SearchEmptyState query={debouncedQuery} />
        )}

        {data?.results && data.results.length > 0 && (
          <>
            <p className="text-xs text-mercury-gray-400 mb-4">
              {data.results.length} result{data.results.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.results.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  connectionState={getConnectionState(person.id)}
                  onConnect={(id) => handleConnect(id, person.name)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Filters modal */}
      <Modal isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filter People" size="md">
        <div className="space-y-4">
          {FILTER_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              placeholder={f.placeholder}
              value={filterInputs[f.key] || ''}
              onChange={(e) => setFilterInputs((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          ))}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={clearAll}>Clear all</Button>
            <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
          </div>
        </div>
      </Modal>

      {/* Connect modal */}
      <Modal
        isOpen={connectModal.open}
        onClose={() => setConnectModal({ open: false, personId: '', name: '' })}
        title={`Connect with ${connectModal.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-mercury-gray-600">
            Add a personal message to your request (required). Be specific about why you want to connect.
          </p>
          <Textarea
            label="Message"
            placeholder="Hi! I'm a fellow Apex student interested in..."
            value={connectMsg}
            onChange={(e) => setConnectMsg(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-mercury-gray-400">{connectMsg.length}/300</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setConnectModal({ open: false, personId: '', name: '' })}>
              Cancel
            </Button>
            <Button size="sm" loading={connectLoading} disabled={!connectMsg.trim()} onClick={handleSendRequest}>
              Send Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
