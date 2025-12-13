// client/src/utils/dateUtils.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

/**
 * Get the user's timezone
 * @returns {string} User's timezone (e.g., 'America/New_York')
 */
export const getUserTimezone = () => {
  return dayjs.tz.guess();
};

/**
 * Convert UTC date to user's local timezone
 * @param {string|Date} utcDate - UTC date string or Date object
 * @returns {dayjs.Dayjs} Dayjs object in user's local timezone
 */
export const utcToLocal = (utcDate) => {
  if (!utcDate) return null;
  return dayjs.utc(utcDate).tz(getUserTimezone());
};

/**
 * Convert local date to UTC ISO string for API
 * @param {string|Date|dayjs.Dayjs} localDate - Local date
 * @returns {string} UTC ISO string
 */
export const localToUtc = (localDate) => {
  if (!localDate) return null;
  return dayjs(localDate).utc().toISOString();
};

/**
 * Format date for display (converts UTC to local)
 * @param {string|Date} date - Date to format
 * @param {string} format - Dayjs format string (default: 'MMM DD, YYYY')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = "MMM DD, YYYY") => {
  if (!date) return "";
  return utcToLocal(date).format(format);
};

/**
 * Format date and time for display (converts UTC to local)
 * @param {string|Date} date - Date to format
 * @param {string} format - Dayjs format string (default: 'MMM DD, YYYY HH:mm')
 * @returns {string} Formatted date-time string
 */
export const formatDateTime = (date, format = "MMM DD, YYYY HH:mm") => {
  if (!date) return "";
  return utcToLocal(date).format(format);
};

/**
 * Format date as relative time (e.g., '2 hours ago')
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return "";
  return utcToLocal(date).fromNow();
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPast = (date) => {
  if (!date) return false;
  return utcToLocal(date).isBefore(dayjs());
};

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  return utcToLocal(date).isSame(dayjs(), "day");
};

/**
 * Get start of day in UTC
 * @param {string|Date} date - Date
 * @returns {string} UTC ISO string for start of day
 */
export const getStartOfDay = (date) => {
  return dayjs(date).startOf("day").utc().toISOString();
};

/**
 * Get end of day in UTC
 * @param {string|Date} date - Date
 * @returns {string} UTC ISO string for end of day
 */
export const getEndOfDay = (date) => {
  return dayjs(date).endOf("day").utc().toISOString();
};
