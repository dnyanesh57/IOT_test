'use client';

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
}

export function useApiData<T>(url: string, options?: Partial<UseQueryOptions<T>>) {
  return useQuery<T>({ queryKey: [url], queryFn: () => fetcher<T>(url), ...(options ?? {}) });
}
