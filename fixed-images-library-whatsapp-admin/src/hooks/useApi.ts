import { useCallback, useEffect, useRef, useState } from "react";
import { getConnection, startMonitor, subscribe } from "../api";

/**
 * Generic async-resource hook: loading / error / data / refetch,
 * auto-refreshing whenever the repository signals a change.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  const fn = useRef(fetcher);
  fn.current = fetcher;

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fn.current();
      if (alive.current) {
        setData(res);
        setError(null);
      }
    } catch (e: any) {
      if (alive.current) setError(e?.message || "Could not load data.");
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void load();
    const off = subscribe(() => void load(true));
    return () => {
      alive.current = false;
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: () => load(false) };
}

/** Live backend connection state (online / offline / connecting + queue size). */
export function useConnection() {
  const [conn, setConn] = useState(getConnection);
  useEffect(() => {
    startMonitor();
    const off = subscribe(() => setConn(getConnection()));
    const t = setInterval(() => setConn(getConnection()), 5000);
    return () => {
      off();
      clearInterval(t);
    };
  }, []);
  return conn;
}
