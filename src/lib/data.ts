import { useQuery } from '@tanstack/react-query';
import { useBackendReady } from './backend-status';

export interface UseAppDataArgs<T> {
  key: string;
  mock: T;
  fetchLive: () => Promise<T>;
}

export function useAppData<T>({ key, mock, fetchLive }: UseAppDataArgs<T>) {
  const ready = useBackendReady();
  const q = useQuery({
    queryKey: ['app-data', key, ready],
    queryFn: fetchLive,
    enabled: ready,
  });
  // Deliberately no placeholderData option here — TanStack Query's
  // generic placeholderData typing fights a caller-supplied generic T.
  // The fallback below already covers it: mock renders until `ready`
  // flips true AND the first live fetch resolves.
  return {
    data: ready ? (q.data ?? mock) : mock,
    isLive: ready && q.isSuccess,
    isLoading: ready && q.isLoading,
    error: ready ? q.error : null,
    refetch: q.refetch,
  };
}
