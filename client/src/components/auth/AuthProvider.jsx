// client/src/components/auth/AuthProvider.jsx
import { useEffect } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../hooks/useAuth";
import { socketService } from "../../services/socketService";

/**
 * AuthProvider Component
 *
 * Centralized authentication initialization for both user and socket.
 * Ensures user authentication and socket connection are synchronized.
 *
 * Flow:
 * 1. User authenticates (login) -> Redux state updated
 * 2. AuthProvider detects isAuthenticated = true
 * 3. Socket connects with httpOnly cookies
 * 4. User can access protected routes and receive real-time updates
 *
 * On logout or auth error:
 * 1. Redux state cleared
 * 2. AuthProvider detects isAuthenticated = false
 * 3. Socket disconnects
 * 4. User redirected to login
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element}
 */
const AuthProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Connect socket when user is authenticated
    if (isAuthenticated && user && !socketService.isConnected) {
      console.log("User authenticated, connecting socket...");
      socketService.connect();
    }

    // Disconnect socket when user is not authenticated
    if (!isAuthenticated && socketService.isConnected) {
      console.log("User not authenticated, disconnecting socket...");
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount, only when user logs out
      // This allows socket to persist across component remounts
    };
  }, [isAuthenticated, user]);

  // Log authentication status changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("✅ Authentication Status: Authenticated");
      console.log("👤 User:", user.fullName, `(${user.role})`);
      console.log(
        "🔌 Socket Status:",
        socketService.isConnected ? "Connected" : "Disconnected"
      );
    } else {
      console.log("❌ Authentication Status: Not Authenticated");
      console.log(
        "🔌 Socket Status:",
        socketService.isConnected ? "Connected" : "Disconnected"
      );
    }
  }, [isAuthenticated, user]);

  return children;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
