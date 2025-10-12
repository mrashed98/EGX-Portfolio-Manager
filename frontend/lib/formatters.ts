/**
 * Formatting Utilities
 * Consistent formatting functions for numbers, currency, dates, and percentages
 */

/**
 * Format a number as Egyptian Pounds (EGP)
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56) // "1,234.56 EGP"
 * formatCurrency(1234567.89) // "1,234,567.89 EGP"
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} EGP`;
}

/**
 * Format large numbers in compact notation
 * @param value - The numeric value to format
 * @param currency - Whether to append currency symbol
 * @returns Compact formatted string
 * 
 * @example
 * formatCompact(1234) // "1.23K"
 * formatCompact(1234567) // "1.23M"
 * formatCompact(1234567, true) // "1.23M EGP"
 */
export function formatCompact(value: number, currency: boolean = false): string {
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.log10(Math.abs(value)) / 3 | 0;
  
  if (tier === 0) {
    return currency ? `${value.toFixed(0)} EGP` : value.toFixed(0);
  }
  
  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = value / scale;
  
  const formatted = scaled.toFixed(2);
  return currency ? `${formatted}${suffix} EGP` : `${formatted}${suffix}`;
}

/**
 * Format a percentage value
 * @param value - The numeric value (e.g., 2.5 for 2.5%)
 * @param decimals - Number of decimal places (default: 2)
 * @param showSign - Whether to show + for positive values
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercent(2.5) // "2.50%"
 * formatPercent(2.5, 1, true) // "+2.5%"
 * formatPercent(-1.23, 2, true) // "-1.23%"
 */
export function formatPercent(
  value: number,
  decimals: number = 2,
  showSign: boolean = false
): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a number with thousands separators
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.5678, 2) // "1,234.57"
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a date in a human-readable format
 * @param date - The date to format (Date object or ISO string)
 * @param format - Format style: 'short', 'long', or 'relative'
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2024-01-15') // "Jan 15, 2024"
 * formatDate('2024-01-15', 'long') // "January 15, 2024"
 * formatDate('2024-01-15', 'relative') // "2 days ago"
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'relative') {
    return formatRelativeTime(dateObj);
  }
  
  const options: Intl.DateTimeFormatOptions = format === 'long'
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format a date/time with time component
 * @param date - The date to format
 * @returns Formatted datetime string
 * 
 * @example
 * formatDateTime('2024-01-15T14:30:00') // "Jan 15, 2024 at 2:30 PM"
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
}

/**
 * Format a change value with sign and styling info
 * @param value - The change value
 * @param isPercent - Whether the value is a percentage
 * @returns Object with formatted string and direction
 * 
 * @example
 * formatChange(12.34) // { text: "+12.34", direction: "up", isPositive: true }
 * formatChange(-5.67, true) // { text: "-5.67%", direction: "down", isPositive: false }
 */
export function formatChange(value: number, isPercent: boolean = false) {
  const isPositive = value >= 0;
  const direction = isPositive ? 'up' : 'down';
  const sign = isPositive ? '+' : '';
  const suffix = isPercent ? '%' : '';
  
  return {
    text: `${sign}${value.toFixed(2)}${suffix}`,
    direction,
    isPositive,
    isNegative: !isPositive,
    isNeutral: value === 0,
  };
}

/**
 * Format quantity with unit
 * @param value - The numeric value
 * @param unit - The unit (shares, stocks, etc.)
 * @returns Formatted quantity string
 * 
 * @example
 * formatQuantity(100, "shares") // "100 shares"
 * formatQuantity(1, "share") // "1 share"
 */
export function formatQuantity(value: number, unit: string): string {
  const pluralUnit = value === 1 ? unit : `${unit}s`;
  return `${formatNumber(value)} ${pluralUnit}`;
}

/**
 * Truncate text with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 * 
 * @example
 * truncateText("Long company name here", 15) // "Long company..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Format market cap in human-readable format
 * @param value - Market cap value
 * @returns Formatted market cap
 * 
 * @example
 * formatMarketCap(1500000000) // "1.50B EGP"
 */
export function formatMarketCap(value: number): string {
  return formatCompact(value, true);
}

/**
 * Calculate and format a percentage from two values
 * @param value - Current value
 * @param total - Total value
 * @param decimals - Decimal places
 * @returns Formatted percentage
 * 
 * @example
 * formatPercentOf(25, 100) // "25.00%"
 */
export function formatPercentOf(
  value: number,
  total: number,
  decimals: number = 2
): string {
  if (total === 0) return '0%';
  const percent = (value / total) * 100;
  return formatPercent(percent, decimals);
}

