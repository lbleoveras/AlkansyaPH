export function formatCurrency(value: number): string {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatSignedCurrency(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}₱${Math.abs(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatSignedPoints(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)} pts`;
}

export function formatMarketCap(billions: number): string {
  return `₱${billions.toLocaleString('en-PH', { maximumFractionDigits: 1 })}B`;
}

export function formatFloat(million: number): string {
  return `${million.toLocaleString('en-PH', { maximumFractionDigits: 1 })}M shares`;
}

export function formatShares(quantity: number): string {
  return `${quantity.toLocaleString('en-PH')} ${quantity === 1 ? 'share' : 'shares'}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-PH');
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}
