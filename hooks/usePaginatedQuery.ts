'use client';

import { useInfiniteQuery, QueryKey } from '@tanstack/react-query';

export interface PaginatedResponse<T> {
  data: T[];
  hasMore?: boolean;
  totalCount?: number;
  nextPage?: number | null;
}

export interface UsePaginatedQueryOptions<T> {
  queryKey: QueryKey;
  fetcher: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>;
  pageSize?: number;
  initialPage?: number;
  enabled?: boolean;
  staleTime?: number;
}

export function usePaginatedQuery<T>({
  queryKey,
  fetcher,
  pageSize = 20,
  initialPage = 1,
  enabled = true,
  staleTime = 1000 * 60 * 2, // 2 minutes
}: UsePaginatedQueryOptions<T>) {
  const query = useInfiniteQuery({
    queryKey: [...queryKey, { pageSize }],
    queryFn: async ({ pageParam = initialPage }) => {
      return await fetcher(pageParam as number, pageSize);
    },
    initialPageParam: initialPage,
    getNextPageParam: (lastPage, allPages) => {
      // Determine if there are more items to fetch
      if (lastPage.nextPage !== undefined && lastPage.nextPage !== null) {
        return lastPage.nextPage;
      }
      if (lastPage.hasMore !== undefined) {
        return lastPage.hasMore ? initialPage + allPages.length : undefined;
      }
      // If no explicit hasMore, infer from returned batch length
      if (lastPage.data && lastPage.data.length === pageSize) {
        return initialPage + allPages.length;
      }
      return undefined;
    },
    enabled,
    staleTime,
  });

  // Flatten all items across fetched pages
  const items: T[] = query.data?.pages.flatMap((page) => page.data) || [];
  const latestPage = query.data?.pages[query.data.pages.length - 1];
  const totalCount = latestPage?.totalCount;

  return {
    items,
    totalCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isRefetching: query.isRefetching && !query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    hasNextPage: Boolean(query.hasNextPage),
    loadMore: query.fetchNextPage,
    refetch: query.refetch,
    rawQuery: query,
  };
}
