import { useMemo, useState } from 'react';

import { generatePerformanceSeries } from '@/data/performance';
import { PerformanceRange } from '@/types';

export function useRangeSeries(endValue: number, initialRange: PerformanceRange = '1M') {
  const [range, setRange] = useState<PerformanceRange>(initialRange);
  const points = useMemo(() => generatePerformanceSeries(range, endValue), [range, endValue]);

  const { changeAmount, changePercent, isPositive } = useMemo(() => {
    const first = points[0]?.value ?? endValue;
    const last = points[points.length - 1]?.value ?? endValue;
    const amount = last - first;
    const percent = first > 0 ? (amount / first) * 100 : 0;
    return { changeAmount: amount, changePercent: percent, isPositive: amount >= 0 };
  }, [points, endValue]);

  return { range, setRange, points, changeAmount, changePercent, isPositive };
}
