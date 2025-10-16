// backend/utils/socketInstance.js
// Centralized Socket.IO instance management
let ioInstance = null;

export const setIO = (io) => {
  if (ioInstance) {
    console.warn(
      "Socket.IO instance is being reinitialized. Previous instance will be replaced."
    );
  }
  ioInstance = io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO instance not initialized. Call setIO() first.");
  }
  return ioInstance;
};

// Helper to check if Socket.IO is initialized
export const isIOInitialized = () => {
  return ioInstance !== null;
};
