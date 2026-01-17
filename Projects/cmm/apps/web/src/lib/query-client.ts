'use client';

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000,
      refetchInterval: 15 * 1000,
      refetchOnWindowFocus: true,
    },
  },
});
