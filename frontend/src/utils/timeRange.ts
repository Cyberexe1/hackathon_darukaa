import type { AnalyticsTimeRange } from '../types/dashboard';

/** Filters a chronologically-sorted array of records by a time range,
 * using each record's ISO date string accessed via `getDate`. */
export function filterByTimeRange<T>(records: T[], range: AnalyticsTimeRange, getDate: (record: T) => string): T[] {
  if (range === 'all' || records.length === 0) return records;

  const years = range === '1y' ? 1 : range === '3y' ? 3 : 5;
  const lastDate = new Date(getDate(records[records.length - 1]));
  const cutoff = new Date(lastDate);
  cutoff.setFullYear(cutoff.getFullYear() - years);

  return records.filter((r) => new Date(getDate(r)) >= cutoff);
}
