// client/src/components/auth/PublicRoute.jsx
import { Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { LoadingFallback } from "../common/MuiLoading.jsx";

/**
 * PublicRoute component that restricts access to unauthenticated users only
 * Compatible with React 19, MUI v7, and React Router v7 data mode
 *
 * Features:
 * - Redirects authenticated users to dashboard
 * - Shows MUI v7 loading state during auth state determination
 * - Uses React Router v7 data mode navigation for redirects
 * - Integrates with existing Redux Toolkit authentication state via useAuth hook
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while authentication status is being determined
  // Using LoadingFallback component for consistent loading UI
  if (isLoading) {
    return <LoadingFallback message="Checking authentication..." />;
  }

  // Redirect authenticated users to dashboard
  // Using React Router v7 data mode Navigate component
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render public content for unauthenticated users
  return children;
};

export default PublicRoute;
