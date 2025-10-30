import allowedOrigins from "./allowedOrigins.js";
import CustomError from "../errorHandler/CustomError.js";

/**
 * Unified CORS options configuration for both Express routes and Socket.IO
 *
 * This configuration handles CORS for all server communications including:
 * - Regular HTTP/HTTPS API routes
 * - WebSocket connections via Socket.IO
 */
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      console.warn(`CORS violation attempt blocked from origin: ${origin}`);
      callback(
        CustomError.authorization("Not allowed by CORS", {
          origin,
          allowedOrigins,
        })
      );
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 200,
};

export default corsOptions;
