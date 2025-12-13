// backend/utils/socket.js
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { Server as SocketIOServer } from "socket.io";
import checkUserStatus from "./userStatus.js";
import CustomError from "../errorHandler/CustomError.js";

// Track active connections for graceful cleanup
const activeConnections = new Map();

const extractToken = (cookieHeader) => {
  if (!cookieHeader) return null;
  const tokenCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("access_token="));
  return tokenCookie ? tokenCookie.split("=")[1].trim() : null;
};

const extractRefreshToken = (cookieHeader) => {
  if (!cookieHeader) return null;
  const tokenCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("refresh_token="));
  return tokenCookie ? tokenCookie.split("=")[1].trim() : null;
};

// Enhanced socket authentication with token refresh capability
const socketAuth = async (socket, next) => {
  try {
    let token = extractToken(socket.handshake.headers.cookie);
    const refreshToken = extractRefreshToken(socket.handshake.headers.cookie);

    if (!token && !refreshToken) {
      return next(
        CustomError.authentication("Authentication required", {
          reason: "No tokens provided",
        })
      );
    }

    let user = null;
    let decoded = null;

    // Try access token first
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      } catch (accessTokenError) {
        if (accessTokenError.name === "TokenExpiredError" && refreshToken) {
          // Access token expired, try to refresh
          try {
            const refreshDecoded = jwt.verify(
              refreshToken,
              process.env.JWT_REFRESH_SECRET
            );

            // Fetch user and check status
            user = await User.findById(refreshDecoded.userId)
              .populate({ path: "organization", select: "name isDeleted" })
              .populate({
                path: "department",
                select: "name organization isDeleted",
              });

            if (!user) {
              return next(
                CustomError.authentication("User not found", {
                  userId: refreshDecoded.userId,
                })
              );
            }

            // Status checks for user
            const userStatus = checkUserStatus(user);
            if (userStatus.status) {
              return next(
                CustomError.authentication(userStatus.message, {
                  userId: user._id,
                  reason: userStatus.errorCode,
                })
              );
            }

            // Attach refreshed user data
            socket.user = user;
            socket.isRefreshed = true;
            return next();
          } catch (refreshError) {
            return next(
              CustomError.authentication(
                refreshError.name === "TokenExpiredError"
                  ? "Refresh token expired"
                  : "Invalid refresh token",
                {
                  errorName: refreshError.name,
                  reason: "Token refresh failed",
                }
              )
            );
          }
        } else {
          throw accessTokenError;
        }
      }
    }

    // If we have a valid decoded token from access token
    if (decoded) {
      user = await User.findById(decoded.userId)
        .populate({ path: "organization", select: "name isDeleted" })
        .populate({
          path: "department",
          select: "name organization isDeleted",
        });
    }

    if (!user) {
      return next(
        CustomError.authentication("User not found", {
          userId: decoded?.userId,
        })
      );
    }

    // Status checks for user
    const userStatus = checkUserStatus(user);
    if (userStatus.status) {
      return next(
        CustomError.authentication(userStatus.message, {
          userId: user._id,
          reason: userStatus.errorCode,
        })
      );
    }

    // Attach user data to socket
    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    return next(
      CustomError.authentication("Authentication failed", {
        errorMessage: error.message,
        errorName: error.name,
      })
    );
  }
};

const setupSocketIO = (server, corsSocketOptions) => {
  try {
    const io = new SocketIOServer(server, {
      cors: corsSocketOptions,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true,
      },
      pingInterval: 10000, // 10 seconds
      pingTimeout: 5000, // 5 seconds
      connectTimeout: 45000, // 45 seconds
    });

    io.use(socketAuth);

    io.on("connection", (socket) => {
      const userId = socket.user._id.toString();
      const departmentId = socket.user.department._id.toString();
      const organizationId = socket.user.organization._id.toString();

      console.log(
        `Socket connected, SocketId: ${socket.id} | User: ${userId} | Org: ${organizationId}`
      );

      // Store connection info
      activeConnections.set(socket.id, {
        userId,
        departmentId,
        organizationId,
        connectedAt: new Date(),
      });

      // Join relevant rooms for targeted messaging
      socket.join(`user:${userId}`);
      socket.join(`dept:${departmentId}`);
      socket.join(`org:${organizationId}`);

      // Handle token refresh requests from client
      socket.on("refresh_token", async (callback) => {
        try {
          const refreshToken = extractRefreshToken(
            socket.handshake.headers.cookie
          );

          if (!refreshToken) {
            if (callback)
              callback({ success: false, error: "No refresh token" });
            return;
          }

          const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
          );
          const user = await User.findById(decoded.userId)
            .populate({ path: "organization", select: "name isDeleted" })
            .populate({
              path: "department",
              select: "name organization isDeleted",
            });

          if (!user) {
            if (callback) callback({ success: false, error: "User not found" });
            return;
          }

          const userStatus = checkUserStatus(user);
          if (userStatus.status) {
            if (callback)
              callback({ success: false, error: userStatus.message });
            return;
          }

          // Generate new access token
          const newAccessToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRATION || "15m" }
          );

          if (callback)
            callback({
              success: true,
              accessToken: newAccessToken,
            });
        } catch (error) {
          console.error("Token refresh error:", error);
          if (callback)
            callback({
              success: false,
              error:
                error.name === "TokenExpiredError"
                  ? "Refresh token expired"
                  : "Token refresh failed",
            });
        }
      });

      // Handle custom events with rate limiting
      const eventTimestamps = new Map();

      socket.on("custom_event", (data) => {
        const now = Date.now();
        const lastEvent = eventTimestamps.get(socket.id) || 0;

        // Rate limiting: max 10 events per second
        if (now - lastEvent < 100) {
          socket.emit("error", {
            message: "Rate limit exceeded",
            code: "RATE_LIMIT_ERROR",
          });
          return;
        }

        eventTimestamps.set(socket.id, now);
        // Handle custom event logic here
      });

      socket.on("disconnect", (reason) => {
        console.log(
          `Socket disconnected (${reason}): ${socket.id} | User: ${userId}`
        );

        // Clean up rooms and tracking
        socket.leave(`user:${userId}`);
        socket.leave(`dept:${departmentId}`);
        socket.leave(`org:${organizationId}`);
        activeConnections.delete(socket.id);
        eventTimestamps.delete(socket.id);
      });

      socket.on("error", (err) => {
        console.error(`Socket error: ${socket.id} | ${err.message}`);
      });

      // Send connection confirmation
      socket.emit("connected", {
        message: "Successfully connected",
        userId,
        organizationId,
        departmentId,
        isRefreshed: socket.isRefreshed || false,
      });
    });

    // Graceful cleanup on server shutdown
    const gracefulShutdown = () => {
      console.log("Starting Socket.IO graceful shutdown...");
      io.emit("server_shutdown", {
        message: "Server is shutting down",
        timestamp: new Date(),
      });

      // Disconnect all clients
      io.disconnectSockets(true);
      activeConnections.clear();
    };

    // Handle process signals for graceful shutdown
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    io.engine.on("connection_error", (err) => {
      console.error(`Socket.IO connection error: ${err.message}`);
    });

    return io;
  } catch (err) {
    console.error(`Socket.IO setup failed: ${err.message}`);
    throw err;
  }
};

export { activeConnections };
export default setupSocketIO;
