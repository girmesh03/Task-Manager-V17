// client/src/redux/features/api.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, clearCredentials } from "./auth/authSlice";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL;

// Base query with credentials for httpOnly cookies
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// Enhanced base query that handles 401 by refreshing token
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 Unauthorized - Token expired, try to refresh
  if (result.error && result.error.status === 401) {
    console.log("🔄 Received 401 - attempting token refresh");

    // Try to refresh the token
    const refreshResult = await baseQuery(
      { url: "/auth/refresh-token", method: "GET" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Token refreshed successfully
      console.log("✅ Token refreshed successfully");
      api.dispatch(setCredentials(refreshResult.data));

      // Retry the original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else if (refreshResult.error) {
      // Refresh failed - handle based on error status
      const refreshStatus = refreshResult.error.status;

      console.error(
        "❌ Token refresh failed:",
        refreshStatus,
        refreshResult.error
      );

      if (refreshStatus === 401 || refreshStatus === 403) {
        // Refresh token expired or forbidden - logout user
        console.log("🚪 Refresh token expired/forbidden - logging out");

        // Clear credentials
        api.dispatch(clearCredentials());

        // Reset API state to clear all cached data
        api.dispatch({ type: "api/resetApiState" });

        // Show user-friendly message
        toast.error("Your session has expired. Please log in again.", {
          toastId: "session-expired",
          autoClose: 3000,
        });

        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      } else {
        // Other refresh errors (network, server error, etc.)
        console.error("⚠️ Unexpected refresh error - logging out");

        // Clear credentials
        api.dispatch(clearCredentials());

        // Reset API state
        api.dispatch({ type: "api/resetApiState" });

        // Show error message
        toast.error("Authentication failed. Please log in again.", {
          toastId: "auth-failed",
          autoClose: 3000,
        });

        // Redirect to login
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      }
    }
  }
  // Handle 403 Forbidden - User doesn't have permission (but is authenticated)
  else if (result.error && result.error.status === 403) {
    console.warn("⛔ Received 403 - insufficient permissions");
    // Don't logout for 403, just show error
    // The error will be handled by the component
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Organization",
    "Department",
    "User",
    "Task",
    "TaskActivity",
    "TaskComment",
    "Material",
    "Vendor",
    "Notification",
    "Attachment",
  ],
  endpoints: () => ({}),
});
