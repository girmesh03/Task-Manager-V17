// backend/routes/index.js
import express from "express";
import { apiLimiter } from "../middlewares/rateLimiter.js";

// Import all route modules
import AuthRoutes from "./authRoutes.js";
import OrganizationRoutes from "./organizationRoutes.js";
import DepartmentRoutes from "./departmentRoutes.js";
import UserRoutes from "./userRoutes.js";
import TaskRoutes from "./taskRoutes.js";
import VendorRoutes from "./vendorRoutes.js";
import MaterialRoutes from "./materialRoutes.js";
import NotificationRoutes from "./notificationRoutes.js";
import AttachmentRoutes from "./attachmentRoutes.js";

const router = express.Router();

// Apply general API rate limiting to all routes
if (process.env.NODE_ENV === "production") {
  router.use(apiLimiter);
}

// Authentication routes (has its own stricter rate limiting)
router.use("/auth", AuthRoutes);

// Resource routes
router.use("/organizations", OrganizationRoutes);
router.use("/departments", DepartmentRoutes);
router.use("/users", UserRoutes);
router.use("/tasks", TaskRoutes);
router.use("/vendors", VendorRoutes);
router.use("/materials", MaterialRoutes);
router.use("/notifications", NotificationRoutes);
router.use("/attachments", AttachmentRoutes);

export default router;
