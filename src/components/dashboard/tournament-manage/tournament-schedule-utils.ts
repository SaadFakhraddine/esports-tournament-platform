/** Next quarter-hour from `reference` (for a sensible default pick time). */
export function defaultMatchScheduleTime(reference: Date) {
  const quarterMs = 15 * 60 * 1000
  return new Date(Math.ceil(reference.getTime() / quarterMs) * quarterMs)
}
