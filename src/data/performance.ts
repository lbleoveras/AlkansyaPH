import { PerformanceRange, PortfolioPoint } from '@/types';

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash || 1;
}

function mulberry32(seed: number) {
  let state = seed;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type RangeConfig = {
  points: number;
  unit: 'day' | 'week' | 'month';
  volatility: number;
  driftStart: number;
};

const RANGE_CONFIG: Record<PerformanceRange, RangeConfig> = {
  '1W': { points: 7, unit: 'day', volatility: 0.01, driftStart: -0.035 },
  '1M': { points: 22, unit: 'day', volatility: 0.013, driftStart: -0.08 },
  '3M': { points: 13, unit: 'week', volatility: 0.018, driftStart: -0.15 },
  '1Y': { points: 12, unit: 'month', volatility: 0.028, driftStart: -0.26 },
};

export function generatePerformanceSeries(
  range: PerformanceRange,
  endValue: number,
): PortfolioPoint[] {
  const config = RANGE_CONFIG[range];
  const random = mulberry32(hashSeed(range));
  const startFactor = 1 + config.driftStart;

  const factors: number[] = [];
  for (let i = 0; i < config.points; i++) {
    const t = i / (config.points - 1);
    const eased = 1 - Math.pow(1 - t, 2);
    const base = startFactor + (1 - startFactor) * eased;
    const noise = (random() - 0.5) * config.volatility;
    factors.push(base + noise);
  }
  factors[factors.length - 1] = 1;

  const now = new Date();
  return factors.map((factor, i) => {
    const stepsFromEnd = config.points - 1 - i;
    const date = new Date(now);
    if (config.unit === 'day') date.setDate(date.getDate() - stepsFromEnd);
    if (config.unit === 'week') date.setDate(date.getDate() - stepsFromEnd * 7);
    if (config.unit === 'month') date.setMonth(date.getMonth() - stepsFromEnd);
    return { date: date.toISOString(), value: Math.max(0, endValue * factor) };
  });
}
