// Read allowed origins from environment variable or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [
      "http://localhost:3000", // React development server
      "http://localhost:5173", // Vite development server
    ];

export default allowedOrigins;
