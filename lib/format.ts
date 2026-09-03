/**
 * Locale-safe formatting utilities for use in both server and client components.
 *
 * Always pass 'en-US' + timeZone: 'UTC' to prevent SSR/client hydration mismatches
 * caused by differing server vs browser locale/timezone settings.
 */

/** Format a date string or Date as "Jan 5, 2025" */
export function fmtDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Format a date string or Date as "Jan 5, 2025, 3:45 PM" */
export function fmtDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format a date string or Date as "3:45 PM" */
export function fmtTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format a number with commas: 1234567 → "1,234,567" */
export function fmtNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** Format a number as USD: 1234 → "$1,234" */
export function fmtUsd(value: number): string {
  return '$' + value.toLocaleString('en-US');
}

/** Format currency in compact form: 1234567 → "$1.2M", 12345 → "$12K" */
export function formatCurrencyCompact(value: number): string {
  if (value >= 1000000) return '$' + (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
  return '$' + value.toLocaleString('en-US');
}
