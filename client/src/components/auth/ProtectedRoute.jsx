// client/src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { LoadingFallback } from "../common/MuiLoading.jsx";

/**
 * ProtectedRoute component that restricts access to authenticated users only
 * Compatible with React 19, MUI v7, and React Router v7 data mode
 *
 * Features:
 * - Redirects unauthenticated users to login with return URL preservation
 * - Shows MUI v7 loading state during auth state determination
 * - Uses React Router v7 data mode navigation for redirects
 * - Integrates with existing Redux Toolkit authentication state via useAuth hook
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while authentication status is being determined
  // Using LoadingFallback component for consistent loading UI
  if (isLoading) {
    return <LoadingFallback message="Checking authentication..." />;
  }

  // Redirect unauthenticated users to login with return URL preservation
  // Using React Router v7 data mode Navigate component
  if (!isAuthenticated) {
    // Preserve the intended destination URL for post-login redirect
    // Store current pathname and search params to maintain full URL context
    const returnUrl = `${location.pathname}${location.search}`;

    return <Navigate to="/login" state={{ returnUrl }} replace />;
  }

  // Render protected content for authenticated users
  return children;
};

export default ProtectedRoute;
