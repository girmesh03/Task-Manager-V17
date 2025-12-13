// client/src/services/socketService.js
import { io } from "socket.io-client";
import { handleAuthError, isAuthError } from "../utils/errorHandler";
import { SOCKET_CONFIG, SOCKET_EVENTS, ENV } from "../utils/constants";
import { handleSocketEvents } from "./socketEvents";

/**
 * Socket.IO Service
 *
 * Centralized Socket.IO client service for real-time communication.
 * Handles connection, authentication, reconnection, and event management.
 *
 * Features:
 * - Authentication with httpOnly cookies
 * - Automatic reconnection with exponential backoff
 * - Centralized error handling
 * - Event listener management
 * - Room management (user, department, organization)
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = SOCKET_CONFIG.RECONNECTION_ATTEMPTS;
  }

  /**
   * Connect to Socket.IO server
   */
  connect() {
    // Prevent multiple connections
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    // Get base URL (remove /api from API_URL)
    const socketUrl = ENV.API_URL.replace("/api", "");

    console.log("Connecting to Socket.IO server:", socketUrl);

    // Create socket instance
    this.socket = io(socketUrl, {
      withCredentials: SOCKET_CONFIG.WITH_CREDENTIALS,
      autoConnect: SOCKET_CONFIG.AUTO_CONNECT,
      reconnection: SOCKET_CONFIG.RECONNECTION,
      reconnectionDelay: SOCKET_CONFIG.RECONNECTION_DELAY,
      reconnectionDelayMax: SOCKET_CONFIG.RECONNECTION_DELAY_MAX,
      reconnectionAttempts: SOCKET_CONFIG.RECONNECTION_ATTEMPTS,
      transports: ["websocket", "polling"], // Try websocket first, fallback to polling
    });

    // Setup event listeners
    this.setupEventListeners();

    // Connect
    this.socket.connect();
  }

  /**
   * Setup Socket.IO event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on(SOCKET_EVENTS.CONNECTED, this.handleConnect);
    this.socket.on("connect", this.handleConnect);
    this.socket.on("disconnect", this.handleDisconnect);
    this.socket.on("connect_error", this.handleConnectError);
    this.socket.on(SOCKET_EVENTS.ERROR, this.handleError);
    this.socket.on(SOCKET_EVENTS.RECONNECT, this.handleReconnect);
    this.socket.on(SOCKET_EVENTS.SERVER_SHUTDOWN, this.handleServerShutdown);

    // Setup application-specific event handlers
    handleSocketEvents(this.socket);
  }

  /**
   * Handle successful connection
   */
  handleConnect = () => {
    console.log("Socket connected:", this.socket.id);
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // Emit any pending events or perform post-connection tasks
    // Example: Join rooms, sync state, etc.
  };

  /**
   * Handle disconnection
   */
  handleDisconnect = (reason) => {
    console.log("Socket disconnected:", reason);
    this.isConnected = false;

    // Handle different disconnect reasons
    if (reason === "io server disconnect") {
      // Server initiated disconnect, try to reconnect
      console.log("Server disconnected, attempting to reconnect...");
      this.socket.connect();
    } else if (reason === "io client disconnect") {
      // Client initiated disconnect, don't reconnect
      console.log("Client disconnected");
    } else {
      // Other reasons (network issues, etc.)
      console.log("Disconnected due to:", reason);
    }
  };

  /**
   * Handle connection error
   */
  handleConnectError = (error) => {
    console.error("Socket connection error:", error);

    // Check if it's an authentication error
    if (isAuthError(error)) {
      console.error("Authentication error detected");
      handleAuthError(error, "socket");
      return;
    }

    // Increment reconnect attempts
    this.reconnectAttempts++;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      this.disconnect();
    }
  };

  /**
   * Handle general errors
   */
  handleError = (error) => {
    console.error("Socket error:", error);

    // Check if it's an authentication error
    if (isAuthError(error)) {
      handleAuthError(error, "socket");
    }
  };

  /**
   * Handle successful reconnection
   */
  handleReconnect = (attemptNumber) => {
    console.log("Socket reconnected after", attemptNumber, "attempts");
    this.reconnectAttempts = 0;
  };

  /**
   * Handle server shutdown
   */
  handleServerShutdown = (data) => {
    console.warn("Server is shutting down:", data);
    this.disconnect();
  };

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      console.log("Disconnecting socket...");
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Emit event to server
   *
   * @param {string} event - Event name
   * @param {*} data - Data to send
   * @param {Function} [callback] - Optional callback
   */
  emit(event, data, callback) {
    if (this.socket?.connected) {
      this.socket.emit(event, data, callback);
    } else {
      console.warn("Socket not connected, cannot emit event:", event);
    }
  }

  /**
   * Listen to event from server
   *
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  /**
   * Remove event listener
   *
   * @param {string} event - Event name
   * @param {Function} [handler] - Event handler (optional)
   */
  off(event, handler) {
    if (this.socket) {
      if (handler) {
        this.socket.off(event, handler);
      } else {
        this.socket.off(event);
      }
    }
  }

  /**
   * Get connection status
   *
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected && this.socket?.connected;
  }

  /**
   * Get socket ID
   *
   * @returns {string|null} Socket ID
   */
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Export singleton instance
export const socketService = new SocketService();
