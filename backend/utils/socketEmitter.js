// backend/utils/socketEmitter.js
import mongoose from "mongoose";
import { HEAD_OF_DEPARTMENT_ROLES } from "./constants.js";
import { getIO } from "./socketInstance.js";
import { activeConnections } from "./socket.js";

/**
 * Check if user is currently connected
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {boolean}
 */
export function isUserConnected(userId) {
  const userIdStr = String(userId);
  for (const connection of activeConnections.values()) {
    if (connection.userId === userIdStr) return true;
  }
  return false;
}

/**
 * Get all connected users in organization
 * @param {string|mongoose.Types.ObjectId} organizationId
 * @returns {Array<string>} array of user IDs
 */
export function getConnectedUsersInOrganization(organizationId) {
  const orgIdStr = String(organizationId);
  const connectedUsers = [];

  for (const connection of activeConnections.values()) {
    if (connection.organizationId === orgIdStr) {
      connectedUsers.push(connection.userId);
    }
  }
  return connectedUsers;
}

/**
 * Get connection statistics
 * @returns {Object} connection stats
 */
export function getConnectionStats() {
  const stats = {
    totalConnections: activeConnections.size,
    connectionsByOrganization: {},
    connectionsByDepartment: {},
  };

  for (const connection of activeConnections.values()) {
    // Count by organization
    stats.connectionsByOrganization[connection.organizationId] =
      (stats.connectionsByOrganization[connection.organizationId] || 0) + 1;

    // Count by department
    stats.connectionsByDepartment[connection.departmentId] =
      (stats.connectionsByDepartment[connection.departmentId] || 0) + 1;
  }

  return stats;
}

/**
 * Emit to a single user with connection check
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string} event
 * @param {any} payload
 * @returns {boolean} success status
 */
export function emitToUser(userId, event, payload) {
  const io = getIO();
  if (!io) return false;

  const userIdStr = String(userId);
  if (!isUserConnected(userIdStr)) {
    console.warn(
      `User ${userIdStr} is not connected, event "${event}" not delivered`
    );
    return false;
  }

  io.to(`user:${userIdStr}`).emit(event, payload);
  return true;
}

/**
 * Emit to multiple recipients with connection awareness
 * @param {Array<string|mongoose.Types.ObjectId>} userIds
 * @param {string} event
 * @param {any} payload
 * @returns {number} number of users actually notified
 */
export function emitToRecipients(userIds, event, payload) {
  const io = getIO();
  if (!io || !Array.isArray(userIds) || userIds.length === 0) return 0;

  let deliveredCount = 0;
  const rooms = [];

  userIds.forEach((id) => {
    const userIdStr = String(id);
    if (isUserConnected(userIdStr)) {
      rooms.push(`user:${userIdStr}`);
      deliveredCount++;
    }
  });

  if (rooms.length > 0) {
    io.to(rooms).emit(event, payload);
  }

  return deliveredCount;
}

/**
 * Emit to all HODs (Admin & SuperAdmin) within a department
 * Only emits to currently connected HODs
 * @param {string|mongoose.Types.ObjectId} departmentId
 * @param {string} event
 * @param {any} payload
 * @returns {Promise<number>} number of HODs notified
 */
export async function emitToHODs(departmentId, event, payload) {
  const io = getIO();
  if (!io) return 0;

  const User = mongoose.model("User");
  const hods = await User.find({
    department: departmentId,
    role: { $in: HEAD_OF_DEPARTMENT_ROLES },
    isDeleted: false,
  }).select("_id");

  return emitToRecipients(
    hods.map((u) => u._id),
    event,
    payload
  );
}

/**
 * Emit to entire department room
 * @param {string|mongoose.Types.ObjectId} departmentId
 * @param {string} event
 * @param {any} payload
 */
export function emitToDepartment(departmentId, event, payload) {
  const io = getIO();
  io.to(`dept:${String(departmentId)}`).emit(event, payload);
}

/**
 * Emit to entire organization room
 * @param {string|mongoose.Types.ObjectId} organizationId
 * @param {string} event
 * @param {any} payload
 */
export function emitToOrganization(organizationId, event, payload) {
  const io = getIO();
  io.to(`org:${String(organizationId)}`).emit(event, payload);
}

/**
 * Broadcast to all connected users
 * @param {string} event
 * @param {any} payload
 */
export function broadcastToAll(event, payload) {
  const io = getIO();
  io.emit(event, payload);
}

/**
 * Force disconnect a specific user
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {boolean} success status
 */
export function disconnectUser(userId) {
  const io = getIO();
  if (!io) return false;

  const userIdStr = String(userId);
  let disconnected = false;

  // Find all sockets for this user and disconnect them
  for (const [socketId, connection] of activeConnections.entries()) {
    if (connection.userId === userIdStr) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        disconnected = true;
      }
    }
  }

  return disconnected;
}
