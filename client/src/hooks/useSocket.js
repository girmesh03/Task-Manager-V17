// client/src/hooks/useSocket.js
import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { socketService } from "../services/socketService";

/**
 * useSocket Hook
 * 
 * Custom React hook for managing Socket.IO connection lifecycle.
 * Automatically connects when user is authenticated and disconnects when logged out.
 * 
 * Usage:
 * ```javascript
 * import { useSocket } from './hooks/useSocket';
 * 
 * function MyComponent() {
 *   const socket = useSocket();
 *   
 *   // Socket is automatically managed based on auth state
 *   // You can access socketService methods if needed
 *   
 *   return <div>...</div>;
 * }
 * ```
 * 
 * @returns {Object} Socket service instance
 */
export const useSocket = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Connect when authenticated
    if (isAuthenticated && !socketService.isConnected) {
      console.log("User authenticated, connecting socket...");
      socketService.connect();
    }

    // Disconnect when not authenticated
    if (!isAuthenticated && socketService.isConnected) {
      console.log("User not authenticated, disconnecting socket...");
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount, only when user logs out
      // This allows socket to persist across component remounts
    };
  }, [isAuthenticated]);

  return socketService;
};

/**
 * useSocketEvent Hook
 * 
 * Custom React hook for listening to specific Socket.IO events.
 * Automatically handles cleanup when component unmounts.
 * 
 * Usage:
 * ```javascript
 * import { useSocketEvent } from './hooks/useSocket';
 * 
 * function MyComponent() {
 *   useSocketEvent('task:created', (data) => {
 *     console.log('Task created:', data);
 *   });
 *   
 *   return <div>...</div>;
 * }
 * ```
 * 
 * @param {string} event - Event name to listen to
 * @param {Function} handler - Event handler function
 * @param {Array} [deps=[]] - Dependencies array for handler
 */
export const useSocketEvent = (event, handler, deps = []) => {
  useEffect(() => {
    if (!event || !handler) return;

    // Add event listener
    socketService.on(event, handler);

    // Cleanup: remove event listener
    return () => {
      socketService.off(event, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
};

/**
 * useSocketEmit Hook
 * 
 * Custom React hook that returns a function to emit Socket.IO events.
 * 
 * Usage:
 * ```javascript
 * import { useSocketEmit } from './hooks/useSocket';
 * 
 * function MyComponent() {
 *   const emit = useSocketEmit();
 *   
 *   const handleClick = () => {
 *     emit('custom:event', { data: 'value' });
 *   };
 *   
 *   return <button onClick={handleClick}>Emit Event</button>;
 * }
 * ```
 * 
 * @returns {Function} Emit function
 */
export const useSocketEmit = () => {
  return (event, data, callback) => {
    socketService.emit(event, data, callback);
  };
};

/**
 * useSocketStatus Hook
 * 
 * Custom React hook that returns the current socket connection status.
 * 
 * Usage:
 * ```javascript
 * import { useSocketStatus } from './hooks/useSocket';
 * 
 * function MyComponent() {
 *   const isConnected = useSocketStatus();
 *   
 *   return (
 *     <div>
 *       Socket status: {isConnected ? 'Connected' : 'Disconnected'}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {boolean} Connection status
 */
export const useSocketStatus = () => {
  return socketService.getConnectionStatus();
};
