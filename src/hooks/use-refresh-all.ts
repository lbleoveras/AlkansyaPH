import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

// Pull-to-refresh, wired to every screen's ScreenContainer. Refetches every
// currently-active query -- stocks, holdings, news, portfolio/stock history
// -- against what's already synced server-side, rather than forcing a new
// live poll of phisix/the news feeds (those already run on their own
// schedule; this just makes sure the app is showing their latest output).
export function useRefreshAll() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return { refreshing, onRefresh };
}
