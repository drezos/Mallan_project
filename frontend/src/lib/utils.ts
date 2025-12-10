import { clsx, type ClassValue } from 'clsx'

// Combine class names with clsx
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format large numbers with K/M suffix
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

// Format percentage with + sign for positive
export function formatPercentage(num: number, showSign = true): string {
  const sign = showSign && num > 0 ? '+' : ''
  return `${sign}${num.toFixed(1)}%`
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }
  
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short' 
  })
}

// Get trend color class
export function getTrendColor(value: number): string {
  if (value > 0) return 'text-forest-600'
  if (value < 0) return 'text-red-500'
  return 'text-slate-500'
}

// Get trend background class
export function getTrendBg(value: number): string {
  if (value > 0) return 'bg-forest-50'
  if (value < 0) return 'bg-red-50'
  return 'bg-slate-100'
}

// Get severity color classes
export function getSeverityClasses(severity: 'high' | 'medium' | 'low'): string {
  switch (severity) {
    case 'high':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'medium':
      return 'bg-ember-50 text-ember-700 border-ember-200'
    case 'low':
      return 'bg-forest-50 text-forest-700 border-forest-200'
  }
}

// Get status indicator classes
export function getStatusClasses(status: 'normal' | 'watching' | 'threat'): {
  dot: string
  text: string
  bg: string
} {
  switch (status) {
    case 'threat':
      return {
        dot: 'bg-red-500',
        text: 'text-red-700',
        bg: 'bg-red-50',
      }
    case 'watching':
      return {
        dot: 'bg-ember-500',
        text: 'text-ember-700',
        bg: 'bg-ember-50',
      }
    default:
      return {
        dot: 'bg-forest-500',
        text: 'text-forest-700',
        bg: 'bg-forest-50',
      }
  }
}

// Get score color based on value (0-10 scale)
export function getScoreColor(score: number): string {
  if (score >= 7) return 'text-forest-600 bg-forest-50'
  if (score >= 4) return 'text-ember-600 bg-ember-50'
  return 'text-red-600 bg-red-50'
}

// Chart colors
export const chartColors = {
  primary: '#2d6e40',    // forest-600
  secondary: '#fe7c11',  // ember-500
  tertiary: '#3d8a52',   // forest-500
  muted: '#9aa0a6',      // slate-500
  grid: '#e8eaed',       // slate-200
  
  // For multi-series charts
  series: [
    '#2d6e40', // forest
    '#fe7c11', // ember
    '#3d8a52', // forest light
    '#c64808', // ember dark
    '#5fa670', // forest-400
  ],
  
  // Gradient for area charts
  gradients: {
    forest: {
      start: 'rgba(45, 110, 64, 0.3)',
      end: 'rgba(45, 110, 64, 0.02)',
    },
    ember: {
      start: 'rgba(254, 124, 17, 0.3)',
      end: 'rgba(254, 124, 17, 0.02)',
    },
  },
}
