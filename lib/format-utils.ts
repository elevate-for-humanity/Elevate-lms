/**
 * Safe formatting utilities to prevent "Cannot read properties of undefined" errors
 */

/**
 * Safely format a date to locale string
 * @param date - Date string, Date object, or null/undefined
 * @param fallback - Fallback text if date is invalid (default: 'N/A')
 * @returns Formatted date string or fallback
 */
export function safeFormatDate(
  date: string | Date | null | undefined,
  fallback: string = 'N/A',
): string {
  if (!date) return fallback;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return fallback;
    return dateObj.toLocaleDateString();
  } catch (error) {
    return fallback;
  }
}

/**
 * Safely format a date and time to locale string
 * @param date - Date string, Date object, or null/undefined
 * @param fallback - Fallback text if date is invalid (default: 'N/A')
 * @returns Formatted datetime string or fallback
 */
export function safeFormatDateTime(
  date: string | Date | null | undefined,
  fallback: string = 'N/A',
): string {
  if (!date) return fallback;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return fallback;
    return dateObj.toLocaleString();
  } catch (error) {
    return fallback;
  }
}

/**
 * Safely format a number to locale string
 * @param value - Number or null/undefined
 * @param fallback - Fallback text if value is invalid (default: '0')
 * @returns Formatted number string or fallback
 */
export function safeFormatNumber(value: number | null | undefined, fallback: string = '0'): string {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  return value.toLocaleString();
}

/**
 * Safely format currency
 * @param value - Number or null/undefined
 * @param currency - Currency code (default: 'USD')
 * @param fallback - Fallback text if value is invalid (default: '$0')
 * @returns Formatted currency string or fallback
 */
export function safeFormatCurrency(
  value: number | null | undefined,
  currency: string = 'USD',
  fallback: string = '$0',
): string {
  if (value === null || value === undefined || isNaN(value)) return fallback;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  } catch (error) {
    return `$${safeFormatNumber(value, '0')}`;
  }
}

/**
 * Safely format percentage
 * @param value - Number (0-100) or null/undefined
 * @param decimals - Number of decimal places (default: 0)
 * @param fallback - Fallback text if value is invalid (default: '0%')
 * @returns Formatted percentage string or fallback
 */
export function safeFormatPercent(
  value: number | null | undefined,
  decimals: number = 0,
  fallback: string = '0%',
): string {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  return `${value.toFixed(decimals)}%`;
}
