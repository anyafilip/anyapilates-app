/**
 * Shared booking window constraints (used by both frontend and backend)
 */

export const BOOKING_CUTOFF_HOURS = 12
export const MAX_BOOKING_ADVANCE_DAYS = 14

export const BOOKING_CUTOFF_MS = BOOKING_CUTOFF_HOURS * 60 * 60 * 1000
export const MAX_BOOKING_ADVANCE_MS = MAX_BOOKING_ADVANCE_DAYS * 24 * 60 * 60 * 1000

/**
 * Returns true if the class start time is within the 12-hour cutoff (or already in the past).
 */
export function isPastCutoff(classDate: Date | string | number): boolean {
  const time = new Date(classDate).getTime()
  return Date.now() + BOOKING_CUTOFF_MS > time
}

/**
 * Returns true if the class date is further than 14 days (2 weeks) in advance.
 */
export function isTooFarInAdvance(classDate: Date | string | number): boolean {
  const time = new Date(classDate).getTime()
  return time > Date.now() + MAX_BOOKING_ADVANCE_MS
}
