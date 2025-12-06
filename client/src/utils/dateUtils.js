/**
 * Date Utility Functions for Timezone Management
 *
 * Core Principle: Store UTC, Display Local
 * - All dates stored in database as UTC
 * - Dates displayed to users in their local timezone
 * - Transparent conversion at API boundaries
 */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Extend dayjs with required plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

/**
 * Get user's timezone
 * @returns {string} Timezone string (e.g., "America/New_York", "Africa/Addis_Ababa")
 */
export const getUserTimezone = () => {
  return dayjs.tz.guess();
};

/**
 * Convert UTC date to user's local timezone
 * @param {string|Date} utcDate - UTC date (ISO string or Date object)
 * @returns {dayjs.Dayjs} Dayjs object in local timezone
 */
export const utcToLocal = (utcDate) => {
  if (!utcDate) return null;

  // Parse as UTC and convert to local timezone
  return dayjs.utc(utcDate).tz(getUserTimezone());
};

/**
 * Convert local date to UTC
 * @param {string|Date} localDate - Local date (ISO string or Date object)
 * @returns {dayjs.Dayjs} Dayjs object in UTC
 */
export const localToUtc = (localDate) => {
  if (!localDate) return null;

  // Parse in local timezone and convert to UTC
  return dayjs(localDate).utc();
};

/**
 * Format date for display in UI (user's local timezone)
 * @param {string|Date} date - Date to format
 * @param {string} format - Format string (default: "MMM D, YYYY h:mm A")
 * @returns {string} Formatted date string
 */
export const formatForDisplay = (date, format = "MMM D, YYYY h:mm A") => {
  if (!date) return "";

  return utcToLocal(date).format(format);
};

/**
 * Format date for API requests (UTC ISO string)
 * @param {string|Date} date - Date to format
 * @returns {string} ISO UTC string
 */
export const formatForApi = (date) => {
  if (!date) return null;

  return localToUtc(date).toISOString();
};

/**
 * Format date relative to now (e.g., "2 hours ago", "in 3 days")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelative = (date) => {
  if (!date) return "";

  return utcToLocal(date).fromNow();
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean}
 */
export const isPast = (date) => {
  if (!date) return false;

  return utcToLocal(date).isBefore(dayjs());
};

/**
 * Check if date is in the future
 * @param {string|Date} date - Date to check
 * @returns {boolean}
 */
export const isFuture = (date) => {
  if (!date) return false;

  return utcToLocal(date).isAfter(dayjs());
};

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean}
 */
export const isToday = (date) => {
  if (!date) return false;

  return utcToLocal(date).isSame(dayjs(), "day");
};

/**
 * Get start of day in UTC
 * @param {string|Date} date - Date
 * @returns {string} ISO UTC string
 */
export const getStartOfDayUTC = (date) => {
  if (!date) return null;

  return dayjs(date).startOf("day").utc().toISOString();
};

/**
 * Get end of day in UTC
* @param {string|Date} date - Date
 * @returns {string} ISO UTC string
 */
export const getEndOfDayUTC = (date) => {
  if (!date) return null;

  return dayjs(date).endOf("day").utc().toISOString();
};

/**
 * Calculate duration between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @param {string} unit - Unit of measurement (days, hours, minutes, etc.)
 * @returns {number} Duration in specified unit
 */
export const getDuration = (startDate, endDate, unit = "days") => {
  if (!startDate || !endDate) return 0;

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  return end.diff(start, unit);
};

/**
 * Add time to date
 * @param {string|Date} date - Date
 * @param {number} amount - Amount to add
 * @param {string} unit - Unit (days, hours, minutes, etc.)
 * @returns {dayjs.Dayjs} New date
 */
export const addTime = (date, amount, unit = "days") => {
  if (!date) return null;

  return dayjs(date).add(amount, unit);
};

/**
 * Subtract time from date
 * @param {string|Date} date - Date
 * @param {number} amount - Amount to subtract
 * @param {string} unit - Unit (days, hours, minutes, etc.)
 * @returns {dayjs.Dayjs} New date
 */
export const subtractTime = (date, amount, unit = "days") => {
  if (!date) return null;

  return dayjs(date).subtract(amount, unit);
};

/**
 * Format date for DateTimePicker component (local timezone)
 * @param {string|Date} date - UTC date from API
 * @returns {dayjs.Dayjs|null} Dayjs object in local timezone
 */
export const formatForDatePicker = (date) => {
  if (!date) return null;

  return utcToLocal(date);
};

/**
 * Format DateTimePicker value for API (UTC)
 * @param {dayjs.Dayjs|Date|string} date - Date from DateTimePicker
 * @returns {string|null} ISO UTC string
 */
export const formatDatePickerForApi = (date) => {
  if (!date) return null;

  return formatForApi(date);
};

/**
 * Validate date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {boolean} True if start is before end
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true;

  return dayjs(startDate).isBefore(dayjs(endDate));
};

/**
 * Get current date/time in UTC
 * @returns {string} ISO UTC string
 */
export const getCurrentUTC = () => {
  return dayjs().utc().toISOString();
};

/**
 * Get current date/time in local timezone
 * @returns {dayjs.Dayjs} Dayjs object in local timezone
 */
export const getCurrentLocal = () => {
  return dayjs();
};

/**
 * Format date for calendar display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (YYYY-MM-DD)
 */
export const formatForCalendar = (date) => {
  if (!date) return "";

  return utcToLocal(date).format("YYYY-MM-DD");
};

/**
 * Format time only (no date)
 * @param {string|Date} date - Date to format
 * @param {boolean} use24Hour - Use 24-hour format (default: false)
 * @returns {string} Formatted time
 */
export const formatTimeOnly = (date, use24Hour = false) => {
  if (!date) return "";

  const format = use24Hour ? "HH:mm" : "h:mm A";
  return utcToLocal(date).format(format);
};

/**
 * Format date only (no time)
 * @param {string|Date} date - Date to format
 * @param {string} format - Format string (default: "MMM D, YYYY")
 * @returns {string} Formatted date
 */
export const formatDateOnly = (date, format = "MMM D, YYYY") => {
  if (!date) return "";

  return utcToLocal(date).format(format);
};

/**
 * Check if date is valid
 * @param {string|Date} date - Date to check
 * @returns {boolean}
 */
export const isValidDate = (date) => {
  return dayjs(date).isValid();
};

/**
 * Parse date string with format
 * @param {string} dateString - Date string
 * @param {string} format - Format to parse
 * @returns {dayjs.Dayjs|null} Parsed date or null
 */
export const parseDate = (dateString, format) => {
  if (!dateString) return null;

  const parsed = dayjs(dateString, format);
  return parsed.isValid() ? parsed : null;
};

// Export all utility functions
export default {
  getUserTimezone,
  utcToLocal,
  localToUtc,
  formatForDisplay,
  formatForApi,
  formatRelative,
  isPast,
  isFuture,
  isToday,
  getStartOfDayUTC,
  getEndOfDayUTC,
  getDuration,
  addTime,
  subtractTime,
  formatForDatePicker,
  formatDatePickerForApi,
  isValidDateRange,
  getCurrentUTC,
  getCurrentLocal,
  formatForCalendar,
  formatTimeOnly,
  formatDateOnly,
  isValidDate,
  parseDate,
};
