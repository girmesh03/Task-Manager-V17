// backend/utils/logger.js
/**
 * Structured Logging Configuration using Winston
 *
 * Provides production-ready logging with:
 * - Multiple log levels (error, warn, info, http, debug)
 * - JSON formatting for production (machine-readable)
 * - Pretty formatting for development (human-readable)
 * - Request ID correlation for tracing
 * - Timestamp in ISO format (UTC)
 *
 * Requirements: 6.11, 171, 181
 */

import winston from "winston";

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json, errors } = format;

/**
 * Custom format for development - human-readable
 */
const devFormat = printf(
  ({ level, message, timestamp, requestId, ...meta }) => {
    const reqId = requestId ? `[${requestId}] ` : "";
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${reqId}${message}${metaStr}`;
  }
);

/**
 * Custom format for production - JSON structured logs
 */
const prodFormat = combine(
  timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
  errors({ stack: true }),
  json()
);

/**
 * Determine log level based on environment
 * - Production: 'info' (no debug logs)
 * - Development: 'debug' (all logs)
 * - Test: 'error' (minimal logs)
 */
const getLogLevel = () => {
  const env = process.env.NODE_ENV || "development";
  const levels = {
    production: "info",
    development: "debug",
    test: "error",
  };
  return process.env.LOG_LEVEL || levels[env] || "info";
};

/**
 * Create Winston logger instance
 */
const logger = createLogger({
  level: getLogLevel(),
  defaultMeta: {
    service: process.env.APP_NAME || "task-manager",
  },
  format: combine(
    timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
    errors({ stack: true })
  ),
  transports: [
    // Console transport - always enabled
    new transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? prodFormat
          : combine(colorize(), timestamp({ format: "HH:mm:ss" }), devFormat),
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

/**
 * Add file transport in production for persistent logs
 */
if (process.env.NODE_ENV === "production") {
  // Error logs - separate file for easy monitoring
  logger.add(
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      format: prodFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined logs - all levels
  logger.add(
    new transports.File({
      filename: "logs/combined.log",
      format: prodFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

/**
 * Create a child logger with request context
 * @param {string} requestId - Request ID for correlation
 * @returns {winston.Logger} - Child logger with request context
 */
export const createRequestLogger = (requestId) => {
  return logger.child({ requestId });
};

/**
 * Log levels available:
 * - error: Error conditions (0)
 * - warn: Warning conditions (1)
 * - info: Informational messages (2)
 * - http: HTTP request logs (3)
 * - debug: Debug messages (4)
 */

/**
 * Convenience methods with emoji prefixes for development
 */
export const logStartup = (message, meta = {}) => {
  logger.info(`🚀 ${message}`, meta);
};

export const logDatabase = (message, meta = {}) => {
  logger.info(`💾 ${message}`, meta);
};

export const logSocket = (message, meta = {}) => {
  logger.info(`🔌 ${message}`, meta);
};

export const logEmail = (message, meta = {}) => {
  logger.info(`📧 ${message}`, meta);
};

export const logSecurity = (message, meta = {}) => {
  logger.warn(`🔒 ${message}`, meta);
};

export const logShutdown = (message, meta = {}) => {
  logger.info(`🛑 ${message}`, meta);
};

export const logError = (message, error, meta = {}) => {
  logger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...meta,
  });
};

export default logger;
