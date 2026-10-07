'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes cache validity for master & static data
            gcTime: 1000 * 60 * 15, // 15 minutes in-memory garbage collection
            refetchOnWindowFocus: false, // Prevent redundant refetches on tab switching
            refetchOnReconnect: true, // Auto refetch when internet reconnects
            retry: (failureCount, error: any) => {
              // Don't retry on client errors (401, 403, 404)
              if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
                return false;
              }
              // Retry up to 3 times on server (5xx) or network timeouts
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000), // Exponential backoff (1s, 2s, 4s...)
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
