// backend/app.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";

import corsOptions from "./config/corsOptions.js";
import globalErrorHandler from "./errorHandler/ErrorController.js";
import CustomError from "./errorHandler/CustomError.js";

// Import routes
import routes from "./routes/index.js";

// Initialize express
const app = express();

// Security and performance middleware
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
            },
          }
        : false,
    hsts:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
  })
);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());
app.use(compression());

// Logging in development
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Health check endpoint (before rate limiting)
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Main API routes
app.use("/api", routes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, "../client/dist")));

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

// Catch-all route for undefined endpoints
app.all("*", (req, res, next) => {
  const errorMessage = `Resource not found. The requested URL ${req.originalUrl} was not found on this server.`;
  next(
    CustomError.notFound(errorMessage, {
      requestedUrl: req.originalUrl,
      method: req.method,
      availableRoutes: [
        "/api/auth",
        "/api/organizations",
        "/api/departments",
        "/api/users",
        "/api/tasks",
        "/api/materials",
        "/api/vendors",
        "/api/notifications",
      ],
    })
  );
});

// Global error handler
app.use(globalErrorHandler);

export default app;
