'use client';

import React, { useEffect, useRef } from 'react';
import { QueryKey } from '@tanstack/react-query';
import { usePaginatedQuery, PaginatedResponse } from '@/hooks/usePaginatedQuery';
import { Loader2, RefreshCw, AlertCircle, Sparkles, Inbox, ChevronDown } from 'lucide-react';

export interface PaginatedFetchRenderProps<T> {
  items: T[];
  totalCount?: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isRefetching: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  refetch: () => void;
  isError: boolean;
  error: unknown;
}

export interface PaginatedFetchProps<T> {
  queryKey: QueryKey;
  fetcher: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>;
  pageSize?: number;
  initialPage?: number;
  enabled?: boolean;
  staleTime?: number;
  infiniteScroll?: boolean;
  loadMoreText?: string;
  itemKey?: (item: T, index: number) => string | number;
  renderItem?: (item: T, index: number) => React.ReactNode;
  renderSkeleton?: () => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderError?: (error: unknown, refetch: () => void) => React.ReactNode;
  layout?: 'grid' | 'list' | 'custom';
  className?: string;
  children?: (props: PaginatedFetchRenderProps<T>) => React.ReactNode;
}

export default function PaginatedFetch<T>({
  queryKey,
  fetcher,
  pageSize = 20,
  initialPage = 1,
  enabled = true,
  staleTime = 1000 * 60 * 2,
  infiniteScroll = false,
  loadMoreText,
  itemKey,
  renderItem,
  renderSkeleton,
  renderEmpty,
  renderError,
  layout = 'list',
  className,
  children,
}: PaginatedFetchProps<T>) {
  const {
    items,
    totalCount,
    isLoading,
    isFetchingNextPage,
    isRefetching,
    isError,
    error,
    hasNextPage,
    loadMore,
    refetch,
  } = usePaginatedQuery<T>({
    queryKey,
    fetcher,
    pageSize,
    initialPage,
    enabled,
    staleTime,
  });

  // Infinite Scroll Trigger using IntersectionObserver
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infiniteScroll || !hasNextPage || isFetchingNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          loadMore();
        }
      },
      { threshold: 0.2, rootMargin: '150px' }
    );

    const target = loadMoreSentinelRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [infiniteScroll, hasNextPage, isFetchingNextPage, isLoading, loadMore]);

  // If consumer provides custom children render function, delegate rendering
  if (children) {
    return (
      <>
        {children({
          items,
          totalCount,
          isLoading,
          isFetchingNextPage,
          isRefetching,
          hasNextPage,
          loadMore,
          refetch,
          isError,
          error,
        })}
      </>
    );
  }

  // 1. Initial Loading Skeleton State
  if (isLoading) {
    if (renderSkeleton) return <>{renderSkeleton()}</>;

    return (
      <div className="space-y-4 py-6">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
            <span>Loading initial batch (page size: {pageSize})...</span>
          </div>
          <div className="h-3 w-20 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-800 rounded w-1/3" />
                  <div className="h-2.5 bg-slate-850 rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-slate-800/50 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    if (renderError) return <>{renderError(error, refetch)}</>;

    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-rose-950 flex items-center justify-center mx-auto border border-rose-800/60">
          <AlertCircle className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-200">Failed to load data</h4>
          <p className="text-xs text-rose-300/70 mt-1 max-w-md mx-auto">
            {error instanceof Error ? error.message : 'An error occurred while fetching paginated records.'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-100 text-xs font-semibold rounded-xl border border-rose-700/60 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (items.length === 0) {
    if (renderEmpty) return <>{renderEmpty()}</>;

    return (
      <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
        <Inbox className="w-8 h-8 text-slate-500 mx-auto" />
        <div>
          <p className="text-sm font-semibold text-slate-300">No items available</p>
          <p className="text-xs text-slate-500 mt-0.5">No records found for this query.</p>
        </div>
      </div>
    );
  }

  // 4. Content State
  const defaultLayoutClass =
    layout === 'grid'
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
      : 'space-y-3';

  return (
    <div className="space-y-5">
      {/* Background Refetching Indicator */}
      {isRefetching && (
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-sky-400 animate-pulse">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Syncing latest updates...</span>
        </div>
      )}

      {/* Rendered Items */}
      <div className={className || defaultLayoutClass}>
        {items.map((item, index) => {
          const key = itemKey ? itemKey(item, index) : (item as any)?.id || index;
          return (
            <React.Fragment key={key}>
              {renderItem ? renderItem(item, index) : <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Pagination Footer Controls */}
      {hasNextPage ? (
        <div className="pt-3">
          {infiniteScroll ? (
            <div
              ref={loadMoreSentinelRef}
              className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                  <span>Loading more items...</span>
                </>
              ) : (
                <span className="text-slate-500">Scroll down to load more</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-400">
                Loaded <strong className="text-slate-100">{items.length}</strong>
                {totalCount ? (
                  <>
                    {' '}of <strong className="text-slate-100">{totalCount}</strong>
                  </>
                ) : null}{' '}
                items
              </span>

              <button
                onClick={() => loadMore()}
                disabled={isFetchingNextPage}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading batch...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    {loadMoreText || `Load More (+${pageSize})`}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        items.length > 0 && (
          <div className="py-4 text-center text-xs text-slate-500 border-t border-slate-800/60">
            <span>All {items.length} items loaded</span>
          </div>
        )
      )}
    </div>
  );
}
