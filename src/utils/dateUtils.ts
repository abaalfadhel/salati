/**
 * Date and time utilities for local timezone consistency
 */
import { PrayerRecord } from '../types';

/**
 * Returns YYYY-MM-DD in user's local timezone (preventing UTC midnight drift)
 */
export function getLocalTodayString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate difference in calendar days between two local YYYY-MM-DD strings
 */
export function daysBetween(dateStr1: string, dateStr2: string): number {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const dt1 = new Date(y1, m1 - 1, d1).getTime();
  const dt2 = new Date(y2, m2 - 1, d2).getTime();
  return Math.round(Math.abs(dt2 - dt1) / (1000 * 60 * 60 * 24));
}

/**
 * Calculates current consecutive streak, longest consecutive streak, and total active days
 */
export function calculateStreaks(records: PrayerRecord[], referenceDateStr?: string): {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  recordedDays: string[];
} {
  if (!records || records.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, recordedDays: [] };
  }

  // Extract unique dates and sort ascending
  const uniqueDates = Array.from(new Set(records.map((r) => r.date).filter(Boolean))).sort();

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, recordedDays: [] };
  }

  const totalActiveDays = uniqueDates.length;

  // Calculate longest consecutive streak
  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = uniqueDates[i - 1];
    const curr = uniqueDates[i];
    const diff = daysBetween(prev, curr);

    if (diff === 1) {
      currentRun++;
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
      }
    } else if (diff > 1) {
      currentRun = 1;
    }
  }

  // Calculate current streak relative to reference date (today or latest record)
  const todayStr = referenceDateStr || getLocalTodayString();
  const lastActiveDate = uniqueDates[uniqueDates.length - 1];
  const diffFromToday = daysBetween(lastActiveDate, todayStr);

  let currentStreak = 0;
  // If active today or yesterday, streak is alive
  if (diffFromToday <= 1) {
    currentStreak = 1;
    for (let i = uniqueDates.length - 1; i > 0; i--) {
      const curr = uniqueDates[i];
      const prev = uniqueDates[i - 1];
      if (daysBetween(prev, curr) === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    recordedDays: uniqueDates,
  };
}

/**
 * Computes prayer completions for today, past 7 days (this week), and past 30 days (this month)
 */
export function calculatePeriodCompletions(
  records: PrayerRecord[],
  refDateStr: string = getLocalTodayString()
): {
  today: number;
  week: number;
  month: number;
} {
  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;

  for (const r of records) {
    const diff = daysBetween(r.date, refDateStr);
    if (diff === 0 && r.date === refDateStr) {
      todayCount += r.quantity;
    }
    if (diff <= 6) {
      weekCount += r.quantity;
    }
    if (diff <= 29) {
      monthCount += r.quantity;
    }
  }

  return {
    today: todayCount,
    week: weekCount,
    month: monthCount,
  };
}

/**
 * Human-readable estimated completion duration in Arabic
 */
export function calculateEstimatedTimeRemaining(
  remainingPrayers: number,
  dailyPace: number
): {
  days: number;
  months: number;
  years: number;
  formattedText: string;
} {
  if (remainingPrayers <= 0) {
    return { days: 0, months: 0, years: 0, formattedText: 'تم قضاء كامل الرصيد بحمد الله' };
  }

  if (dailyPace <= 0) {
    return { days: 0, months: 0, years: 0, formattedText: 'حدد هدفاً يومياً لاحتساب المدة' };
  }

  const totalDays = Math.ceil(remainingPrayers / dailyPace);
  const years = Math.floor(totalDays / 365);
  const remainingDaysAfterYears = totalDays % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);
  const days = remainingDaysAfterYears % 30;

  const parts: string[] = [];
  if (years > 0) {
    if (years === 1) parts.push('سنة واحدة');
    else if (years === 2) parts.push('سنتان');
    else if (years >= 3 && years <= 10) parts.push(`${years} سنوات`);
    else parts.push(`${years} سنة`);
  }

  if (months > 0) {
    if (months === 1) parts.push('شهر واحد');
    else if (months === 2) parts.push('شهران');
    else if (months >= 3 && months <= 10) parts.push(`${months} أشهر`);
    else parts.push(`${months} شهراً`);
  }

  if (days > 0 || parts.length === 0) {
    if (days === 1) parts.push('يوم واحد');
    else if (days === 2) parts.push('يومان');
    else if (days >= 3 && days <= 10) parts.push(`${days} أيام`);
    else parts.push(`${days} يوماً`);
  }

  return {
    days,
    months,
    years,
    formattedText: `قرابة ${parts.join(' و ')} (بمعدل ${dailyPace} صلوات يومياً)`,
  };
}

/**
 * Converts Western digits (0-9) to Eastern Arabic numerals (٠-٩)
 */
export function toEasternArabicNumerals(input: string | number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(input).replace(/[0-9]/g, (w) => arabicDigits[Number(w)]);
}

/**
 * Formats a Date or date string to YYYY/MM/DD using Eastern Arabic numerals (e.g. ٢٠٢٦/١٠/٢٣)
 */
export function formatDateToArabicSlash(d: Date | string = new Date()): string {
  let dateObj: Date;
  if (typeof d === 'string') {
    const parts = d.split('-');
    if (parts.length === 3) {
      dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      dateObj = new Date(d);
    }
  } else {
    dateObj = d;
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return toEasternArabicNumerals(`${year}/${month}/${day}`);
}
