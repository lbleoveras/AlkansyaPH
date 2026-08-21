import { createContext, ReactNode, use, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { usePortfolio } from '@/context/portfolio-context';
import { getSeenNotificationsSignature, markNotificationsSeen } from '@/lib/notification-memory';
import { formatSignedPercent } from '@/utils/format';

export type Notification = { id: string; text: string; positive: boolean };

type NotificationsContextValue = {
  notifications: Notification[];
  hasUnseen: boolean;
  markSeen: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// Computed and tracked once here, shared by every screen's bell icon via
// useNotifications() -- previously each tab's ScreenHeader kept its own
// local "seen" state, read from AsyncStorage independently on mount. Since
// React Navigation keeps tab screens mounted after their first visit, each
// tab's copy went stale the moment you marked notifications seen on a
// *different* tab, so the badge kept reappearing as you browsed. One
// shared source of truth fixes that.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { holdingsWithMarketData } = usePortfolio();
  const [seenSignature, setSeenSignature] = useState<string | null>(null);

  const notifications = useMemo(
    () =>
      [...holdingsWithMarketData]
        .sort((a, b) => Math.abs(b.stock.changePercent) - Math.abs(a.stock.changePercent))
        .map((holding) => ({
          id: holding.id,
          text: `${holding.symbol} is ${holding.stock.changePercent >= 0 ? 'up' : 'down'} ${formatSignedPercent(
            holding.stock.changePercent,
          ).replace('+', '')} today`,
          positive: holding.stock.changePercent >= 0,
        })),
    [holdingsWithMarketData],
  );

  // Identifies which holdings currently have a notable move, by direction
  // only -- not the exact live percent, which drifts slightly every time
  // prices refresh in the background. Keying on the exact number would
  // silently un-clear the badge on a routine price poll with nothing
  // actually new to see.
  const signature = useMemo(
    () =>
      notifications
        .map((note) => `${note.id}:${note.positive ? 'up' : 'down'}`)
        .sort()
        .join('|'),
    [notifications],
  );

  useEffect(() => {
    if (!user) {
      setSeenSignature(null);
      return;
    }
    getSeenNotificationsSignature(user.id).then(setSeenSignature);
  }, [user]);

  const hasUnseen = notifications.length > 0 && signature !== seenSignature;

  const markSeen = () => {
    setSeenSignature(signature);
    if (user) void markNotificationsSeen(user.id, signature);
  };

  return <NotificationsContext value={{ notifications, hasUnseen, markSeen }}>{children}</NotificationsContext>;
}

export function useNotifications() {
  const context = use(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
