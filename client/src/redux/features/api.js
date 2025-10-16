// client/src/redux/features/api.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout, setCredentials } from "./auth/authSlice";

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

  if (result.error && result.error.status === 401) {
    console.log("Received 401 - attempting token refresh");

    // Try to refresh the token
    const refreshResult = await baseQuery(
      { url: "/auth/refresh-token", method: "GET" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Update the user data
      api.dispatch(setCredentials(refreshResult.data));

      // Retry the original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed - logout user
      console.log("Token refresh failed - logging out");
      api.dispatch(logout());
    }
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
    "Material",
    "Vendor",
  ],
  endpoints: () => ({}),
});
