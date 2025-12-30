/**
 * Parses a YYYY-MM-DD string into a Date object
 */
export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Calculates the number of months between two dates.
 * Can return fractional months for better precision.
 */
export const getMonthDiff = (d1: Date, d2: Date): number => {
  let months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  // Add fractional month based on days
  const daysInMonth = new Date(d2.getFullYear(), d2.getMonth() + 1, 0).getDate();
  months += (d2.getDate() - d1.getDate()) / daysInMonth;
  return months;
};

/**
 * Formats a date string to "MMM YYYY"
 */
export const formatDate = (dateStr: string): string => {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/**
 * Smooth scrolls a container to a specific position
 */
export const smoothScrollTo = (container: HTMLElement, top: number) => {
  container.scrollTo({
    top,
    behavior: 'smooth'
  });
};

/**
 * Calculates a logarithmically-scaled position for timeline items.
 * Compresses older dates while keeping recent items properly spaced.
 * 
 * @param monthsFromTop - Months from the top (most recent date) to this position
 * @param totalMonths - Total months in the timeline
 * @param totalHeight - Total pixel height available
 * @param compressionFactor - Higher values = more compression for older items (default: 0.08)
 * @returns Pixel position from top
 */
export const getLogarithmicPosition = (
  monthsFromTop: number,
  totalMonths: number,
  totalHeight: number,
  compressionFactor: number = 0.12
): number => {
  if (monthsFromTop <= 0) return 0;
  if (monthsFromTop >= totalMonths) return totalHeight;

  // Extra compression for the most recent 24 months (2024-2025)
  // Scale down the first 24 months to be shorter
  const recentThreshold = 24;
  const recentCompressionScale = 0.4; // 40% of normal size for recent items

  let adjustedMonths = monthsFromTop;
  if (monthsFromTop < recentThreshold) {
    // Compress recent items more aggressively
    adjustedMonths = monthsFromTop * recentCompressionScale;
  } else {
    // After threshold, continue from where compressed section ended
    adjustedMonths = (recentThreshold * recentCompressionScale) + (monthsFromTop - recentThreshold);
  }

  // Logarithmic scaling: log(1 + x) provides natural compression
  const logPosition = Math.log(1 + adjustedMonths * compressionFactor);
  const logTotal = Math.log(1 + (totalMonths - recentThreshold * (1 - recentCompressionScale)) * compressionFactor);

  return (logPosition / logTotal) * totalHeight;
};

/**
 * Calculates the logarithmic height for a duration.
 * Uses the difference between start and end positions.
 */
export const getLogarithmicHeight = (
  monthsFromTop: number,
  durationMonths: number,
  totalMonths: number,
  totalHeight: number,
  minHeight: number = 60,
  compressionFactor: number = 0.12
): number => {
  const startPos = getLogarithmicPosition(monthsFromTop, totalMonths, totalHeight, compressionFactor);
  const endPos = getLogarithmicPosition(monthsFromTop + durationMonths, totalMonths, totalHeight, compressionFactor);
  return Math.max(endPos - startPos, minHeight);
};