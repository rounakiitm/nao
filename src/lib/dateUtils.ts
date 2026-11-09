import { ImportantEvent } from '../types';

/**
 * Returns whether a given year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Calculate the next occurrence date for an event relative to "now".
 */
export function getNextOccurrence(event: ImportantEvent, now: Date = new Date()): {
  nextDate: Date;
  daysRemaining: number;
  yearsCount: number | null; // e.g. age turning or anniversary year
  isToday: boolean;
  isTomorrow: boolean;
} {
  const [yearStr, monthStr, dayStr] = event.date.split('-');
  const origYear = parseInt(yearStr, 10);
  const origMonth = parseInt(monthStr, 10) - 1; // 0-indexed
  const origDay = parseInt(dayStr, 10);

  // Normalize "now" to midnight local time for fair day comparisons
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  if (event.recurrence === 'none') {
    // One-time event
    const eventDate = new Date(origYear, origMonth, origDay, 0, 0, 0, 0);
    const diffTime = eventDate.getTime() - todayMidnight.getTime();
    const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      nextDate: eventDate,
      daysRemaining,
      yearsCount: null,
      isToday: daysRemaining === 0,
      isTomorrow: daysRemaining === 1,
    };
  }

  // Yearly recurrence
  const currentYear = todayMidnight.getFullYear();

  // Helper to adjust Feb 29 on non-leap years to Feb 28
  const getAdjustedDay = (year: number, month: number, day: number) => {
    if (month === 1 && day === 29 && !isLeapYear(year)) {
      return 28;
    }
    return day;
  };

  // Try occurrence this year
  const thisYearDay = getAdjustedDay(currentYear, origMonth, origDay);
  let candidateDate = new Date(currentYear, origMonth, thisYearDay, 0, 0, 0, 0);

  // If candidate is before today, move to next year
  if (candidateDate.getTime() < todayMidnight.getTime()) {
    const nextYear = currentYear + 1;
    const nextYearDay = getAdjustedDay(nextYear, origMonth, origDay);
    candidateDate = new Date(nextYear, origMonth, nextYearDay, 0, 0, 0, 0);
  }

  const diffTime = candidateDate.getTime() - todayMidnight.getTime();
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Compute years passed if year is known
  let yearsCount: number | null = null;
  if (event.year_known && origYear > 0) {
    yearsCount = candidateDate.getFullYear() - origYear;
  }

  return {
    nextDate: candidateDate,
    daysRemaining,
    yearsCount,
    isToday: daysRemaining === 0,
    isTomorrow: daysRemaining === 1,
  };
}

/**
 * Format milestone label (e.g., "Turning 26", "5th Anniversary", etc.)
 */
export function getMilestoneLabel(event: ImportantEvent, yearsCount: number | null): string | null {
  if (yearsCount === null || yearsCount <= 0) return null;

  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  switch (event.category) {
    case 'Birthday':
      return `Turns ${yearsCount}`;
    case 'Anniversary':
    case 'Relationship':
      return `${getOrdinal(yearsCount)} Anniversary`;
    case 'Memorial':
      return `${yearsCount} year${yearsCount > 1 ? 's' : ''} in memory`;
    case 'Milestone':
      return `${yearsCount} year${yearsCount > 1 ? 's' : ''} milestone`;
    default:
      return `${yearsCount} year${yearsCount > 1 ? 's' : ''}`;
  }
}

/**
 * Format date nicely for display (e.g. "Oct 24", "May 14, 1998")
 */
export function formatDisplayDate(dateStr: string, yearKnown: boolean): string {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (yearKnown && year > 0) {
    return `${monthNames[month]} ${day}, ${year}`;
  }
  return `${monthNames[month]} ${day}`;
}

export function formatShortMonthDay(date: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

