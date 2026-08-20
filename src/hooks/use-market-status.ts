import { useEffect, useState } from 'react';

import { isPseMarketOpen } from '@/utils/market-hours';

export function useMarketStatus(pollIntervalMs = 30000) {
  const [isOpen, setIsOpen] = useState(() => isPseMarketOpen());

  useEffect(() => {
    const id = setInterval(() => setIsOpen(isPseMarketOpen()), pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs]);

  return isOpen;
}
