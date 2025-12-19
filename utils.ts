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