// client/src/hooks/useAuth.js
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from "../redux/features/auth/authSlice";
import {
  loginUser,
  logoutUser,
  registerUser,
  forgotPassword,
  resetPassword,
} from "../redux/features/auth/authApi";

/**
 * Custom hook for authentication state and utilities
 * Provides authentication state, actions, role utilities, and route protection
 * Compatible with React 19 and integrates with existing Redux Toolkit auth system
 */
export const useAuth = () => {
  const dispatch = useDispatch();

  // Authentication state from Redux using existing selectors
  // Using React Redux v9.2.0 useSelector hook with existing Redux Toolkit selectors
  // This ensures compatibility with existing Redux persist configuration
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  // Role and organization utilities calculated from existing user data
  // All calculations are derived from existing user data without additional state
  const isPlatformOrg =
    user?.organization?._id === import.meta.env.VITE_PLATFORM_ORG;
  const isPlatformUser =
    user?.organization?._id === import.meta.env.VITE_PLATFORM_ORG;

  // Role-based utilities
  const isSuperAdmin = user?.role === "SuperAdmin";
  const isAdmin = user?.role === "Admin";
  const isHod = user?.role === "SuperAdmin" || user?.role === "Admin"; // Head of Department
  const isMember = user?.role === "User";
  // Route protection utilities that integrate with existing Redux state changes
  const requireAuth = () => {
    return isAuthenticated && !isLoading;
  };

  const requireGuest = () => {
    return !isAuthenticated && !isLoading;
  };

  return {
    // Authentication state
    user,
    isAuthenticated,
    isLoading,
    error,

    // Authentication actions (using existing Redux Toolkit actions)
    // These return the dispatch result so components can use .unwrap() and handle promises
    login: (credentials) => dispatch(loginUser(credentials)),
    logout: () => dispatch(logoutUser()),
    register: (data) => dispatch(registerUser(data)),
    forgotPassword: (email) => dispatch(forgotPassword(email)),
    resetPassword: (resetData) => dispatch(resetPassword(resetData)),

    // Role and organization utilities
    isPlatformOrg,
    isPlatformUser,
    isHod,
    isAdmin,
    isSuperAdmin,
    isMember,

    // Route protection utilities
    requireAuth,
    requireGuest,
  };
};
