import allowedOrigins, {
  isOriginAllowed,
  getAllowedOrigins,
} from "./allowedOrigins.js";

/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 *
 * This configuration handles CORS for all server communications including:
 * - Regular HTTP/HTTPS API routes
 * - WebSocket connections via Socket.IO
 *
 * Requirements: 4.1-4.10, 19, 160, 191-200
 *
 * Security Considerations:
 * - Credentials enabled for cookie-based JWT authentication
 * - No wildcard origins allowed in production
 * - Origin validation with logging for security monitoring
 * - Preflight caching to reduce OPTIONS requests
 */

/**
 * Preflight cache duration in seconds
 * This reduces the number of OPTIONS preflight requests
 * 24 hours is a reasonable default for production
 */
const PREFLIGHT_CACHE_SECONDS = 86400; // 24 hours

/**
 * Allowed HTTP methods for CORS requests
 * These match the RESTful API operations supported by the backend
 */
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

/**
 * Allowed headers for CORS requests
 * These are the headers that clients can send in requests
 */
const ALLOWED_HEADERS = [
  "Content-Type", // For JSON/form data
  "Authorization", // For Bearer token (if used alongside cookies)
  "X-Requested-With", // For AJAX requests
  "Accept", // Content negotiation
  "Origin", // CORS origin header
  "Cache-Control", // Cache control directives
  "X-Request-ID", // Request tracing
];

/**
 * Exposed headers that clients can access from responses
 * These headers are readable by JavaScript in the browser
 */
const EXPOSED_HEADERS = [
  "X-Request-ID", // Request tracing ID
  "X-RateLimit-Limit", // Rate limit info
  "X-RateLimit-Remaining", // Remaining requests
  "X-RateLimit-Reset", // Rate limit reset time
];

/**
 * Origin validation function with logging
 *
 * @param {string|undefined} origin - The origin of the request
 * @param {function} callback - Callback to allow/deny the request
 */
const validateOrigin = (origin, callback) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Allow requests with no origin (same-origin, server-to-server, mobile apps, Postman)
  if (!origin) {
    if (!isProduction) {
      console.log("[CORS] Request with no origin allowed (same-origin/server)");
    }
    callback(null, true);
    return;
  }

  // Check if origin is in allowed list
  if (isOriginAllowed(origin)) {
    if (!isProduction) {
      console.log(`[CORS] Origin allowed: ${origin}`);
    }
    callback(null, true);
    return;
  }

  // Origin not allowed - log and reject
  const logLevel = isProduction ? "error" : "warn";
  const allowedList = getAllowedOrigins();

  console[logLevel](
    `[CORS] Origin blocked: ${origin}`,
    isProduction
      ? ""
      : `\n  Allowed origins: ${JSON.stringify(allowedList, null, 2)}`
  );

  // Create a proper CORS error
  const error = new Error(`CORS policy: Origin '${origin}' is not allowed`);
  error.status = 403;
  error.code = "CORS_NOT_ALLOWED";

  callback(error, false);
};

/**
 * Unified CORS options configuration
 *
 * Used by both Express CORS middleware and Socket.IO
 */
const corsOptions = {
  /**
   * Origin validation function
   * Validates each request's origin against the allowed list
   */
  origin: validateOrigin,

  /**
   * Enable credentials (cookies, authorization headers)
   * Required for cookie-based JWT authentication
   * Requirement: 4.2 - Enable credentials for cookie-based auth
   */
  credentials: true,

  /**
   * Allowed HTTP methods
   * Requirement: CORS configuration must support all API methods
   */
  methods: ALLOWED_METHODS,

  /**
   * Allowed request headers
   * Requirement: CORS must allow Content-Type and Authorization headers
   */
  allowedHeaders: ALLOWED_HEADERS,

  /**
   * Exposed response headers
   * Headers that JavaScript can access from the response
   */
  exposedHeaders: EXPOSED_HEADERS,

  /**
   * Preflight cache duration (Access-Control-Max-Age)
   * Requirement: 4.3 - Validate preflight caching is appropriate
   * Caches preflight responses to reduce OPTIONS requests
   */
  maxAge: PREFLIGHT_CACHE_SECONDS,

  /**
   * Success status for OPTIONS preflight requests
   * Some legacy browsers (IE11) choke on 204
   */
  optionsSuccessStatus: 200,

  /**
   * Pass the CORS preflight response to the next handler
   * Set to false to terminate preflight handling here
   */
  preflightContinue: false,
};

/**
 * Get CORS options for Socket.IO
 * Socket.IO has slightly different CORS configuration needs
 *
 * @returns {Object} - CORS options for Socket.IO
 */
export const getSocketCorsOptions = () => ({
  origin: validateOrigin,
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ALLOWED_HEADERS,
});

/**
 * VaS configuration on startup
 * Logs warnings for potential misconfigurations
 */
export const validateCorsConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const origins = getAllowedOrigins();

  // Check if any origins are configured
  if (origins.length === 0) {
    console.error(
      "[CORS] WARNING: No allowed origins configured! Set CLIENT_URL or ALLOWED_ORIGINS env var."
    );
    return false;
  }

  // Check for CLIENT_URL in production
  if (isProduction && !process.env.CLIENT_URL) {
    console.error(
      "[CORS] WARNING: CLIENT_URL not set in production! CORS may block frontend requests."
    );
    return false;
  }

  // Check for wildcard origins (should never happen due to validation, but double-check)
  const hasWildcard = origins.some(
    (origin) => origin === "*" || origin.includes("*")
  );
  if (hasWildcard) {
    console.error(
      "[CORS] CRITICAL: Wildcard origin detected! This is a security vulnerability."
    );
    return false;
  }

  // Log configuration summary
  console.log(`[CORS] Configuration validated:`);
  console.log(`  - Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`  - Allowed origins: ${origins.length}`);
  console.log(`  - Credentials: enabled`);
  console.log(`  - Preflight cache: ${PREFLIGHT_CACHE_SECONDS}s`);

  if (!isProduction) {
    console.log(`  - Origins: ${origins.join(", ")}`);
  }

  return true;
};

export default corsOptions;
