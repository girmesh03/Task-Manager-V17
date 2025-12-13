// client/src/services/socketEvents.js
import { toast } from "react-toastify";
import { store } from "../redux/app/store";
import { SOCKET_EVENTS } from "../utils/constants";
import { apiSlice } from "../redux/features/api";
import {
  incrementUnreadCount,
  decrementUnreadCount,
} from "../redux/features/notification/notificationSlice";

/**
 * Socket.IO Event Handlers
 * 
 * Handles all Socket.IO events from the server and updates the application state.
 * Invalidates RTK Query cache to trigger refetch of updated data.
 * 
 * @param {Socket} socket - Socket.IO client instance
 */
export const handleSocketEvents = (socket) => {
  // ==================== TASK EVENTS ====================

  /**
   * Task Created Event
   */
  socket.on(SOCKET_EVENTS.TASK_CREATED, (data) => {
    console.log("Task created:", data);
    
    // Invalidate tasks cache
    store.dispatch(
      apiSlice.util.invalidateTags([{ type: "Task", id: "LIST" }])
    );

    // Show toast notification
    toast.info(`New task created: ${data.task?.title || "Untitled"}`);
  });

  /**
   * Task Updated Event
   */
  socket.on(SOCKET_EVENTS.TASK_UPDATED, (data) => {
    console.log("Task updated:", data);
    
    // Invalidate specific task and list cache
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Task", id: data.task?._id },
        { type: "Task", id: "LIST" },
      ])
    );

    // Show toast notification
    toast.info(`Task updated: ${data.task?.title || "Untitled"}`);
  });

  /**
   * Task Deleted Event
   */
  socket.on(SOCKET_EVENTS.TASK_DELETED, (data) => {
    console.log("Task deleted:", data);
    
    // Invalidate tasks cache
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Task", id: data.task?._id },
        { type: "Task", id: "LIST" },
      ])
    );

    // Show toast notification
    toast.warning(`Task deleted: ${data.task?.title || "Untitled"}`);
  });

  /**
   * Task Restored Event
   */
  socket.on(SOCKET_EVENTS.TASK_RESTORED, (data) => {
    console.log("Task restored:", data);
    
    // Invalidate tasks cache
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Task", id: data.task?._id },
        { type: "Task", id: "LIST" },
      ])
    );

    // Show toast notification
    toast.success(`Task restored: ${data.task?.title || "Untitled"}`);
  });

  // ==================== DEPARTMENT TASK EVENTS ====================

  socket.on(SOCKET_EVENTS.DEPT_TASK_CREATED, (data) => {
    console.log("Department task created:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([{ type: "Task", id: "LIST" }])
    );
  });

  socket.on(SOCKET_EVENTS.DEPT_TASK_UPDATED, (data) => {
    console.log("Department task updated:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Task", id: data.task?._id },
        { type: "Task", id: "LIST" },
      ])
    );
  });

  socket.on(SOCKET_EVENTS.DEPT_TASK_DELETED, (data) => {
    console.log("Department task deleted:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Task", id: data.task?._id },
        { type: "Task", id: "LIST" },
      ])
    );
  });

  socket.on(SOCKET_EVENTS.DEPT_TASK_RESTORED, (data) => {
    console.log("Department task restored:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Task", id: data.task?._id },
        { type: "Task", id: "LIST" },
      ])
    );
  });

  // ==================== ORGANIZATION TASK EVENTS ====================

  socket.on(SOCKET_EVENTS.ORG_TASK_CREATED, (data) => {
    console.log("Organization task created:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([{ type: "Task", id: "LIST" }])
    );
  });

  socket.on(SOCKET_EVENTS.ORG_TASK_UPDATED, (data) => {
    console.log("Organization task updated:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Task", id: data.task?._id },
        { type: "Task", id: "LIST" },
      ])
    );
  });

  socket.on(SOCKET_EVENTS.ORG_TASK_DELETED, (data) => {
    console.log("Organization task deleted:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Task", id: data.task?._id },
        { type: "Task", id: "LIST" },
      ])
    );
  });

  socket.on(SOCKET_EVENTS.ORG_TASK_RESTORED, (data) => {
    console.log("Organization task restored:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Task", id: data.task?._id },
        { type: "Task", id: "LIST" },
      ])
    );
  });

  // ==================== ACTIVITY EVENTS ====================

  socket.on(SOCKET_EVENTS.ACTIVITY_CREATED, (data) => {
    console.log("Activity created:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "TaskActivity", id: "LIST" },
        { type: "Task", id: data.activity?.parentTask },
      ])
    );
  });

  socket.on(SOCKET_EVENTS.ACTIVITY_UPDATED, (data) => {
    console.log("Activity updated:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "TaskActivity", id: data.activity?._id },
        { type: "TaskActivity", id: "LIST" },
      ])
    );
  });

  socket.on(SOCKET_EVENTS.ACTIVITY_DELETED, (data) => {
    console.log("Activity deleted:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "TaskActivity", id: data.activity?._id },
        { type: "TaskActivity", id: "LIST" },
      ])
    );
  });

  // ==================== COMMENT EVENTS ====================

  socket.on(SOCKET_EVENTS.COMMENT_CREATED, (data) => {
    console.log("Comment created:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "TaskComment", id: "LIST" },
        { type: "Task", id: data.comment?.parentTask },
      ])
    );
    
    // Show toast if it's a mention
    if (data.comment?.mentions?.length > 0) {
      toast.info("You were mentioned in a comment");
    }
  });

  socket.on(SOCKET_EVENTS.COMMENT_UPDATED, (data) => {
    console.log("Comment updated:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "TaskComment", id: data.comment?._id },
        { type: "TaskComment", id: "LIST" },
      ])
    );
  });

  socket.on(SOCKET_EVENTS.COMMENT_DELETED, (data) => {
    console.log("Comment deleted:", data);
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "TaskComment", id: data.comment?._id },
        { type: "TaskComment", id: "LIST" },
      ])
    );
  });

  // ==================== NOTIFICATION EVENTS ====================

  /**
   * Notification Created Event
   */
  socket.on(SOCKET_EVENTS.NOTIFICATION_CREATED, (data) => {
    console.log("Notification created:", data);
    
    // Invalidate notifications cache
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ])
    );

    // Increment unread count
    store.dispatch(incrementUnreadCount());

    // Show toast notification
    if (data.notification) {
      toast.info(data.notification.title, {
        autoClose: 5000,
      });
    }
  });

  /**
   * Notification Read Event
   */
  socket.on(SOCKET_EVENTS.NOTIFICATION_READ, (data) => {
    console.log("Notification read:", data);
    
    // Invalidate notifications cache
    store.dispatch(
      apiSlice.util.invalidateTags([
        { type: "Notification", id: data.notification?._id },
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ])
    );

    // Decrement unread count
    store.dispatch(decrementUnreadCount());
  });
};

/**
 * Cleanup socket event listeners
 * 
 * @param {Socket} socket - Socket.IO client instance
 */
export const cleanupSocketEvents = (socket) => {
  if (!socket) return;

  // Remove all custom event listeners
  Object.values(SOCKET_EVENTS).forEach((event) => {
    socket.off(event);
  });
};
