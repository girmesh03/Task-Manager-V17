// client/src/redux/features/auth/authApi.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { clearCredentials } from "./authSlice";
import { apiSlice } from "../api";
import { API_ENDPOINTS } from "../../../utils/constants";

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      // console.log("thunks response", response.data);
      return response.data;
    } catch (error) {
      // console.log("thunks", error);
      // Return full error object from backend with HTTP status code
      if (error.response?.data) {
        return rejectWithValue({
          ...error.response.data,
          statusCode: error.response.status, // Add HTTP status code
        });
      }
      // Network error fallback
      return rejectWithValue({
        message: error.message || "Login failed",
        errorCode: "NETWORK_ERROR",
        statusCode: 0,
      });
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // Call logout endpoint
      const response = await axiosInstance.delete("/auth/logout");

      // Clear Redux auth state
      dispatch(clearCredentials());

      // Reset API state to clear all cached data
      dispatch(apiSlice.util.resetApiState());

      // Socket.IO disconnection will be handled automatically by AuthProvider
      // useEffect detecting isAuthenticated change

      return response.data;
    } catch (error) {
      // Even if logout API call fails, still clear local state
      console.warn("Logout API call failed, but clearing local state anyway");

      dispatch(clearCredentials());
      dispatch(apiSlice.util.resetApiState());

      // Return full error object from backend with HTTP status code
      if (error.response?.data) {
        return rejectWithValue({
          ...error.response.data,
          statusCode: error.response.status,
        });
      }
      // Network error fallback
      return rejectWithValue({
        message: error.message || "Logout failed",
        errorCode: "NETWORK_ERROR",
        statusCode: 0,
      });
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (organizationData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.AUTH.REGISTER,
        organizationData
      );
      return response.data;
    } catch (error) {
      // Return full error object from backend with HTTP status code
      if (error.response?.data) {
        return rejectWithValue({
          ...error.response.data,
          statusCode: error.response.status,
        });
      }
      // Network error fallback
      return rejectWithValue({
        message: error.message || "Registration failed",
        errorCode: "NETWORK_ERROR",
        statusCode: 0,
      });
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        email
      );
      return response.data;
    } catch (error) {
      // Return full error object from backend with HTTP status code
      if (error.response?.data) {
        return rejectWithValue({
          ...error.response.data,
          statusCode: error.response.status,
        });
      }
      // Network error fallback
      return rejectWithValue({
        message: error.message || "Password reset request failed",
        errorCode: "NETWORK_ERROR",
        statusCode: 0,
      });
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (resetData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        resetData
      );
      return response.data;
    } catch (error) {
      // Return full error object from backend with HTTP status code
      if (error.response?.data) {
        return rejectWithValue({
          ...error.response.data,
          statusCode: error.response.status,
        });
      }
      // Network error fallback
      return rejectWithValue({
        message: error.message || "Password reset failed",
        errorCode: "NETWORK_ERROR",
        statusCode: 0,
      });
    }
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.AUTH.REFRESH_TOKEN
      );
      return response.data;
    } catch (error) {
      // If refresh fails, logout user
      dispatch(apiSlice.util.resetApiState());
      dispatch(clearCredentials());
      // Return full error object from backend with HTTP status code
      if (error.response?.data) {
        return rejectWithValue({
          ...error.response.data,
          statusCode: error.response.status,
        });
      }
      // Network error fallback
      return rejectWithValue({
        message: error.message || "Token refresh failed",
        errorCode: "NETWORK_ERROR",
        statusCode: 0,
      });
    }
  }
);

export default axiosInstance;
