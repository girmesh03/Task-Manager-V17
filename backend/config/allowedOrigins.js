/**
 * Allowed Origins Configuration for CORS
 *
 * This file defines all allowed origins for cross-origin requests.
 * Origins are validated against this list for both HTTP and WebSocket connections.
 *
 * Requirements: 4.1-4.10, 19, 160, 191-200
 *
 * Environment Variables:
 * - CLIENT_URL: Primary frontend URL (required in production)
 * - ALLOWED_ORIGINS: Comma-separated list of additional allowed origins
 *
 * Origin Categories:
 * 1. Primary Frontend (CLIENT_URL) - Main application frontend
 * 2. Development Origins - Local development servers
 * 3. Staging Origins - Pre-production testing environments
 * 4. Additional Origins - Custom origins from ALLOWED_ORIGINS env var
 */

/**
 * Development origins for local development
 * These are only included when NODE_ENV is not 'production'
 */
const developmentOrigins = [
  "http://localhost:3000", // React development server (CRA default)
  "http://localhost:5173", // Vite development server (Vite default)
  "http://127.0.0.1:3000", // Alternative localhost
  "http://127.0.0.1:5173", // Alternative localhost for Vite
];

/**
 * Staging origins for pre-production testing
 * Add staging URLs here when deploying to staging environments
 */
const stagingOrigins = [
  // Example: 'https://staging.yourdomain.com'
  // Example: 'https://app-staging.yourdomain.com'
];

/**
 * Production origins
 * These should be explicitly defined, never use wildcards
 */
const productionOrigins = [];

/**
 * Get the primary frontend URL from environment
 * This is the main CLIENT_URL that should always be allowed
 */
const getClientUrl = () => {
  const clientUrl = process.env.CLIENT_URL;
  if (clientUrl) {
    // Remove trailing slash if present for consistency
    return clientUrl.replace(/\/$/, "");
  }
  return null;
};

/**
 * Parse additional origins from ALLOWED_ORIGINS environment variable
 * Format: comma-separated list of URLs
 * Example: "https://app.example.com,https://admin.example.com"
 */
const parseAdditionalOrigins = () => {
  const additionalOrigins = process.env.ALLOWED_ORIGINS;
  if (!additionalOrigins) {
    return [];
  }

  return additionalOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => origin.replace(/\/$/, "")); // Remove trailing slashes
};

/**
 * Validate that no wildcard origins are present in production
 * Wildcards (*) in CORS origins are a security risk
 *
 * @param {string[]} origins - Array of origin URLs to validate
 * @returns {string[]} - Filtered array without wildcards
 */
const validateNoWildcards = (origins) => {
  const isProduction = process.env.NODE_ENV === "production";

  return origins.filter((origin) => {
    if (origin === "*" || origin.includes("*")) {
      if (isProduction) {
        console.error(
          `[CORS Security] Wildcard origin "${origin}" rejected in production mode`
        );
        return false;
      } else {
        console.warn(
          `[CORS Warning] Wildcard origin "${origin}" detected - not recommended even in development`
        );
        return false; // Reject wildcards in all environments for security
      }
    }
    return true;
  });
};

/**
 * Build the complete list of allowed origins based on environment
 *
 * @returns {string[]} - Array of allowed origin URLs
 */
const buildAllowedOrigins = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const isStaging = process.env.NODE_ENV === "staging";
  const isDevelopment =
    process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

  let origins = [];

  // 1. Always include CLIENT_URL if defined (primary frontend)
  const clientUrl = getClientUrl();
  if (clientUrl) {
    origins.push(clientUrl);
  }

  // 2. Add environment-specific origins
  if (isProduction) {
    // Production: Only CLIENT_URL and explicitly defined production origins
    origins = [...origins, ...productionOrigins];
  } else if (isStaging) {
    // Staging: Include staging origins
    origins = [...origins, ...stagingOrigins];
  } else if (isDevelopment) {
    // Development: Include all development origins
    origins = [...origins, ...developmentOrigins];
  }

  // 3. Add any additional origins from ALLOWED_ORIGINS env var
  const additionalOrigins = parseAdditionalOrigins();
  origins = [...origins, ...additionalOrigins];

  // 4. Validate no wildcards (security requirement)
  origins = validateNoWildcards(origins);

  // 5. Remove duplicates
  origins = [...new Set(origins)];

  // 6. Log configuration in non-production for debugging
  if (!isProduction) {
    console.log("[CORS] Allowed origins configured:", origins);
  }

  return origins;
};

/**
 * Exported allowed origins array
 * This is used by corsOptions.js for CORS validation
 */
const allowedOrigins = buildAllowedOrigins();

/**
 * Check if an origin is allowed
 * Useful for manual validation in Socket.IO or other contexts
 *
 * @param {string} origin - Origin URL to check
 * @returns {boolean} - True if origin is allowed
 */
export const isOriginAllowed = (origin) => {
  // Allow requests with no origin (same-origin, server-to-server, mobile apps)
  if (!origin) {
    return true;
  }
  return allowedOrigins.includes(origin);
};

/**
 * Get all allowed origins (for debugging/logging)
 *
 * @returns {string[]} - Copy of allowed origins array
 */
export const getAllowedOrigins = () => [...allowedOrigins];

export default allowedOrigins;
