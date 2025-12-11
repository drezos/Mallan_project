// Utility functions for MarketPulse dashboard

import { clsx, type ClassValue } from 'clsx';

// Classname utility (simplified version without clsx dependency)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Format large numbers with K/M suffixes
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// Format percentage with sign
export function formatPercent(num: number, includeSign = true): string {
  const sign = includeSign && num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

// Format currency
export function formatCurrency(num: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Get trend direction
export function getTrendDirection(change: number): 'up' | 'down' | 'stable' {
  if (change > 0.5) return 'up';
  if (change < -0.5) return 'down';
  return 'stable';
}

// Get risk level color classes
export function getRiskColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'high':
      return 'text-red-700 bg-red-100';
    case 'medium':
      return 'text-amber-700 bg-amber-100';
    case 'low':
      return 'text-emerald-700 bg-emerald-100';
    default:
      return 'text-slate-600 bg-slate-100';
  }
}

// Get velocity status color classes
export function getVelocityColor(trend: string): string {
  switch (trend.toLowerCase()) {
    case 'accelerating':
      return 'text-red-600 bg-red-50';
    case 'stable':
      return 'text-slate-600 bg-slate-50';
    case 'decelerating':
      return 'text-emerald-600 bg-emerald-50';
    default:
      return 'text-slate-600 bg-slate-50';
  }
}

// Get severity icon
export function getSeverityIcon(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
}

// Calculate percentage of total
export function calcPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

// Truncate text with ellipsis
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
