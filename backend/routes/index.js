// backend/routes/index.js
// Requirements: 21, 42, 162, 294, 358-364, 411
import express from "express";

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

// Note: General API rate limiting (100/15min) is applied in app.js
// Auth routes have their own stricter rate limiting (5/15min)

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
