// Utility functions for MarketPulse frontend

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class merger (handles conflicting classes)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format large numbers with locale (e.g., 12500 -> "12.500")
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  return num.toLocaleString('nl-NL');
}

// Format percentage with sign (e.g., 5.2 -> "+5.2%")
export function formatPercentage(num: number | undefined | null, showSign = false): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0%';
  }
  const sign = showSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

// Format score (e.g., 6.8 -> "6.8")
export function formatScore(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0.0';
  }
  return num.toFixed(1);
}

// Get color class based on trend direction
export function getTrendColor(trend: string | undefined): string {
  switch (trend?.toLowerCase()) {
    case 'growing':
    case 'gaining':
    case 'up':
    case 'positive':
      return 'text-green-600';
    case 'declining':
    case 'losing':
    case 'down':
    case 'negative':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

// Get color class based on severity level
export function getSeverityColor(severity: string | undefined): string {
  switch (severity?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
