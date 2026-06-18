"use client";

import { useEffect, useState } from "react";
import { useAuthSession } from "@/contexts/auth-session";
import { peekCached } from "@/lib/api-cache";
import { ApiError } from "@/lib/api";

type UseAuthenticatedFetchOptions = {
  deps?: unknown[];
  cacheKey?: (token: string) => string;
};

export function useAuthenticatedFetch<T>(
  fetcher: (token: string) => Promise<T>,
  options: UseAuthenticatedFetchOptions = {},
) {
  const { deps = [], cacheKey } = options;
  const { session } = useAuthSession();
  const token = session?.token;

  const initialData =
    token && cacheKey ? peekCached<T>(cacheKey(token)) : null;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(() => Boolean(token) && !initialData);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = () => setReloadToken((value) => value + 1);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setData(null);
      return;
    }

    let cancelled = false;
    const cached = cacheKey ? peekCached<T>(cacheKey(token)) : null;

    if (cached) {
      setData(cached);
      setLoading(false);
    } else if (reloadToken === 0) {
      setLoading(true);
    }

    setError(null);

    fetcher(token)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Error al cargar datos.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, reloadToken, ...deps]);

  return { data, loading, error, session, refetch };
}
