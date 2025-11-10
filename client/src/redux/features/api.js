// client/src/redux/features/api.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials } from "./auth/authSlice";
import { handleAuthError, isAuthError } from "../../utils/errorHandler";
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
    console.log("Received 401 - attempting token refresh");

    // Try to refresh the token
    const refreshResult = await baseQuery(
      { url: "/auth/refresh-token", method: "GET" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Token refreshed successfully
      console.log("Token refreshed successfully");
      api.dispatch(setCredentials(refreshResult.data));

      // Retry the original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else if (refreshResult.error) {
      // Refresh failed - check if it's 401 or 403
      if (refreshResult.error.status === 401) {
        // Refresh token also expired - logout user
        console.log("Refresh token expired - logging out");
        handleAuthError(refreshResult.error, "api");
      } else if (refreshResult.error.status === 403) {
        // Forbidden - user doesn't have permission
        console.log("Forbidden - insufficient permissions");
        toast.error("You don't have permission to perform this action");
      } else {
        // Other refresh errors - logout user
        console.log("Token refresh failed - logging out");
        handleAuthError(refreshResult.error, "api");
      }
    }
  }
  // Handle 403 Forbidden - User doesn't have permission
  else if (result.error && result.error.status === 403) {
    console.log("Received 403 - insufficient permissions");
    toast.error("You don't have permission to perform this action");
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
