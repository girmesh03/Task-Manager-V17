// client/src/redux/features/auth/authApi.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { clearCredentials } from "./authSlice";
import { apiSlice } from "../api";

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
      const response = await axiosInstance.post("/auth/login", credentials);
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
      const response = await axiosInstance.delete("/auth/logout");

      // Clear Redux auth state
      dispatch(clearCredentials());

      // Socket.IO disconnection will be handled automatically by RootLayout
      // useEffect detecting isAuthenticated change

      dispatch(apiSlice.util.resetApiState());

      return response.data;
    } catch (error) {
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
        "/auth/register",
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
      const response = await axiosInstance.post("/auth/forgot-password", email);
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
        "/auth/reset-password",
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
      const response = await axiosInstance.get("/auth/refresh-token");
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
