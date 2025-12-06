/**
 * Allowed origins for CORS configuration
 * Add production frontend URLs when deploying
 */

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:3000", // Fallback for development
  "http://127.0.0.1:3000", // Alternative localhost
];

// Add production URLs if NODE_ENV is production
if (process.env.NODE_ENV === "production") {
  // Add production frontend URLs here when deploying
  // allowedOrigins.push("https://yourdomain.com");
}

export default allowedOrigins;
