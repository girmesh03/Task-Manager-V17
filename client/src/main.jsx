// client/src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/app/store";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import App from "./App.jsx";

// Validate required environment variables
const validateEnvironment = () => {
  const required = ["VITE_API_URL", "VITE_PLATFORM_ORG"];
  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    throw new Error(
      `Configuration error: Missing environment variables. Please check your .env file.`
    );
  }
};

// Validate environment before rendering
try {
  validateEnvironment();
} catch (error) {
  document.getElementById("root").innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="max-width: 500px; text-align: center;">
        <h1 style="color: #d32f2f; margin-bottom: 16px;">Configuration Error</h1>
        <p style="color: #666; margin-bottom: 24px;">${error.message}</p>
        <p style="color: #999; font-size: 14px;">Please contact your system administrator.</p>
      </div>
    </div>
  `;
  throw error;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);
