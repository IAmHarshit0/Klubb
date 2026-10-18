import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getFeed } from '../api/feed';
import type { FeedTab, FeedMode } from '../api/feed';
import { FeedTabs } from '../components/feed/FeedTabs';
import { PostCard } from '../components/feed/PostCard';
import { CreatePostForm } from '../components/feed/CreatePostForm';
import { SkeletonCard, PageSpinner } from '../components/ui/Spinner';
import { FeedEmptyState } from '../components/ui/EmptyState';
import { RefreshCw } from 'lucide-react';

export function FeedPage() {
  const [tab, setTab] = useState<FeedTab>('for-you');
  const [mode, setMode] = useState<FeedMode>('reranked');
  const [hiddenPosts, setHiddenPosts] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed', tab, mode],
    queryFn: ({ pageParam }) =>
      getFeed({ tab, mode, limit: 20, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: undefined as string | undefined,
  });

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchNextPage();
      },
      {
        root: document.getElementById('main-content'),
        rootMargin: '400px 0px',
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleTabChange = useCallback((newTab: FeedTab) => {
    setTab(newTab);
    setHiddenPosts(new Set());
  }, []);

  const handleModeChange = useCallback((newMode: FeedMode) => {
    setMode(newMode);
  }, []);

  const handlePostSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
  }, [queryClient]);

  const handleHide = useCallback((postId: string) => {
    setHiddenPosts((prev) => new Set([...prev, postId]));
  }, []);

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const visibleItems = allItems.filter((item) => !hiddenPosts.has(item.post.id));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mercury Visions hero banner */}
      <div className="relative overflow-hidden px-6 py-10 border-b border-mercury-gray-100">
        {/* Decorative blobs */}
        <div
          className="mercury-blob w-48 h-48 -top-12 -right-16 opacity-60"
          style={{ animation: 'blobFloat 8s ease-in-out infinite' }}
          aria-hidden="true"
        />
        <div
          className="mercury-blob w-32 h-32 bottom-0 -left-10 opacity-40"
          style={{ animation: 'blobFloat 10s ease-in-out infinite reverse' }}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <span className="spatial-label block mb-3">Campus Network v3.0</span>
          <h1 className="text-4xl font-black leading-none tracking-tight gradient-heading mb-2">
            Your Feed
          </h1>
          <p className="text-sm text-mercury-gray-500 max-w-sm">
            Personalized posts from your institution, alumni network, and followed topics.
          </p>
        </div>
      </div>

      <div className="px-6 pt-5 pb-4">
        <CreatePostForm onSuccess={handlePostSuccess} />
      </div>

      {/* Feed tabs */}
      <FeedTabs
        activeTab={tab}
        onTabChange={handleTabChange}
      />

      {/* Feed content */}
      <div
        id={`feed-panel-${tab}`}
        role="region"
        aria-label={`${tab} feed`}
        className="px-6 py-5 space-y-4"
      >
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {isError && (
          <div className="mercury-card p-6 text-center">
            <p className="text-sm text-mercury-gray-600 mb-3">
              {(error as Error).message}
            </p>
            <button onClick={() => refetch()} className="btn-secondary text-sm inline-flex items-center gap-2">
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {!isLoading && visibleItems.length === 0 && !isError && (
          <FeedEmptyState />
        )}

        {visibleItems.map((item) => (
          <PostCard key={item.post.id} item={item} onHide={handleHide} />
        ))}

        {/* Load more */}
        {hasNextPage && (
          <div className="pt-2 pb-8 flex flex-col items-center gap-3">
            <div ref={loadMoreRef} aria-hidden="true" className="h-1 w-full" />
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="btn-secondary flex items-center gap-2"
            >
              {isFetchingNextPage ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Load more
            </button>
          </div>
        )}
        {!hasNextPage && visibleItems.length > 0 && (
          <p className="py-6 text-center text-xs text-mercury-gray-400">You’re all caught up.</p>
        )}
      </div>
    </div>
  );
}
